'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { filterSchema, SELECTION_LIMIT, type Filter } from '@/lib/business/filters';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';
import { dispatchPrepared, runTick } from '@/lib/whatsapp/admin/dispatch';
import { testConnection } from '@/lib/whatsapp/admin/health';
import { isConfigured, provider } from '@/lib/whatsapp/config';
import { CATEGORIES } from '@/lib/whatsapp/media';

/**
 * WhatsApp actions (docs/30). The permission is checked here and again in each api.wa_* function, where the sending
 * rules also live. Messages are never sent from a page: everything passes through the database's rules first.
 */
const uuid = z.string().uuid();
const HINT = [
  'fields',
  'filter',
  'state',
  'own',
  'reason',
  'confirm',
  'time',
  'empty',
  'toomany',
  'disabled',
  'evidence',
  'suppressed',
  'nocontact',
  'phone',
  'closed',
];

function fail(locale: Locale, error: unknown, what: string): ActionResult {
  const t = (k: string) => msg(locale, `wa.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  if (e?.code === 'P0001' && e.hint?.startsWith('block_'))
    return { ok: false, message: msg(locale, `wa.block.${e.hint.slice(6)}`) };
  if (e?.code === 'P0001' && e.hint && HINT.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code);
  return { ok: false, message: t('generic') };
}
const done = (locale: Locale, k: string, v?: Record<string, string>): ActionResult => ({
  ok: true,
  message: msg(locale, `wa.done.${k}`, v),
});
const refresh = () => {
  revalidatePath('/[locale]/admin/whatsapp', 'layout');
  revalidatePath('/[locale]/admin/business-directory/profile', 'page');
};
const localeOf = (form: FormData) => asLocale(String(form.get('locale') ?? 'en'));
const text = (form: FormData, k: string) => String(form.get(k) ?? '');
const NONE = null as unknown as string;

/* ---------- one message ---------- */

export async function sendToBusiness(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 2);
    if (!isConfigured()) return { ok: false, message: msg(locale, 'wa.errors.notConfigured') };
    const attachment = text(form, 'attachment') || null;
    const template = text(form, 'template') || null;
    const kind = template ? 'template' : attachment ? 'media' : 'text';
    const db = await createClient();
    const { data, error } = await db.schema('api').rpc('wa_send_prepare', {
      p_company: uuid.parse(text(form, 'company')),
      p_kind: kind,
      p_body: text(form, 'body'),
      p_template: template as string,
      p_attachment: attachment as string,
      p_category: z.enum(CATEGORIES).parse(text(form, 'category')),
    });
    if (error) throw error;
    const r = await dispatchPrepared(data as string);
    refresh();
    if (r.outcome === 'accepted') return done(locale, 'accepted');
    if (r.outcome === 'failed')
      return { ok: false, message: msg(locale, 'wa.errors.providerRefused', { detail: r.detail }) };
    return { ok: false, message: msg(locale, 'wa.errors.unclear') };
  } catch (error) {
    return fail(locale, error, 'whatsapp send');
  }
}

/* ---------- audience ---------- */

const audience = z.object({
  q: z.string().trim().max(100),
  ids: z.array(uuid).max(SELECTION_LIMIT).nullable(),
  excluded: z.array(uuid).max(SELECTION_LIMIT),
  category: z.enum(CATEGORIES),
  kind: z.enum(['template', 'text']),
  template: uuid.nullable(),
});

export interface AudienceRow {
  member_id: string;
  name: string;
  member_no: string;
  phone: string | null;
  block: string | null;
  values: Record<string, string | null>;
}
export interface AudiencePreview {
  total: number;
  eligible: number;
  blocked: Record<string, number>;
  rows: AudienceRow[];
}

export async function previewAudience(
  locale: Locale,
  input: {
    filter: Filter;
    q: string;
    ids: string[] | null;
    excluded: string[];
    category: string;
    kind: string;
    template: string | null;
  },
): Promise<ActionResult & { preview?: AudiencePreview }> {
  try {
    await requirePermission('out', 2);
    const v = audience.parse(input);
    const db = await createClient();
    const { data, error } = await db.schema('api').rpc('wa_audience_preview', {
      p_def: filterSchema.parse(input.filter) as unknown as Json,
      p_q: v.q,
      p_ids: v.ids as string[],
      p_excluded: v.excluded,
      p_category: v.category,
      p_kind: v.kind,
      p_template: v.template as string,
    });
    if (error) throw error;
    return { ok: true, message: '', preview: data as unknown as AudiencePreview };
  } catch (error) {
    return fail(locale, error, 'whatsapp preview');
  }
}

/* ---------- campaigns ---------- */

const campaign = audience.extend({
  name: z.string().trim().min(2).max(120),
  purpose: z.string().trim().max(500),
  mode: z.enum(['campaign', 'selective']),
  body: z.string().trim().max(4096),
  attachment: uuid.nullable(),
  segment: uuid.nullable(),
});

export async function createCampaign(
  locale: Locale,
  input: z.input<typeof campaign> & { filter: Filter },
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission('out', 2);
    const v = campaign.parse(input);
    const db = await createClient();
    const { data, error } = await db.schema('api').rpc('wa_campaign_create', {
      p_name: v.name,
      p_purpose: v.purpose,
      p_mode: v.mode,
      p_category: v.category,
      p_kind: v.kind,
      p_template: v.template as string,
      p_body: v.body,
      p_attachment: v.attachment as string,
      p_segment: v.segment as string,
      p_def: filterSchema.parse(input.filter) as unknown as Json,
      p_q: v.q,
      p_ids: v.ids as string[],
      p_excluded: v.excluded,
    });
    if (error) throw error;
    refresh();
    return { ...done(locale, 'campaignCreated'), id: data as string };
  } catch (error) {
    return fail(locale, error, 'whatsapp campaign create');
  }
}

export async function submitCampaign(locale: Locale, id: string): Promise<ActionResult> {
  try {
    await requirePermission('out', 2);
    const db = await createClient();
    const { data, error } = await db.schema('api').rpc('wa_campaign_submit', { p_id: uuid.parse(id) });
    if (error) throw error;
    refresh();
    return done(locale, data === 'approved' ? 'readyToStart' : 'sentForApproval');
  } catch (error) {
    return fail(locale, error, 'whatsapp campaign submit');
  }
}

export async function decideCampaign(
  locale: Locale,
  id: string,
  approve: boolean,
  reason: string,
): Promise<ActionResult> {
  try {
    await requirePermission('out', 3);
    const db = await createClient();
    const { error } = await db
      .schema('api')
      .rpc('wa_campaign_decide', { p_id: uuid.parse(id), p_approve: approve, p_reason: reason });
    if (error) throw error;
    refresh();
    return done(locale, approve ? 'approved' : 'returned');
  } catch (error) {
    return fail(locale, error, 'whatsapp campaign decide');
  }
}

export async function startCampaign(
  locale: Locale,
  id: string,
  at: string | null,
  confirm: number,
): Promise<ActionResult> {
  try {
    await requirePermission('out', 2);
    const when = at ? new Date(at) : null;
    if (when && Number.isNaN(when.getTime())) return { ok: false, message: msg(locale, 'wa.errors.time') };
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_campaign_start', {
      p_id: uuid.parse(id),
      p_at: when ? when.toISOString() : NONE,
      p_confirm: confirm,
    });
    if (error) throw error;
    refresh();
    return done(locale, when ? 'scheduled' : 'queued');
  } catch (error) {
    return fail(locale, error, 'whatsapp campaign start');
  }
}

export async function controlCampaign(
  locale: Locale,
  id: string,
  action: 'pause' | 'resume' | 'cancel',
): Promise<ActionResult> {
  try {
    await requirePermission('out', 3);
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_campaign_control', { p_id: uuid.parse(id), p_action: action });
    if (error) throw error;
    refresh();
    return done(locale, action);
  } catch (error) {
    return fail(locale, error, 'whatsapp campaign control');
  }
}

/** one pass of the queue by a person, because the scheduled job is off in production */
export async function runBatch(locale: Locale): Promise<ActionResult> {
  try {
    await requirePermission('out', 3);
    const r = await runTick();
    refresh();
    if (r.stopped)
      return { ok: false, message: msg(locale, 'wa.errors.batchStopped', { n: String(r.sent), why: r.stopped }) };
    return done(locale, 'batch', { n: String(r.sent) });
  } catch (error) {
    return fail(locale, error, 'whatsapp batch');
  }
}

/* ---------- templates ---------- */

export async function syncTemplates(locale: Locale): Promise<ActionResult> {
  try {
    await requirePermission('out', 2);
    if (!isConfigured()) return { ok: false, message: msg(locale, 'wa.errors.notConfigured') };
    const r = await provider().getTemplates();
    if (!r.ok) return { ok: false, message: msg(locale, 'wa.errors.providerRefused', { detail: r.detail }) };
    const db = await createClient();
    const { data, error } = await db.schema('api').rpc('wa_templates_sync', { p_rows: r.value as unknown as Json });
    if (error) throw error;
    refresh();
    return done(locale, 'synced', { n: String(data) });
  } catch (error) {
    return fail(locale, error, 'whatsapp templates sync');
  }
}

export async function saveTemplate(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 2);
    const map: Record<string, string> = {};
    for (const [k, v] of form.entries()) {
      const m = /^var_([0-9]{1,2})$/.exec(k);
      if (m && typeof v === 'string' && v) map[m[1]!] = v;
    }
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_template_save', {
      p_id: uuid.parse(text(form, 'id')),
      p_header_type: text(form, 'header_type') || 'none',
      p_header: text(form, 'header'),
      p_body: text(form, 'body'),
      p_footer: text(form, 'footer'),
      p_var_map: map as unknown as Json,
    });
    if (error) throw error;
    refresh();
    return done(locale, 'templateSaved');
  } catch (error) {
    return fail(locale, error, 'whatsapp template save');
  }
}

/* ---------- inbox ---------- */

export async function updateConversation(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 2);
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_conversation_update', {
      p_id: uuid.parse(text(form, 'id')),
      p_status: text(form, 'status'),
      p_assigned: (text(form, 'assigned') || null) as string,
    });
    if (error) throw error;
    refresh();
    return done(locale, 'conversation');
  } catch (error) {
    return fail(locale, error, 'whatsapp conversation');
  }
}

export async function addNote(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 2);
    const db = await createClient();
    const { error } = await db
      .schema('api')
      .rpc('wa_note_add', { p_id: uuid.parse(text(form, 'id')), p_body: text(form, 'body') });
    if (error) throw error;
    refresh();
    return done(locale, 'note');
  } catch (error) {
    return fail(locale, error, 'whatsapp note');
  }
}

export async function linkConversation(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 3);
    const db = await createClient();
    const { data: member, error: me } = await db
      .from('members')
      .select('company_id')
      .eq('member_no', text(form, 'member_no').trim())
      .maybeSingle();
    if (me) throw me;
    if (!member) return { ok: false, message: msg(locale, 'wa.errors.noMember') };
    const { error } = await db
      .schema('api')
      .rpc('wa_conversation_link', { p_id: uuid.parse(text(form, 'id')), p_company: member.company_id });
    if (error) throw error;
    refresh();
    return done(locale, 'linked');
  } catch (error) {
    return fail(locale, error, 'whatsapp link');
  }
}

/* ---------- consent ---------- */

const categories = (form: FormData) => z.array(z.enum(CATEGORIES)).min(1).parse(form.getAll('categories').map(String));

export async function recordConsentByStaff(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 2);
    const status = text(form, 'status');
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_consent_record', {
      p_company: uuid.parse(text(form, 'company')),
      p_status: status,
      p_method: text(form, 'method'),
      p_evidence: text(form, 'evidence'),
      p_categories: status === 'withdrawn' ? [...CATEGORIES] : categories(form),
    });
    if (error) throw error;
    revalidatePath('/[locale]/admin/business-directory', 'layout');
    refresh();
    return done(locale, 'consent');
  } catch (error) {
    return fail(locale, error, 'whatsapp consent');
  }
}

export async function memberConsent(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    const grant = text(form, 'grant') === 'on';
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_member_consent', {
      p_company: uuid.parse(text(form, 'company')),
      p_name: text(form, 'name'),
      p_phone: text(form, 'phone'),
      p_grant: grant,
      p_categories: grant ? categories(form) : [...CATEGORIES],
    });
    if (error) throw error;
    revalidatePath('/[locale]/portal/profile', 'page');
    return done(locale, grant ? 'memberGranted' : 'memberWithdrawn');
  } catch (error) {
    return fail(locale, error, 'whatsapp member consent');
  }
}

/* ---------- settings ---------- */

export async function runConnectionTest(locale: Locale): Promise<ActionResult & { status?: string }> {
  try {
    await requirePermission('plat', 2);
    const r = await testConnection();
    refresh();
    return { ok: r.status === 'connected', message: msg(locale, `wa.status.${r.status}`), status: r.status };
  } catch (error) {
    return fail(locale, error, 'whatsapp test');
  }
}

export async function saveWhatsappSettings(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('plat', 3);
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_settings_save', {
      p_values: {
        ratePerMinute: Number(text(form, 'ratePerMinute')),
        maxCampaign: Number(text(form, 'maxCampaign')),
        approvalThreshold: Number(text(form, 'approvalThreshold')),
        sendingEnabled: text(form, 'sendingEnabled') === 'on',
        consentOpen: text(form, 'consentOpen') === 'on',
        consentVersion: text(form, 'consentVersion'),
      } as unknown as Json,
    });
    if (error) throw error;
    refresh();
    return done(locale, 'settings');
  } catch (error) {
    return fail(locale, error, 'whatsapp settings');
  }
}
