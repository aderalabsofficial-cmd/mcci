'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { dbErrorKey } from '@/lib/access/result';
import { aiEnabled, aiModel, type Extracted, extractDocument, mergeExtraction, READABLE } from '@/lib/ai/extract';
import { sendEmail } from '@/lib/email/send';
import { checkUpload, EXT, type FileKind, MIME, sniff, type UploadProblem } from '@/lib/files/sniff';
import { type AppForm, isBiz, MAX_PARTNERS } from '@/lib/flow/application';
import { cleanInk, passportPhoto, trimDrawn } from '@/lib/membership/images';
import { FORM_FIELDS, MAX_NATURE_ITEMS, SECTORS } from '@/lib/membership/reference';
import { msg } from '@/lib/nav/model';
import { PermissionError, requireCompanyPermission, requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import type { Json, TablesUpdate } from '@/lib/supabase/types';
import { submittedEmail } from './emails';

/**
 * Member actions of the application wizard (docs/catalogue/actions.md wiz.*, photo.save, sign.save, app.*).
 * Each one checks the person first (requireCompanyPermission: area mship, level 2 = Owner / Manager), then works
 * with the person's own session, so RLS and the api.* functions (migrations 0150, 0300) check it again in the
 * database; audit_log rows come from the database triggers (migration 0240).
 */

export interface WizResult {
  ok: boolean;
  message?: string;
  /** codes from api.app_missing when submission is refused */
  missing?: string[];
}

const PAGES = [
  '/[locale]/portal',
  '/[locale]/portal/join',
  '/[locale]/portal/mtrack',
  '/[locale]/portal/membership',
  '/[locale]/portal/form',
];
const refresh = () => PAGES.forEach((p) => revalidatePath(p, 'page'));
const uuid = z.string().uuid();
/** a validated plain object, as the generated jsonb column type */
const json = (v: object) => v as unknown as { [key: string]: Json | undefined };

/** the application and its company, after checking the person may change it */
async function editable(appId: string): Promise<{ companyId: string; stage: string; form: AppForm }> {
  const id = uuid.parse(appId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('applications')
    .select('company_id, stage, form')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) throw new PermissionError('not-in-company');
  await requireCompanyPermission(data.company_id, 'mship', 'edit');
  return { companyId: data.company_id, stage: data.stage, form: (data.form ?? {}) as AppForm };
}

function failure(locale: Locale, error: unknown, what: string): WizResult {
  if (error instanceof PermissionError || error instanceof z.ZodError) {
    return { ok: false, message: msg(locale, 'access.errors.notAllowed') };
  }
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === 'P0001' && e.hint === 'incomplete') {
    const codes = (e.message ?? '')
      .replace(/^.*incomplete:\s*/, '')
      .split(',')
      .filter(Boolean);
    return { ok: false, message: msg(locale, 'membership.errors.incomplete'), missing: codes };
  }
  if (e?.code === 'P0001' && e.hint === 'wrong_stage')
    return { ok: false, message: msg(locale, 'membership.errors.wrongStage') };
  if (e?.code === 'P0001' && e.hint === 'ai_quota')
    return { ok: false, message: msg(locale, 'membership.errors.aiQuota') };
  if (e?.code) {
    const key = dbErrorKey(e);
    if (key !== 'access.errors.generic') return { ok: false, message: msg(locale, key) };
  }
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: msg(locale, 'membership.errors.generic') };
}

// ───────── start ─────────

/** register.start / "Start my application": the open application, or a new applicant company + draft */
export async function startApplication(form: FormData): Promise<void> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.schema('api').rpc('app_start');
  if (error && error.hint !== 'already_member') throw new Error(`app_start: ${error.message}`);
  refresh();
  redirect({ href: error ? '/portal/membership' : '/portal/join', locale });
}

// ───────── draft autosave (wiz.step, wiz.next, wiz.save, wiz.biz, wiz.nat.*, wiz.juris, wiz.addr, wiz.flag, wiz.declare) ─────────

const text = (max: number) => z.string().trim().max(max);
const formPatch = z
  .object({
    biz: z.enum(['prop', 'aop', 'pvt', 'mnc', 'public']),
    manufacturing: z.boolean(),
    salesTax: z.boolean(),
    turnover50: z.boolean(),
    addrMatch: z.boolean(),
    step: z.number().int().min(0).max(5),
    nature: z.object({
      sector: z.enum(SECTORS.map((s) => s.k) as [string, ...string[]]).or(z.literal('')),
      items: z.array(text(80)).max(MAX_NATURE_ITEMS),
      other: text(120),
    }),
    name: text(200),
    address: text(400),
    ntn: text(40),
    gst: text(40),
    tel: text(40),
    fax: text(40),
    email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(254)]),
    web: text(200),
    particulars: text(600),
    est: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    rep: text(120),
    desig: text(120),
    cnic: text(30),
    mobile: text(30),
  })
  .partial()
  .strict();

const draftPatch = z
  .object({
    form: formPatch,
    jurisdiction_ok: z.boolean().nullable(),
    women: z.boolean(),
    decl1: z.boolean(),
    decl2: z.boolean(),
    /** fields the applicant has checked or typed: confidence 100 ("checked by you") */
    checked: z.array(z.enum(FORM_FIELDS)).max(FORM_FIELDS.length),
  })
  .partial()
  .strict();

export type DraftPatch = z.infer<typeof draftPatch>;

export async function saveDraft(locale: Locale, appId: string, patch: DraftPatch): Promise<WizResult> {
  try {
    const p = draftPatch.parse(patch);
    const app = await editable(appId);
    const supabase = await createClient();
    const update: TablesUpdate<'applications'> = {};
    if (p.form) update.form = json({ ...app.form, ...p.form });
    if (p.jurisdiction_ok !== undefined) update.jurisdiction_ok = p.jurisdiction_ok;
    if (p.women !== undefined) update.women = p.women;
    if (p.decl1 !== undefined) update.decl1 = p.decl1;
    if (p.decl2 !== undefined) update.decl2 = p.decl2;
    if (p.checked?.length) {
      const { data } = await supabase.from('applications').select('field_confidence').eq('id', appId).single();
      const conf = { ...((data?.field_confidence ?? {}) as Record<string, number>) };
      for (const k of p.checked) conf[k] = 100;
      update.field_confidence = conf;
    }
    if (!Object.keys(update).length) return { ok: true };
    const { data, error } = await supabase.from('applications').update(update).eq('id', appId).select('id');
    if (error) throw error;
    if (!data?.length) return { ok: false, message: msg(locale, 'membership.errors.wrongStage') };
    if (p.form?.biz !== undefined || p.jurisdiction_ok !== undefined || p.decl1 !== undefined || p.decl2 !== undefined)
      refresh();
    return { ok: true };
  } catch (error) {
    return failure(locale, error, 'wiz.save');
  }
}

// ───────── partners (wiz.partner.add / del / card) ─────────

const partnerFields = z
  .object({ name: text(120), cnic: text(30), mobile: text(30), extra_card: z.boolean() })
  .partial()
  .strict();

export async function addPartner(locale: Locale, appId: string): Promise<WizResult> {
  try {
    await editable(appId);
    const supabase = await createClient();
    const { data: rows } = await supabase.from('application_partners').select('position').eq('application_id', appId);
    const taken = new Set((rows ?? []).map((r) => r.position));
    if (taken.size >= MAX_PARTNERS) return { ok: false, message: msg(locale, 'membership.errors.maxPartners') };
    const position = [1, 2, 3, 4, 5, 6].find((n) => !taken.has(n))!;
    const { error } = await supabase.from('application_partners').insert({ application_id: appId, position, name: '' });
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(locale, error, 'wiz.partner.add');
  }
}

export async function updatePartner(
  locale: Locale,
  appId: string,
  partnerId: string,
  fields: z.infer<typeof partnerFields>,
): Promise<WizResult> {
  try {
    const f = partnerFields.parse(fields);
    await editable(appId);
    const supabase = await createClient();
    const { error } = await supabase
      .from('application_partners')
      .update(f)
      .eq('id', uuid.parse(partnerId))
      .eq('application_id', appId);
    if (error) throw error;
    if (f.extra_card !== undefined) refresh();
    return { ok: true };
  } catch (error) {
    return failure(locale, error, 'wiz.partner.edit');
  }
}

export async function removePartner(locale: Locale, appId: string, partnerId: string): Promise<WizResult> {
  try {
    await editable(appId);
    const supabase = await createClient();
    const { error } = await supabase
      .from('application_partners')
      .delete()
      .eq('id', uuid.parse(partnerId))
      .eq('application_id', appId);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(locale, error, 'wiz.partner.del');
  }
}

// ───────── files (wiz.doc.upload, app.fix.upload, wiz.doc.remove, wiz.photo / photo.save, wiz.sign*, wiz.stamp.upload) ─────────

const DOC_KINDS: readonly FileKind[] = ['pdf', 'jpeg', 'png'];
const IMAGE_KINDS: readonly FileKind[] = ['jpeg', 'png'];
const DOC_KEY = /^[a-z]{2,10}$/;

const uploadProblem = (locale: Locale, p: UploadProblem): WizResult => ({
  ok: false,
  message: msg(locale, `membership.errors.upload.${p}`),
});

async function readFile(form: FormData): Promise<{ bytes: Uint8Array; name: string } | null> {
  const file = form.get('file');
  if (!(file instanceof File)) return null;
  return { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name.slice(0, 200) };
}

async function store(path: string, body: Uint8Array | Buffer, contentType: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from('application-docs')
    .upload(path, body, { contentType, upsert: false, cacheControl: '0' });
  if (error) throw error;
}

/** insert the document row, or point the existing one at the new file (the old file stays as a version) */
async function setDocument(appId: string, key: string, path: string, name: string, mime: string, size: number) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('application_documents')
    .select('id')
    .eq('application_id', appId)
    .eq('key', key)
    .maybeSingle();
  const row = { path, file_name: name, mime, size_bytes: size };
  const { error } = existing
    ? await supabase.from('application_documents').update(row).eq('id', existing.id)
    : await supabase.from('application_documents').insert({ application_id: appId, key, ...row });
  if (error) throw error;
}

export async function uploadDocument(form: FormData): Promise<WizResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const appId = String(form.get('app') ?? '');
    const key = String(form.get('key') ?? '');
    if (!DOC_KEY.test(key) || key === 'photo') throw new PermissionError('not-in-company');
    const app = await editable(appId);
    const file = await readFile(form);
    if (!file) return uploadProblem(locale, 'empty');
    const check = checkUpload(file.bytes, DOC_KINDS);
    if ('problem' in check) return uploadProblem(locale, check.problem);
    const supabase = await createClient();
    const { data: req } = await supabase
      .from('document_requirements')
      .select('key')
      .eq('biz_type', isBiz(app.form.biz) ? app.form.biz : 'prop')
      .eq('key', key)
      .maybeSingle();
    if (!req) throw new PermissionError('not-in-company');
    const path = `${app.companyId}/applications/${appId}/${key}/${randomUUID()}.${EXT[check.kind]}`;
    await store(path, file.bytes, MIME[check.kind]);
    await setDocument(appId, key, path, file.name, MIME[check.kind], file.bytes.length);
    refresh();
    return { ok: true, message: msg(locale, 'membership.done.uploaded') };
  } catch (error) {
    return failure(locale, error, 'wiz.doc.upload');
  }
}

export async function removeDocument(locale: Locale, documentId: string): Promise<WizResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('app_doc_remove', { p_document: uuid.parse(documentId) });
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(locale, error, 'wiz.doc.remove');
  }
}

export async function savePhoto(form: FormData): Promise<WizResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const appId = String(form.get('app') ?? '');
    const app = await editable(appId);
    const file = await readFile(form);
    if (!file) return uploadProblem(locale, 'empty');
    const check = checkUpload(file.bytes, IMAGE_KINDS);
    if ('problem' in check) return uploadProblem(locale, check.problem);
    const jpeg = await passportPhoto(file.bytes);
    const path = `${app.companyId}/applications/${appId}/photo/${randomUUID()}.jpg`;
    await store(path, jpeg, 'image/jpeg');
    await setDocument(appId, 'photo', path, 'passport-photo.jpg', 'image/jpeg', jpeg.length);
    const supabase = await createClient();
    const { error } = await supabase.from('applications').update({ photo_path: path }).eq('id', appId);
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'membership.done.photo') };
  } catch (error) {
    return failure(locale, error, 'photo.save');
  }
}

/** sign.save (drawn on screen, already transparent) or wiz.sign.upload / wiz.stamp.upload (photo on paper) */
export async function saveInk(form: FormData): Promise<WizResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const what = String(form.get('what') ?? '');
  try {
    const appId = String(form.get('app') ?? '');
    const drawn = form.get('drawn') === '1';
    if (what !== 'sign' && what !== 'stamp') throw new PermissionError('not-in-company');
    const app = await editable(appId);
    const file = await readFile(form);
    if (!file) return uploadProblem(locale, 'empty');
    const check = checkUpload(file.bytes, IMAGE_KINDS);
    if ('problem' in check) return uploadProblem(locale, check.problem);
    const png = drawn && what === 'sign' ? await trimDrawn(file.bytes) : await cleanInk(file.bytes);
    const path = `${app.companyId}/applications/${appId}/${what}/${randomUUID()}.png`;
    await store(path, png, 'image/png');
    const supabase = await createClient();
    const { error } = await supabase
      .from('applications')
      .update(what === 'sign' ? { sign_path: path } : { stamp_path: path })
      .eq('id', appId);
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, what === 'sign' ? 'membership.done.sign' : 'membership.done.stamp') };
  } catch (error) {
    return failure(locale, error, `wiz.${what}`);
  }
}

// ───────── submit, resubmit, withdraw ─────────

export async function submitApplication(locale: Locale, appId: string): Promise<WizResult> {
  let token: string;
  try {
    const session = await requireUser();
    await editable(appId);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('app_submit', { p_app: appId });
    if (error) throw error;
    token = String(data);
    // the receipt email is a courtesy: the portal message and history are already written
    const email = session.access.email;
    if (email) {
      await sendEmail(submittedEmail(email, session.access.full_name ?? '', token)).catch((e: unknown) =>
        console.error('submit receipt email not sent', (e as Error)?.message),
      );
    }
  } catch (error) {
    return failure(locale, error, 'wiz.submit');
  }
  refresh();
  redirect({ href: '/portal/mtrack?submitted=1', locale });
  return { ok: true };
}

export async function resubmitApplication(locale: Locale, appId: string): Promise<WizResult> {
  try {
    await editable(appId);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('app_resubmit', { p_app: appId });
    if (error) throw error;
  } catch (error) {
    return failure(locale, error, 'app.resubmit');
  }
  refresh();
  redirect({ href: '/portal/mtrack', locale });
  return { ok: true };
}

export async function withdrawApplication(locale: Locale, appId: string, reason: string): Promise<WizResult> {
  try {
    const id = uuid.parse(appId);
    const supabase = await createClient();
    const { data } = await supabase.from('applications').select('company_id').eq('id', id).maybeSingle();
    if (!data) throw new PermissionError('not-in-company');
    await requireCompanyPermission(data.company_id, 'mship', 'edit');
    const { error } = await supabase
      .schema('api')
      .rpc('app_withdraw', { p_app: id, p_reason: z.string().trim().max(500).parse(reason) });
    if (error) throw error;
  } catch (error) {
    return failure(locale, error, 'app.withdraw');
  }
  refresh();
  return { ok: true, message: msg(locale, 'membership.done.withdrawn') };
}

// ───────── AI reading (wiz.ai) ─────────

/**
 * Reads the uploaded documents with OpenAI and fills the form (docs/08). Each document is one extraction row
 * (api.ai_extraction_begin enforces 15 per application per day); results are stored without document content.
 * Nothing is approved automatically: fields below 85 % are highlighted for the applicant to check.
 */
export async function readWithAI(
  locale: Locale,
  appId: string,
): Promise<WizResult & { filled?: number; form?: Partial<AppForm>; confidence?: Record<string, number> }> {
  try {
    const app = await editable(appId);
    if (!aiEnabled()) return { ok: false, message: msg(locale, 'membership.errors.aiOff') };
    const supabase = await createClient();
    const { data: docs, error } = await supabase
      .from('application_documents')
      .select('key, path')
      .eq('application_id', appId)
      .in('key', READABLE)
      .neq('status', 'rejected');
    if (error) throw error;
    if (!docs?.length) return { ok: false, message: msg(locale, 'membership.errors.aiNoDocs') };

    const readings: Record<string, Extracted> = {};
    const model = aiModel();
    for (const d of docs) {
      const { error: quota } = await supabase
        .schema('api')
        .rpc('ai_extraction_begin', { p_application: appId, p_doc_key: d.key });
      if (quota) throw quota;
    }
    const { data: started } = await supabase
      .from('ai_extractions')
      .select('id, doc_key')
      .eq('application_id', appId)
      .eq('status', 'started');
    await Promise.all(
      docs.map(async (d) => {
        const ids = (started ?? []).filter((s) => s.doc_key === d.key).map((s) => s.id);
        try {
          const { data: blob, error: e } = await supabase.storage.from('application-docs').download(d.path);
          if (e || !blob) throw e ?? new Error('download failed');
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const kind = sniff(bytes);
          if (!kind || kind === 'heic') throw new Error('unreadable file type');
          readings[d.key] = await extractDocument(d.key, { bytes, kind: kind as FileKind }, { model });
          for (const id of ids)
            await supabase.schema('api').rpc('ai_extraction_finish', {
              p_extraction: id,
              p_ok: true,
              p_model: model,
              p_fields: json(readings[d.key]!),
            });
        } catch (err) {
          for (const id of ids)
            await supabase
              .schema('api')
              .rpc('ai_extraction_finish', { p_extraction: id, p_ok: false, p_model: model, p_fields: {} });
          // never log document content or the answer: only which document and the kind of failure
          const e = err as { status?: number; name?: string };
          console.error('wiz.ai: document not read', d.key, e?.status ?? e?.name);
        }
      }),
    );
    if (!Object.keys(readings).length) return { ok: false, message: msg(locale, 'membership.errors.aiFailed') };

    const { data: cur, error: e2 } = await supabase
      .from('applications')
      .select('form, field_confidence')
      .eq('id', appId)
      .single();
    if (e2) throw e2;
    const form = (cur.form ?? {}) as AppForm;
    const conf = (cur.field_confidence ?? {}) as Record<string, number>;
    const merged = mergeExtraction(readings, form, conf);
    const { error: e3 } = await supabase
      .from('applications')
      .update({
        form: json({ ...form, ...merged.form, src: { ...(form.src ?? {}), ...merged.source } }),
        field_confidence: { ...conf, ...merged.confidence },
      })
      .eq('id', appId);
    if (e3) throw e3;
    if (merged.directors.length && app.form.biz && app.form.biz !== 'prop') {
      const { count } = await supabase
        .from('application_partners')
        .select('id', { count: 'exact', head: true })
        .eq('application_id', appId);
      if (!count) {
        await supabase
          .from('application_partners')
          .insert(
            merged.directors.map((d, i) => ({ application_id: appId, position: i + 1, name: d.name, cnic: d.cnic })),
          );
      }
    }
    refresh();
    return {
      ok: true,
      filled: merged.filled,
      // the wizard applies these at once (its own copy may be ahead of the refreshed page while it saves)
      form: { ...merged.form, src: { ...(form.src ?? {}), ...merged.source } },
      confidence: merged.confidence,
      message: msg(locale, 'membership.done.ai', { n: String(merged.filled) }),
    };
  } catch (error) {
    return failure(locale, error, 'wiz.ai');
  }
}
