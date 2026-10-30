'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { PermissionError, requireCompanyPermission, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Trade opportunities (migration 0540; actions opp.post / opp.reply / opp.withdraw, staff opp.share / opp.decide /
 * opp.close). Each checks the permission here, then the api.* function checks it again in the database and audits.
 */
export interface OppResult {
  ok: boolean;
  message: string;
}

const uuid = z.string().uuid();
const refresh = () => {
  revalidatePath('/[locale]/portal/opportunities', 'page');
  revalidatePath('/[locale]/admin/content', 'page');
};

function fail(locale: Locale, error: unknown, what: string): OppResult {
  const t = (k: string) => msg(locale, `opp.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  if (e?.code === 'P0001' && e.hint && ['fields', 'closed', 'own', 'duplicate', 'reason'].includes(e.hint))
    return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}
const ok = (locale: Locale, k: string): OppResult => ({ ok: true, message: msg(locale, `opp.done.${k}`) });

const post = z.object({
  company: uuid,
  title: z.string().trim().min(5).max(160),
  body: z.string().trim().min(10).max(4000),
  sector: z.string().trim().max(80).optional(),
  market: z.string().trim().max(80).optional(),
  days: z.coerce.number().int().min(1).max(180).default(30),
});

export async function postRequirement(form: FormData): Promise<OppResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const v = post.parse(Object.fromEntries(form));
    await requireCompanyPermission(v.company, 'events', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('opp_post', {
      p_company: v.company,
      p_title: v.title,
      p_body: v.body,
      p_sector: v.sector ?? '',
      p_market: v.market ?? '',
      p_days: Math.min(v.days, 90),
    });
    if (error) throw error;
    refresh();
    return ok(locale, 'posted');
  } catch (error) {
    return fail(locale, error, 'opp.post');
  }
}

export async function withdrawPost(locale: Locale, id: string): Promise<OppResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('opp_withdraw_post', { p_id: uuid.parse(id) });
    if (error) throw error;
    refresh();
    return ok(locale, 'withdrawn');
  } catch (error) {
    return fail(locale, error, 'opp.withdraw');
  }
}

export async function expressInterest(locale: Locale, id: string, company: string, body: string): Promise<OppResult> {
  try {
    await requireCompanyPermission(uuid.parse(company), 'events', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('opp_interest', {
      p_id: uuid.parse(id),
      p_company: company,
      p_body: z.string().trim().min(1).max(4000).parse(body),
    });
    if (error) throw error;
    refresh();
    return ok(locale, 'interested');
  } catch (error) {
    return fail(locale, error, 'opp.reply');
  }
}

export async function withdrawInterest(locale: Locale, id: string, company: string): Promise<OppResult> {
  try {
    await requireCompanyPermission(uuid.parse(company), 'events', 2);
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('opp_withdraw_interest', { p_id: uuid.parse(id), p_company: company });
    if (error) throw error;
    refresh();
    return ok(locale, 'interestWithdrawn');
  } catch (error) {
    return fail(locale, error, 'opp.unreply');
  }
}

// ───────── staff ─────────
export async function shareInquiry(form: FormData): Promise<OppResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('eng', 2);
    const v = post.omit({ company: true }).parse(Object.fromEntries(form));
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('opp_share', {
      p_title: v.title,
      p_body: v.body,
      p_sector: v.sector ?? '',
      p_market: v.market ?? '',
      p_days: v.days,
    });
    if (error) throw error;
    refresh();
    return ok(locale, 'shared');
  } catch (error) {
    return fail(locale, error, 'opp.share');
  }
}

export async function decidePost(locale: Locale, id: string, publish: boolean, reason: string): Promise<OppResult> {
  try {
    await requirePermission('eng', 2);
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('opp_decide', {
        p_id: uuid.parse(id),
        p_publish: publish,
        p_reason: reason.trim() || (null as unknown as string),
      });
    if (error) throw error;
    refresh();
    return ok(locale, publish ? 'published' : 'rejected');
  } catch (error) {
    return fail(locale, error, 'opp.decide');
  }
}

export async function closeOpportunity(locale: Locale, id: string): Promise<OppResult> {
  try {
    await requirePermission('eng', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('opp_close', { p_id: uuid.parse(id) });
    if (error) throw error;
    refresh();
    return ok(locale, 'closed');
  } catch (error) {
    return fail(locale, error, 'opp.close');
  }
}
