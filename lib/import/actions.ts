'use server';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { asLocale } from '@/i18n/locale';
import { aiEnabled } from '@/lib/ai/extract';
import { sendInvitation } from '@/lib/invitations/email';
import { readPdfDirectory } from '@/lib/import/ai';
import { normalizeRow, normalizeSheet, type ImportRow } from '@/lib/import/normalize';
import { checkImportFile, IMPORT_MIME, readSheet } from '@/lib/import/parse';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

/**
 * Existing-member import (docs/13, actions imp.*; staff reg ≥ 2, roll back reg ≥ 3). Upload → the file is read and
 * every row checked → a preview is stored (nothing in the register changes) → the admin decides row by row → commit
 * after typing IMPORT. The database repeats every check and every permission (migration 0360). The pages that show
 * imports are rendered per request (force-dynamic), so a router refresh on the client shows the new state.
 */

export interface ImportResult {
  ok: boolean;
  message: string;
  id?: string;
}

/** one batch of invitations to imported members (imp.invite) */
export interface InviteBatch extends ImportResult {
  sent: number;
  failed: number;
  /** still to be sent after this batch (0 = done) */
  left: number;
}

const id = z.string().uuid();

function fail(locale: Locale, error: unknown, what: string): ImportResult {
  if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'imp.errors.notAllowed') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: msg(locale, 'imp.errors.notAllowed') };
  const known = ['empty', 'too_many', 'file', 'closed', 'not_found', 'cannot_create', 'cannot_update', 'platform_member', 'confirm', 'decision'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint)) return { ok: false, message: msg(locale, `imp.errors.${e.hint}`) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: msg(locale, 'imp.errors.generic') };
}

/** imp.file: read and check the uploaded register; store it privately with a preview of every row */
export async function uploadImport(form: FormData): Promise<ImportResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('reg', 2);
    const file = form.get('file');
    if (!(file instanceof File)) return { ok: false, message: msg(locale, 'imp.errors.noFile') };
    const name = file.name.replace(/[^\w .()-]+/g, '_').slice(0, 120) || 'members';
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkImportFile(bytes, name);
    if ('problem' in check) return { ok: false, message: msg(locale, `imp.errors.${check.problem}`) };
    const source = check.source;

    let rows: ImportRow[];
    let note = '';
    if (source === 'pdf') {
      // a PDF can only be read by AI: only with AI reading on, and only after the admin agreed for this file
      if (!aiEnabled()) return { ok: false, message: msg(locale, 'imp.errors.pdfNoAi') };
      if (form.get('aiConsent') !== 'on') return { ok: false, message: msg(locale, 'imp.errors.pdfConsent') };
      let reading;
      try {
        reading = await readPdfDirectory(bytes);
      } catch (error) {
        console.error('imp.pdf reading failed', (error as Error)?.name);
        return { ok: false, message: msg(locale, error instanceof SyntaxError ? 'imp.errors.pdfTooLong' : 'imp.errors.pdfFailed') };
      }
      if (!reading.rows.length) return { ok: false, message: msg(locale, 'imp.errors.pdfNothing') };
      rows = reading.rows.map((r) => normalizeRow(r.cells, r.confidence));
      if (reading.truncated) note = ` ${msg(locale, 'imp.done.truncated')}`;
    } else {
      const sheet = readSheet(bytes, source);
      if ('problem' in sheet) return { ok: false, message: msg(locale, `imp.errors.${sheet.problem}`) };
      const result = normalizeSheet(sheet);
      if ('problem' in result) return { ok: false, message: msg(locale, `imp.errors.${result.problem}`) };
      rows = result.rows;
      if (result.ignored.length) note = ` ${msg(locale, 'imp.done.ignored', { cols: result.ignored.slice(0, 8).join(', ') })}`;
    }

    const supabase = await createClient();
    const ext = name.match(/\.(csv|txt|xlsx|xls|pdf)$/i)?.[1]?.toLowerCase() ?? source;
    const path = `${randomUUID()}/${Date.now()}.${ext === 'txt' ? 'csv' : ext}`;
    const up = await supabase.storage.from('imports').upload(path, bytes, { contentType: IMPORT_MIME[source], upsert: false });
    if (up.error) {
      console.error('imp.file upload failed', up.error.name);
      return { ok: false, message: msg(locale, 'imp.errors.generic') };
    }
    const { data, error } = await supabase.schema('api').rpc('import_stage', {
      p_file_path: path,
      p_file_name: name,
      p_source: source,
      p_ai: source === 'pdf',
      p_rows: rows.map((r) => ({ data: r.data, raw: r.raw, issues: r.issues, ...(r.confidence === undefined ? {} : { confidence: r.confidence }) })) as unknown as Json,
    });
    if (error) throw error;
    const s = data?.[0];
    if (!s) return { ok: false, message: msg(locale, 'imp.errors.generic') };
    return {
      ok: true,
      id: s.import_id,
      message:
        msg(locale, 'imp.done.staged', {
          total: String(s.rows_total),
          new: String(s.rows_new),
          exists: String(s.rows_exists),
          possible: String(s.rows_possible),
          errors: String(s.rows_error),
        }) + note,
    };
  } catch (error) {
    return fail(locale, error, 'imp.file');
  }
}

export async function decideImportRow(locale: Locale, importId: string, row: number, decision: 'create' | 'update' | 'skip'): Promise<ImportResult> {
  try {
    await requirePermission('reg', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('import_decide', {
      p_import: id.parse(importId),
      p_row: z.number().int().min(1).parse(row),
      p_decision: z.enum(['create', 'update', 'skip']).parse(decision),
    });
    if (error) throw error;
    return { ok: true, message: msg(locale, `imp.done.decided_${decision}`, { row: String(row) }) };
  } catch (error) {
    return fail(locale, error, 'imp.decide');
  }
}

/** imp.commit: one transaction; the admin typed IMPORT after seeing what will be created and updated */
export async function commitImport(locale: Locale, importId: string, confirm: string): Promise<ImportResult> {
  try {
    await requirePermission('reg', 2);
    if (confirm.trim() !== 'IMPORT') return { ok: false, message: msg(locale, 'imp.errors.confirm') };
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('import_commit', { p_import: id.parse(importId), p_confirm: 'IMPORT' });
    if (error) throw error;
    const r = data?.[0];
    if (!r) return { ok: false, message: msg(locale, 'imp.errors.generic') };
    return {
      ok: true,
      id: importId,
      message: msg(locale, 'imp.done.committed', {
        created: String(r.created),
        updated: String(r.updated),
        skipped: String(r.skipped),
        failed: String(r.failed),
      }),
    };
  } catch (error) {
    return fail(locale, error, 'imp.commit');
  }
}

export async function discardImport(locale: Locale, importId: string): Promise<ImportResult> {
  try {
    await requirePermission('reg', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('import_discard', { p_import: id.parse(importId) });
    if (error) throw error;
    return { ok: true, message: msg(locale, 'imp.done.discarded') };
  } catch (error) {
    return fail(locale, error, 'imp.discard');
  }
}

export async function rollbackImport(locale: Locale, importId: string): Promise<ImportResult> {
  try {
    await requirePermission('reg', 3);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('import_rollback', { p_import: id.parse(importId) });
    if (error) throw error;
    const r = data?.[0];
    return { ok: true, id: importId, message: msg(locale, 'imp.done.rolledBack', { removed: String(r?.removed ?? 0), kept: String(r?.kept ?? 0) }) };
  } catch (error) {
    return fail(locale, error, 'imp.rollback');
  }
}

/**
 * imp.invite (migration 0406): emails the next batch of invitations to the members a committed import created or
 * updated — each as the Owner of their company, to the email in the sheet. The page calls it until nothing is left,
 * so a large sheet never meets the request time limit; the database skips companies with someone already signed in.
 */
export async function inviteImported(locale: Locale, importId: string, retry = false): Promise<InviteBatch> {
  const none = { sent: 0, failed: 0, left: 0 };
  try {
    const actor = await requirePermission('reg', 2);
    const imp = id.parse(importId);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('import_invite_next', { p_import: imp, p_limit: 10, p_retry: retry });
    if (error) throw error;
    let sent = 0;
    let failed = 0;
    for (const r of data ?? []) {
      const ok = await sendInvitation({
        kind: 'company_user',
        to: r.email,
        name: r.full_name,
        inviter: actor.access.full_name || 'MCCI',
        company: r.company,
        role: 'Owner',
        token: r.token,
      });
      await supabase.schema('api').rpc('import_invite_mark', { p_import: imp, p_row: r.row_no, p_ok: ok });
      if (ok) sent++;
      else failed++;
    }
    const { count } = await supabase
      .from('import_rows')
      .select('row_no', { count: 'exact', head: true })
      .eq('import_id', imp)
      .in('result', ['created', 'updated'])
      .is('invite_status', null);
    const left = (data?.length ?? 0) === 0 ? 0 : (count ?? 0);
    return { ok: true, id: importId, sent, failed, left, message: msg(locale, 'imp.invite.batch', { sent: String(sent), failed: String(failed) }) };
  } catch (error) {
    return { ...fail(locale, error, 'imp.invite'), ...none };
  }
}
