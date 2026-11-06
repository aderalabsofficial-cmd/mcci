'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { msg } from '@/lib/nav/model';
import { PermissionError, requireCompanyPermission, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { CONSENT_CATEGORIES, joinLink, normalizeWhatsapp, STAFF_METHODS } from '@/lib/whatsapp/consent';

/**
 * WhatsApp consent centre (migration 0690, docs/30 §12). Members manage their own company's contact, consent and
 * JOIN code (company area `profile`: level 2 to change, as for the rest of Company Profile); staff record consent on
 * a member's behalf (`out` 2). Each action checks here and the api.* function checks again in the database, where the
 * rules live (consent gate, member opt-out never overridden, exact number for JOIN). Row triggers write the audit log.
 */
const uuid = z.string().uuid();
const HINTS = [
  'fields',
  'phone',
  'name',
  'nocontact',
  'closed',
  'agree',
  'categories',
  'suppressed',
  'member_optout',
  'join_limit',
  'evidence',
  'confirm_yes',
  'reason',
];

function fail(locale: Locale, error: unknown, what: string): ActionResult {
  const t = (k: string) => msg(locale, `wa.prefs.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError)
    return { ok: false, message: t(error.issues[0]?.message === 'categories' ? 'categories' : 'fields') };
  const e = error as { code?: string; hint?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  if (e?.code === 'P0001' && e.hint && HINTS.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code);
  return { ok: false, message: t('generic') };
}
const done = (locale: Locale, k: string): ActionResult => ({ ok: true, message: msg(locale, `wa.prefs.done.${k}`) });
const localeOf = (form: FormData) => asLocale(String(form.get('locale') ?? 'en'));
const text = (form: FormData, k: string) => String(form.get(k) ?? '');
const categories = (form: FormData) =>
  z.array(z.enum(CONSENT_CATEGORIES)).min(1, 'categories').parse(form.getAll('categories').map(String));

function refreshMember() {
  revalidatePath('/[locale]/portal/whatsapp', 'page');
  revalidatePath('/[locale]/portal', 'page');
  revalidatePath('/[locale]/portal/profile', 'page');
}
function refreshStaff() {
  revalidatePath('/[locale]/admin/member', 'page');
  revalidatePath('/[locale]/admin/members', 'page');
  revalidatePath('/[locale]/admin/business-directory', 'layout');
  revalidatePath('/[locale]/admin/whatsapp', 'layout');
}

/* ---------- the member ---------- */

export async function saveMyWhatsappContact(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    const company = uuid.parse(text(form, 'company'));
    await requireCompanyPermission(company, 'profile', 2);
    const remove = text(form, 'remove') === '1';
    const phone = remove ? '' : normalizeWhatsapp(text(form, 'phone'));
    if (phone === null) return { ok: false, message: msg(locale, 'wa.prefs.errors.phone') };
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_member_contact', {
      p_company: company,
      p_name: text(form, 'name'),
      p_phone: phone,
    });
    if (error) throw error;
    refreshMember();
    return done(locale, remove ? 'removed' : 'contact');
  } catch (error) {
    return fail(locale, error, 'whatsapp member contact');
  }
}

export async function giveMyConsent(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    const company = uuid.parse(text(form, 'company'));
    await requireCompanyPermission(company, 'profile', 2);
    if (text(form, 'agree') !== 'on') return { ok: false, message: msg(locale, 'wa.prefs.errors.agree') };
    const db = await createClient();
    const { data, error } = await db.schema('api').rpc('wa_member_consent', {
      p_company: company,
      p_categories: categories(form),
      p_agree: true,
    });
    if (error) throw error;
    refreshMember();
    return done(locale, data === 'awaiting_verification' ? 'consentConfirm' : 'consent');
  } catch (error) {
    return fail(locale, error, 'whatsapp member consent');
  }
}

export async function stopMyWhatsapp(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    const company = uuid.parse(text(form, 'company'));
    await requireCompanyPermission(company, 'profile', 2);
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_member_withdraw', { p_company: company });
    if (error) throw error;
    refreshMember();
    return done(locale, 'stopped');
  } catch (error) {
    return fail(locale, error, 'whatsapp member withdraw');
  }
}

export type JoinCodeResult = ActionResult & {
  code?: string;
  expiresAt?: string;
  link?: string | null;
  to?: string | null;
};

/** a one-time code, shown once; only its hash is stored. JOIN proves the number is the member's; it is not consent. */
export async function makeJoinCode(locale: Locale, company: string): Promise<JoinCodeResult> {
  try {
    const id = uuid.parse(company);
    await requireCompanyPermission(id, 'profile', 2);
    const db = await createClient();
    const { data, error } = await db.schema('api').rpc('wa_join_code', { p_company: id });
    if (error) throw error;
    const r = data as { code: string; expires_at: string; to: string | null };
    refreshMember();
    return { ok: true, message: '', code: r.code, expiresAt: r.expires_at, to: r.to, link: joinLink(r.to, r.code) };
  } catch (error) {
    return fail(locale, error, 'whatsapp join code');
  }
}

/* ---------- staff, on the member's behalf ---------- */

export async function recordConsentForMember(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  try {
    await requirePermission('out', 2);
    const status = z.enum(['granted', 'withdrawn']).parse(text(form, 'status'));
    const db = await createClient();
    const { error } = await db.schema('api').rpc('wa_consent_record', {
      p_company: uuid.parse(text(form, 'company')),
      p_status: status,
      p_method: z.enum(STAFF_METHODS).parse(text(form, 'method')),
      p_evidence: text(form, 'evidence'),
      p_categories: status === 'withdrawn' ? [...CONSENT_CATEGORIES] : categories(form),
      p_confirmed: text(form, 'confirmed') === 'on',
    });
    if (error) throw error;
    refreshStaff();
    return done(locale, status === 'granted' ? 'staffGranted' : 'staffWithdrawn');
  } catch (error) {
    return fail(locale, error, 'whatsapp staff consent');
  }
}
