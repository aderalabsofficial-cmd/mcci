'use server';

import { createHash, randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { aiEnabled } from '@/lib/ai/extract';
import { readScan, removeScan, replaceScan, storeScan } from '@/lib/certificates/admin';
import { readCertificate } from '@/lib/certificates/ai';
import { DEFAULT_PLACEMENT, type QrPlacement, stampQr } from '@/lib/certificates/stamp';
import { MAX_UPLOAD_BYTES, sniff } from '@/lib/files/sniff';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { signingConfigured } from '@/lib/qr/sign';
import { verifyUrl } from '@/lib/qr/svg';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

/**
 * Certificates printed by the security press (docs/21 point 30, migration 0450): cert.upload, cert.confirm,
 * cert.reject, qr.revoke. Module 'temp' (the certificates module): upload / review ≥ 2, override a conflict ≥ 3,
 * revoke a QR: docs ≥ 3. Files are stored and read with the service role only after the permission check; every
 * record change is an api.* call under the staff member's own session (the database checks again and audits).
 * Nothing is saved from a reading until a person confirms it.
 */

export interface CertResult {
  ok: boolean;
  message: string;
}

const MAX_FILES = 20;
const uuid = z.string().uuid();
const refresh = () => revalidatePath('/[locale]/admin/temp', 'page');

function fail(locale: Locale, error: unknown, what: string): CertResult {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `certs.errors.${k}`, v);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  const known = ['duplicate', 'wrong_stage', 'not_found', 'demo', 'conflicts', 'reason_required', 'path'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}

/** cert.upload: one or more scans (JPG / PNG); each is stored, registered and read; duplicates are refused */
export async function uploadScans(form: FormData): Promise<CertResult & { added?: number }> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('temp', 2);
    const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return { ok: false, message: msg(locale, 'certs.errors.noFile') };
    if (files.length > MAX_FILES)
      return { ok: false, message: msg(locale, 'certs.errors.tooMany', { n: String(MAX_FILES) }) };
    const supabase = await createClient();
    const problems: string[] = [];
    let added = 0;
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const kind = sniff(bytes);
      if (bytes.length > MAX_UPLOAD_BYTES) {
        problems.push(msg(locale, 'certs.errors.tooBig', { name: file.name }));
        continue;
      }
      if (kind !== 'png' && kind !== 'jpeg') {
        problems.push(msg(locale, 'certs.errors.type', { name: file.name }));
        continue;
      }
      const id = randomUUID();
      const path = `scans/${id}/original.${kind === 'png' ? 'png' : 'jpg'}`;
      const sha = createHash('sha256').update(bytes).digest('hex');
      await storeScan(path, bytes, kind === 'png' ? 'image/png' : 'image/jpeg');
      const { error } = await supabase
        .schema('api')
        .rpc('cert_scan_register', { p_id: id, p_path: path, p_sha256: sha, p_file_name: file.name.slice(0, 200) });
      if (error) {
        await removeScan(path);
        if (error.hint === 'duplicate') {
          problems.push(msg(locale, 'certs.errors.duplicateFile', { name: file.name }));
          continue;
        }
        throw error;
      }
      // the reading (or "unreadable" when AI is off or fails); the database matches the member and lists conflicts
      const reading = aiEnabled() ? await readCertificate(bytes, kind) : null;
      const { error: ex } = await supabase
        .schema('api')
        .rpc('cert_scan_extracted', { p_id: id, p_data: (reading ?? null) as unknown as Json });
      if (ex) throw ex;
      added++;
    }
    refresh();
    const done = msg(locale, 'certs.done.uploaded', { n: String(added) });
    return { ok: added > 0, added, message: problems.length ? `${done} ${problems.join(' ')}` : done };
  } catch (error) {
    return fail(locale, error, 'cert.upload');
  }
}

/** cert.confirm: a person confirms the scan for a member; QR document created; the QR is stamped on the scan */
export async function confirmScan(
  locale: Locale,
  scanId: string,
  memberId: string,
  override: boolean,
  note: string,
): Promise<CertResult> {
  try {
    await requirePermission('temp', 2);
    // every issued certificate carries a signed QR (docs/26): without the server's signing key nothing is issued —
    // checked before the QR document is created, so no unsigned certificate can exist
    if (!signingConfigured()) return { ok: false, message: msg(locale, 'certs.errors.noSigningKey') };
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('cert_scan_confirm', {
      p_id: uuid.parse(scanId),
      p_member: uuid.parse(memberId),
      p_override: override,
      p_note: z.string().trim().max(1000).parse(note) || undefined,
    });
    if (error) throw error;
    const row = data?.[0];
    if (!row?.code) return fail(locale, new Error('no code'), 'cert.confirm');
    // stamp the QR on the scan (top-right) and keep the stamped copy beside the original
    const { data: scan } = await supabase.from('certificate_scans').select('path').eq('id', scanId).single();
    const original = await readScan(scan!.path);
    // where the QR goes: settings.membership.certificateQr (MCCI can move it), else the measured default
    const { data: rules } = await supabase
      .from('public_settings')
      .select('value')
      .eq('key', 'membership')
      .maybeSingle();
    const at = {
      ...DEFAULT_PLACEMENT,
      ...(((rules?.value ?? {}) as { certificateQr?: Partial<QrPlacement> }).certificateQr ?? {}),
    };
    const stamped = await stampQr(original, row.code, verifyUrl(row.code), at);
    const out = `scans/${scanId}/stamped.png`;
    await replaceScan(out, stamped);
    const { error: st } = await supabase.schema('api').rpc('cert_scan_stamped', { p_id: scanId, p_path: out });
    if (st) throw st;
    refresh();
    return { ok: true, message: msg(locale, 'certs.done.confirmed', { no: row.member_no ?? '', code: row.code }) };
  } catch (error) {
    return fail(locale, error, 'cert.confirm');
  }
}

/** cert.reject: not a certificate (or not MCCI's); with the reason */
export async function rejectScan(locale: Locale, scanId: string, note: string): Promise<CertResult> {
  try {
    await requirePermission('temp', 2);
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('cert_scan_reject', { p_id: uuid.parse(scanId), p_note: z.string().trim().min(3).max(1000).parse(note) });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'certs.done.rejected') };
  } catch (error) {
    return fail(locale, error, 'cert.reject');
  }
}
