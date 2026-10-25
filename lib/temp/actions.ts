'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { voucherDate } from '@/lib/committee/voucher';
import { bilingualEmail } from '@/lib/email/bilingual';
import { sendEmail } from '@/lib/email/send';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Temporary membership and the QR registry (actions temp.issue — temp ≥ 2; temp.extend, temp.revoke — temp ≥ 3;
 * qr.revoke — docs ≥ 3; docs/06). The api.* functions of migration 0340 check again and write history and audit.
 */

export interface TempResult {
  ok: boolean;
  message: string;
}

const uuid = z.string().uuid();
const reason = z.string().trim().min(3).max(500);
const refresh = () => {
  for (const p of ['admin/temp', 'admin/documents', 'admin', 'admin/payments', 'portal', 'portal/documents', 'portal/membership'])
    revalidatePath(`/[locale]/${p}`, 'page');
};

function fail(locale: Locale, error: unknown, what: string): TempResult {
  const t = (k: string) => msg(locale, `temp.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  const known = ['reason_required', 'wrong_status', 'max_extensions', 'wrong_stage', 'not_paid', 'not_found'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}

async function mail(
  row: { email_id: number | null; to_email: string | null; name: string | null } | undefined,
  subject: string,
  body: string,
  vars: Record<string, string>,
): Promise<boolean> {
  if (!row?.email_id || !row.to_email) return false;
  const supabase = await createClient();
  try {
    const id = await sendEmail(
      bilingualEmail({
        to: row.to_email,
        name: row.name,
        subject,
        paragraphs: [body],
        vars,
        action: { label: 'pay.email.openDocuments', path: '/portal/documents' },
      }),
    );
    await supabase.schema('api').rpc('email_mark', { p_email: row.email_id, p_ok: true, p_provider_id: id });
    return true;
  } catch (error) {
    await supabase
      .schema('api')
      .rpc('email_mark', { p_email: row.email_id, p_ok: false, p_error: (error as Error)?.message?.slice(0, 200) ?? 'not sent' });
    return false;
  }
}

export async function issueTemp(locale: Locale, appId: string): Promise<TempResult> {
  try {
    await requirePermission('temp', 2);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('temp_issue', { p_app: uuid.parse(appId) });
    if (error) throw error;
    refresh();
    const r = data?.[0];
    const sent = await mail(r, 'pay.email.tempSubject', 'pay.email.tempBody', {
      no: r?.member_no ?? '',
      code: r?.code ?? '',
      until: r?.expires_at ? voucherDate(r.expires_at, 'en') : '',
    });
    const message = msg(locale, 'temp.done.issued', { no: r?.member_no ?? '' });
    return { ok: true, message: sent ? message : `${message} ${msg(locale, 'pay.done.emailFailed')}` };
  } catch (error) {
    return fail(locale, error, 'temp.issue');
  }
}

export async function extendTemp(locale: Locale, tempId: string, why: string): Promise<TempResult> {
  try {
    await requirePermission('temp', 3);
    const text = reason.safeParse(why);
    if (!text.success) return { ok: false, message: msg(locale, 'temp.errors.reason_required') };
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('api')
      .rpc('temp_extend', { p_temp: uuid.parse(tempId), p_reason: text.data });
    if (error) throw error;
    refresh();
    const r = data?.[0];
    await mail(r, 'temp.email.extendedSubject', 'temp.email.extendedBody', {
      until: r?.expires_at ? voucherDate(r.expires_at, 'en') : '',
    });
    return {
      ok: true,
      message: msg(locale, 'temp.done.extended', { until: r?.expires_at ? voucherDate(r.expires_at, locale) : '' }),
    };
  } catch (error) {
    return fail(locale, error, 'temp.extend');
  }
}

export async function revokeTemp(locale: Locale, tempId: string, why: string): Promise<TempResult> {
  try {
    await requirePermission('temp', 3);
    const text = reason.safeParse(why);
    if (!text.success) return { ok: false, message: msg(locale, 'temp.errors.reason_required') };
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('temp_revoke', { p_temp: uuid.parse(tempId), p_reason: text.data });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'temp.done.revoked') };
  } catch (error) {
    return fail(locale, error, 'temp.revoke');
  }
}

export async function revokeDocument(locale: Locale, code: string, why: string): Promise<TempResult> {
  try {
    await requirePermission('docs', 3);
    const text = reason.safeParse(why);
    if (!text.success) return { ok: false, message: msg(locale, 'temp.errors.reason_required') };
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('qr_revoke', { p_code: z.string().regex(/^MCCI-QR-[A-Z0-9]{5}-[A-Z0-9]{5}$/).parse(code), p_reason: text.data });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'temp.done.docRevoked', { code }) };
  } catch (error) {
    return fail(locale, error, 'qr.revoke');
  }
}
