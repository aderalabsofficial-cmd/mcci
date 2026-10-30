'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { decodeFilter, EXPORT_FIELDS, filterSchema, SELECTION_LIMIT, type Filter } from '@/lib/business/filters';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

/**
 * Business directory (migration 0570). Each action checks the permission here; the api.* function checks it again in
 * the database and the row triggers audit the change. Official company and member records are never written here.
 */
const uuid = z.string().uuid();
const HINTS = [
  'fields',
  'filter',
  'duplicate',
  'phone',
  'nocontact',
  'evidence',
  'suppressed',
  'reason',
  'toomany',
  'approval',
  'limited',
];

function fail(locale: Locale, error: unknown, what: string): ActionResult {
  const t = (k: string) => msg(locale, `biz.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  if (e?.code === 'P0001' && e.hint && HINTS.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}
const done = (locale: Locale, k: string): ActionResult => ({ ok: true, message: msg(locale, `biz.done.${k}`) });
const refresh = () => revalidatePath('/[locale]/admin/business-directory', 'layout');
const localeOf = (form: FormData) => asLocale(String(form.get('locale') ?? 'en'));
const text = (form: FormData, k: string) => String(form.get(k) ?? '');

/* ---------- audience ---------- */

export interface Counts {
  total: number;
  whatsapp: number;
  consented: number;
  optedOut: number;
  eligible: number;
}

export async function countAudience(
  locale: Locale,
  filter: Filter,
  q: string,
): Promise<ActionResult & { counts?: Counts }> {
  try {
    await requirePermission('biz', 1);
    const f = filterSchema.parse(filter);
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('api')
      .rpc('biz_count', { p_def: f as unknown as Json, p_q: q.slice(0, 100) });
    if (error) throw error;
    return { ok: true, message: '', counts: data as unknown as Counts };
  } catch (error) {
    return fail(locale, error, 'biz.count');
  }
}

/* ---------- segments ---------- */

const segment = z.object({
  id: uuid.nullable(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300),
});

export async function saveSegment(
  locale: Locale,
  input: { id: string | null; name: string; description: string; filter: Filter },
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission('biz', 2);
    const v = segment.parse(input);
    const f = filterSchema.parse(input.filter);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('seg_save', {
      p_id: v.id as string,
      p_name: v.name,
      p_description: v.description,
      p_def: f as unknown as Json,
    });
    if (error) throw error;
    refresh();
    return { ...done(locale, 'segmentSaved'), id: data as string };
  } catch (error) {
    return fail(locale, error, 'seg.save');
  }
}

export async function deleteSegment(locale: Locale, id: string): Promise<ActionResult> {
  try {
    await requirePermission('biz', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('seg_delete', { p_id: uuid.parse(id) });
    if (error) throw error;
    refresh();
    return done(locale, 'segmentDeleted');
  } catch (error) {
    return fail(locale, error, 'seg.delete');
  }
}

/* ---------- outreach details and tags ---------- */

export async function saveOutreachDetails(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('biz', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('biz_meta_save', {
      p_company: uuid.parse(text(form, 'company')),
      p_city: text(form, 'city'),
      p_district: text(form, 'district'),
      p_notes: text(form, 'notes'),
    });
    if (error) throw error;
    refresh();
    return done(locale, 'details');
  } catch (error) {
    return fail(locale, error, 'biz.meta');
  }
}

export async function addTag(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('biz', 2);
    const company = uuid.parse(text(form, 'company'));
    const existing = text(form, 'tag');
    const name = text(form, 'name').trim();
    const supabase = await createClient();
    let tag = existing;
    if (!tag) {
      const { data, error } = await supabase.schema('api').rpc('biz_tag_create', { p_name: name });
      if (error) throw error;
      tag = data as string;
    }
    const { error } = await supabase
      .schema('api')
      .rpc('biz_tag_set', { p_company: company, p_tag: uuid.parse(tag), p_on: true });
    if (error) throw error;
    refresh();
    return done(locale, 'tagAdded');
  } catch (error) {
    return fail(locale, error, 'biz.tag');
  }
}

export async function removeTag(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('biz', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('biz_tag_set', {
      p_company: uuid.parse(text(form, 'company')),
      p_tag: uuid.parse(text(form, 'tag')),
      p_on: false,
    });
    if (error) throw error;
    refresh();
    return done(locale, 'tagRemoved');
  } catch (error) {
    return fail(locale, error, 'biz.tag');
  }
}

/* ---------- contact, consent, suppression ---------- */

export async function saveContact(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('biz_contact_save', {
      p_company: uuid.parse(text(form, 'company')),
      p_name: text(form, 'name'),
      p_phone: text(form, 'phone'),
    });
    if (error) throw error;
    if (form.has('language')) {
      const { error: lang } = await supabase.schema('api').rpc('wa_contact_language', {
        p_company: uuid.parse(text(form, 'company')),
        p_language: text(form, 'language'),
      });
      if (lang) throw lang;
    }
    refresh();
    return done(locale, 'contact');
  } catch (error) {
    return fail(locale, error, 'biz.contact');
  }
}

export async function suppressNumber(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('biz_suppress', {
      p_company: uuid.parse(text(form, 'company')),
      p_reason: text(form, 'reason'),
    });
    if (error) throw error;
    refresh();
    return done(locale, 'suppressed');
  } catch (error) {
    return fail(locale, error, 'biz.suppress');
  }
}

export async function liftSuppression(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 3);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('biz_unsuppress', {
      p_company: uuid.parse(text(form, 'company')),
      p_reason: text(form, 'reason'),
    });
    if (error) throw error;
    refresh();
    return done(locale, 'lifted');
  } catch (error) {
    return fail(locale, error, 'biz.suppress');
  }
}

/* ---------- export preview ---------- */

const fieldKeys = EXPORT_FIELDS.map((f) => f.key) as [string, ...string[]];
const preview = z.object({
  q: z.string().trim().max(100),
  ids: z.array(uuid).max(SELECTION_LIMIT).nullable(),
  excluded: z.array(uuid).max(SELECTION_LIMIT),
  fields: z.array(z.enum(fieldKeys)).min(1).max(20),
  reason: z.string().trim().max(300),
});

export async function previewExport(
  locale: Locale,
  input: { filter: Filter; q: string; ids: string[] | null; excluded: string[]; fields: string[]; reason: string },
): Promise<ActionResult & { total?: number; rows?: Record<string, unknown>[] }> {
  try {
    await requirePermission('biz', 2);
    const v = preview.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('biz_export', {
      p_def: decodeFilter(input.filter) as unknown as Json,
      p_q: v.q,
      p_ids: v.ids as string[],
      p_excluded: v.excluded,
      p_fields: v.fields,
      p_format: 'csv',
      p_reason: v.reason,
      p_log: false,
    });
    if (error) throw error;
    const out = data as unknown as { total: number; rows: Record<string, unknown>[] };
    return { ok: true, message: '', total: out.total, rows: out.rows };
  } catch (error) {
    return fail(locale, error, 'biz.preview');
  }
}
