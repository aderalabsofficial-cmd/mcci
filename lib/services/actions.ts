'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { asLocale } from '@/i18n/locale';
import { aiEnabled } from '@/lib/ai/extract';
import { bilingualEmail } from '@/lib/email/bilingual';
import { sendEmail } from '@/lib/email/send';
import { checkUpload, EXT, MIME, type FileKind } from '@/lib/files/sniff';
import { msg } from '@/lib/nav/model';
import { PermissionError, requireCompanyPermission, requirePermission, requireUser } from '@/lib/permissions/server';
import { readServiceDocuments } from '@/lib/services/ai';
import { createClient } from '@/lib/supabase/server';

/**
 * Service requests (M7, migration 0380; actions svc.*, svcset.edit, sla.rules). Every step is checked again in the
 * database (company role, membership in good standing, designation level with 2-step login, state). Emails go after
 * the change is saved and their outcome is recorded (api.email_mark).
 */

export interface SvcResult {
  ok: boolean;
  message: string;
  token?: string;
  id?: string;
  values?: Record<string, string>;
  /** the document the server stored (svc.file), shown at once */
  doc?: { id: string; file_name: string };
  confidence?: Record<string, number>;
}

const uuid = z.string().uuid();
const text = (min: number, max: number) => z.string().trim().min(min).max(max);

function fail(locale: Locale, error: unknown, what: string): SvcResult {
  const t = (k: string) => msg(locale, `svc.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  const known = ['not_member', 'service', 'too_many', 'locked', 'fields', 'documents', 'wrong_status', 'reason_required', 'not_paid', 'not_found', 'lists'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}

const refresh = () => {
  for (const p of ['portal/apply', 'portal/applications', 'portal/application', 'admin/applications', 'admin/review', 'admin/sla', 'admin/approvals', 'admin/services', 'portal/payments', 'admin/payments', 'admin/psid', 'admin/documents', 'portal/documents'])
    revalidatePath(`/[locale]/${p}`, 'page');
};

type Mailed = { email_id: number | null; to_email: string | null; name: string | null; token: string | null; service: string | null };

/** service_received / service_returned / service_rejected / service_issued — after the database has the change */
async function deliver(template: string, row: Mailed | undefined, vars: Record<string, string> = {}, quote: string | null = null): Promise<boolean> {
  if (!row?.email_id || !row.to_email) return false;
  const supabase = await createClient();
  const spec: Record<string, { subject: string; paragraphs: string[] }> = {
    service_received: { subject: 'svc.email.receivedSubject', paragraphs: ['svc.email.receivedBody', ...(vars.voucher ? ['svc.email.feeBody'] : [])] },
    service_returned: { subject: 'svc.email.returnedSubject', paragraphs: ['svc.email.returnedBody'] },
    service_rejected: { subject: 'svc.email.rejectedSubject', paragraphs: ['svc.email.rejectedBody'] },
    service_issued: { subject: 'svc.email.issuedSubject', paragraphs: ['svc.email.issuedBody'] },
  };
  const s = spec[template]!;
  try {
    const id = await sendEmail(
      bilingualEmail({
        to: row.to_email,
        name: row.name,
        subject: s.subject,
        paragraphs: s.paragraphs,
        vars: { token: row.token ?? '', service: row.service ?? '', ...vars },
        quote,
        action: { label: 'svc.email.open', path: `/portal/application?t=${row.token ?? ''}` },
      }),
    );
    await supabase.schema('api').rpc('email_mark', { p_email: row.email_id, p_ok: true, p_provider_id: id });
    return true;
  } catch (error) {
    await supabase.schema('api').rpc('email_mark', { p_email: row.email_id, p_ok: false, p_error: (error as Error)?.message?.slice(0, 200) ?? 'not sent' });
    console.error(`${template} email not sent`, (error as Error)?.name);
    return false;
  }
}

const done = (locale: Locale, key: string, vars: Record<string, string> = {}, mailed = true): SvcResult => {
  const message = msg(locale, `svc.done.${key}`, vars);
  return { ok: true, message: mailed ? message : `${message} ${msg(locale, 'svc.done.emailFailed')}` };
};

// ───────── member ─────────

export async function newRequest(locale: Locale, companyId: string, service: string): Promise<SvcResult> {
  try {
    await requireCompanyPermission(uuid.parse(companyId), 'svc', 2);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('svc_new', { p_company: companyId, p_service: text(1, 20).parse(service) });
    if (error) throw error;
    refresh();
    return { ...done(locale, 'started'), id: data?.[0]?.id, token: data?.[0]?.token };
  } catch (error) {
    return fail(locale, error, 'svc.new');
  }
}

/** svc.file: one document into the private service-docs store, under the request (storage policy checks the state) */
export async function uploadDocument(form: FormData): Promise<SvcResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requireUser();
    const id = uuid.parse(form.get('request'));
    const file = form.get('file');
    if (!(file instanceof File)) return { ok: false, message: msg(locale, 'svc.errors.upload') };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkUpload(bytes, ['pdf', 'jpeg', 'png', 'heic']);
    if ('problem' in check) return { ok: false, message: msg(locale, `membership.errors.upload.${check.problem}`) };
    const supabase = await createClient();
    const { data: r } = await supabase.from('service_requests').select('id, company_id').eq('id', id).maybeSingle();
    if (!r) return { ok: false, message: msg(locale, 'svc.errors.notAllowed') };
    const name = file.name.replace(/[^\w .()-]+/g, '_').slice(0, 120) || 'document';
    const path = `${r.company_id}/requests/${r.id}/${Date.now()}.${EXT[check.kind]}`;
    const up = await supabase.storage.from('service-docs').upload(path, bytes, { contentType: MIME[check.kind], upsert: false });
    if (up.error) return { ok: false, message: msg(locale, 'svc.errors.locked') };
    const { data: row, error } = await supabase
      .from('service_documents')
      .insert({ request_id: r.id, key: `d${Date.now()}`, path, file_name: name })
      .select('id')
      .single();
    if (error) throw error;
    refresh();
    return { ...done(locale, 'uploaded', { file: name }), doc: { id: row.id, file_name: name } };
  } catch (error) {
    return fail(locale, error, 'svc.file');
  }
}

export async function removeDocument(locale: Locale, docId: string, fileName: string): Promise<SvcResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.from('service_documents').delete().eq('id', uuid.parse(docId)).select('id');
    if (error) throw error;
    if (!data?.length) return { ok: false, message: msg(locale, 'svc.errors.locked') };
    refresh();
    return done(locale, 'removed', { file: fileName.slice(0, 120) });
  } catch (error) {
    return fail(locale, error, 'svc.filedel');
  }
}

export async function saveDetails(locale: Locale, requestId: string, values: Record<string, string>): Promise<SvcResult> {
  try {
    await requireUser();
    const data = z.record(z.string().max(80), z.string().trim().max(500)).parse(values);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('svc_save', { p_request: uuid.parse(requestId), p_data: data });
    if (error) throw error;
    refresh();
    return done(locale, 'saved');
  } catch (error) {
    return fail(locale, error, 'svc.save');
  }
}

/** svc.ai: read the uploaded documents and propose values (not saved: the member checks them first) */
export async function readWithAi(locale: Locale, requestId: string): Promise<SvcResult> {
  try {
    await requireUser();
    if (!aiEnabled()) return { ok: false, message: msg(locale, 'svc.apply.aiOff') };
    const supabase = await createClient();
    const { data: r } = await supabase.from('service_requests').select('id, service_key, draft, status').eq('id', uuid.parse(requestId)).maybeSingle();
    if (!r || !(r.draft || r.status === 'Returned')) return { ok: false, message: msg(locale, 'svc.errors.locked') };
    const [{ data: t }, { data: docs }] = await Promise.all([
      supabase.from('service_types').select('full_name_en, name_en, fields').eq('key', r.service_key).single(),
      supabase.from('service_documents').select('path, file_name').eq('request_id', r.id).order('created_at').limit(4),
    ]);
    if (!docs?.length) return { ok: false, message: msg(locale, 'svc.errors.documents') };
    const files: { bytes: Uint8Array; kind: FileKind; name: string }[] = [];
    for (const d of docs) {
      const { data: blob } = await supabase.storage.from('service-docs').download(d.path);
      if (!blob) continue;
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const c = checkUpload(bytes, ['pdf', 'jpeg', 'png']);
      if ('kind' in c) files.push({ bytes, kind: c.kind, name: d.file_name ?? 'document' });
    }
    if (!files.length) return { ok: false, message: msg(locale, 'svc.errors.ai') };
    const fields = (t?.fields ?? []) as string[];
    let reading;
    try {
      reading = await readServiceDocuments(t?.full_name_en || t?.name_en || r.service_key, fields, files);
    } catch (error) {
      console.error('svc.ai reading failed', (error as Error)?.name);
      return { ok: false, message: msg(locale, 'svc.errors.ai') };
    }
    return {
      ok: true,
      message: msg(locale, 'svc.apply.aiNote', { n: String(Object.keys(reading.values).length) }),
      values: reading.values,
      confidence: reading.confidence,
    };
  } catch (error) {
    return fail(locale, error, 'svc.ai');
  }
}

export async function submitRequest(locale: Locale, requestId: string, values: Record<string, string>): Promise<SvcResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const id = uuid.parse(requestId);
    const data = z.record(z.string().max(80), z.string().trim().max(500)).parse(values);
    const saved = await supabase.schema('api').rpc('svc_save', { p_request: id, p_data: data });
    if (saved.error) throw saved.error;
    const { data: rows, error } = await supabase.schema('api').rpc('svc_submit', { p_request: id });
    if (error) throw error;
    const row = rows?.[0];
    refresh();
    const mailed = (await deliver('service_received', row, { voucher: row?.voucher_no ?? '' })) || !row?.email_id;
    return {
      ...done(locale, row?.voucher_no ? 'submittedFee' : 'submitted', { token: row?.token ?? '', voucher: row?.voucher_no ?? '' }, mailed),
      token: row?.token ?? undefined,
    };
  } catch (error) {
    return fail(locale, error, 'svc.submit');
  }
}

export async function cancelRequest(locale: Locale, requestId: string): Promise<SvcResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('svc_cancel', { p_request: uuid.parse(requestId) });
    if (error) throw error;
    refresh();
    return done(locale, 'cancelled');
  } catch (error) {
    return fail(locale, error, 'svc.cancel');
  }
}

/** svc.fix: the corrected details (and any new document, uploaded first) go back to MCCI; the SLA restarts */
export async function resubmitRequest(locale: Locale, requestId: string, values: Record<string, string>, note: string): Promise<SvcResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const id = uuid.parse(requestId);
    const data = z.record(z.string().max(80), z.string().trim().max(500)).parse(values);
    const saved = await supabase.schema('api').rpc('svc_save', { p_request: id, p_data: data });
    if (saved.error) throw saved.error;
    const { error } = await supabase.schema('api').rpc('svc_resubmit', { p_request: id, p_note: z.string().trim().max(1000).parse(note) || undefined });
    if (error) throw error;
    refresh();
    return done(locale, 'resubmitted');
  } catch (error) {
    return fail(locale, error, 'svc.fix');
  }
}

/** svc.msg: member or staff writes on the request (RLS: company svc ≥ 2 or staff svc ≥ 2) */
export async function sendMessage(locale: Locale, requestId: string, body: string): Promise<SvcResult> {
  try {
    await requireUser();
    const b = z.string().trim().min(1).max(4000).safeParse(body);
    if (!b.success) return { ok: false, message: msg(locale, 'svc.errors.message') };
    const supabase = await createClient();
    const { error } = await supabase.from('service_messages').insert({ request_id: uuid.parse(requestId), body: b.data });
    if (error) throw error;
    refresh();
    return done(locale, 'message');
  } catch (error) {
    return fail(locale, error, 'svc.msg');
  }
}

// ───────── staff ─────────

export async function staffStep(
  locale: Locale,
  step: 'start' | 'approve' | 'return' | 'reject' | 'sign',
  requestId: string,
  note = '',
): Promise<SvcResult> {
  try {
    await requirePermission('svc', step === 'sign' ? 3 : 2);
    const supabase = await createClient();
    const id = uuid.parse(requestId);
    const api = supabase.schema('api');
    if (step === 'start' || step === 'approve') {
      const { error } = await api.rpc(step === 'start' ? 'svc_start' : 'svc_approve', { p_request: id });
      if (error) throw error;
      refresh();
      return done(locale, step === 'start' ? 'started_review' : 'approved');
    }
    if (step === 'return' || step === 'reject') {
      const n = text(3, 1000).safeParse(note);
      if (!n.success) return { ok: false, message: msg(locale, 'svc.errors.reason_required') };
      const { data, error } =
        step === 'return' ? await api.rpc('svc_return', { p_request: id, p_note: n.data }) : await api.rpc('svc_reject', { p_request: id, p_reason: n.data });
      if (error) throw error;
      refresh();
      const mailed = await deliver(step === 'return' ? 'service_returned' : 'service_rejected', data?.[0], {}, n.data);
      return done(locale, step === 'return' ? 'returned' : 'rejected', {}, mailed || !data?.[0]?.email_id);
    }
    const { data, error } = await api.rpc('svc_sign', { p_request: id });
    if (error) throw error;
    refresh();
    const row = data?.[0];
    const mailed = await deliver('service_issued', row, { code: row?.code ?? '' });
    return done(locale, 'signed', { code: row?.code ?? '' }, mailed || !row?.email_id);
  } catch (error) {
    return fail(locale, error, `svc.${step}`);
  }
}

export async function signAll(locale: Locale): Promise<SvcResult> {
  try {
    await requirePermission('svc', 3);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('svc_sign_all');
    if (error) throw error;
    refresh();
    for (const row of data ?? []) await deliver('service_issued', row, { code: row.code ?? '' });
    return done(locale, 'signedAll', { n: String(data?.length ?? 0) });
  } catch (error) {
    return fail(locale, error, 'svc.signAll');
  }
}

const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

/** svcset.edit / sla.rules: fee, hours, offered, documents and details of one service (plat ≥ 2) */
export async function saveService(form: FormData): Promise<SvcResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('plat', 2);
    const key = text(1, 20).parse(form.get('key'));
    const supabase = await createClient();
    const { data: cur } = await supabase.from('service_types').select('name_en, fee, sla_hours, active, docs, fields').eq('key', key).single();
    if (!cur) return { ok: false, message: msg(locale, 'svc.errors.service') };
    const num = (v: FormDataEntryValue | null, d: number) => (v === null || v === '' ? d : Number(v));
    const { error } = await supabase.schema('api').rpc('svcset_save', {
      p_key: key,
      p_fee: num(form.get('fee'), cur.fee),
      p_sla_hours: num(form.get('sla'), cur.sla_hours),
      p_active: form.has('activeField') ? form.get('active') === 'on' : cur.active,
      p_docs: form.has('docs') ? lines(String(form.get('docs'))) : (cur.docs as string[]),
      p_fields: form.has('fields') ? lines(String(form.get('fields'))) : (cur.fields as string[]),
    });
    if (error) throw error;
    refresh();
    revalidatePath('/[locale]/(site)/services', 'page');
    return done(locale, 'setup', { service: cur.name_en });
  } catch (error) {
    return fail(locale, error, 'svcset.edit');
  }
}

