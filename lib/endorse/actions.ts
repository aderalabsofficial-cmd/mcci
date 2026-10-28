'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { bilingualEmail } from '@/lib/email/bilingual';
import { sendEmail } from '@/lib/email/send';
import { msg } from '@/lib/nav/model';
import { trustedClientIp } from '@/lib/net/client-ip';
import { PermissionError, requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Proposer & seconder (docs/04; actions end.pick, end.compose, end.withdraw, end.remind, end.review, end.approve,
 * end.decline, adm.prop.remind). Every call runs with the person's own session; the api.* functions of migration 0320
 * decide who may do what (applicant, endorser, officer) and check eligibility again. Emails go after the database
 * change; a failed email never undoes it (the portal message is already written).
 */

export interface EndResult {
  ok: boolean;
  message: string;
}

export interface Candidate {
  member_id: string;
  member_no: string;
  company: string;
  rep: string;
  class: string;
  sector: string;
  same_sector: boolean;
  year_count: number;
  why: string | null;
}

const uuid = z.string().uuid();
const role = z.enum(['proposer', 'seconder']);
const PAGES = [
  '/[locale]/portal/join',
  '/[locale]/portal',
  '/[locale]/portal/endorse',
  '/[locale]/portal/mtrack',
  '/[locale]/admin/mreview',
];
const refresh = () => PAGES.forEach((p) => revalidatePath(p, 'page'));

function fail(locale: Locale, error: unknown, what: string): EndResult {
  if (error instanceof PermissionError || error instanceof z.ZodError)
    return { ok: false, message: msg(locale, 'endorse.errors.notAllowed') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: msg(locale, 'endorse.errors.notAllowed') };
  const known = ['wrong_stage', 'not_eligible', 'already_requested', 'too_soon', 'expired', 'reason_required'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint))
    return { ok: false, message: msg(locale, `endorse.errors.${e.hint}`) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: msg(locale, 'endorse.errors.generic') };
}

const mail = async (m: Parameters<typeof bilingualEmail>[0]) => {
  try {
    await sendEmail(bilingualEmail(m));
    return true;
  } catch (error) {
    console.error('endorsement email not sent', (error as Error)?.name);
    return false;
  }
};

// ───────── applicant ─────────

export async function listCandidates(locale: Locale, appId: string, r: string, q: string): Promise<Candidate[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema('api')
    .rpc('end_candidates', { p_app: uuid.parse(appId), p_role: role.parse(r), p_query: z.string().max(80).parse(q) });
  if (error) {
    console.error('end.pick failed', error.code);
    return [];
  }
  return (data ?? []) as Candidate[];
}

export async function requestEndorsement(
  locale: Locale,
  appId: string,
  r: string,
  memberId: string,
  note: string,
): Promise<EndResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('end_request', {
      p_app: uuid.parse(appId),
      p_role: role.parse(r),
      p_member: uuid.parse(memberId),
      p_message: z.string().max(1000).parse(note),
    });
    if (error) throw error;
    refresh();
    for (const c of data ?? []) {
      await mail({
        to: c.email,
        name: c.full_name,
        subject: 'endorse.email.requestSubject',
        vars: { applicant: c.applicant, business: c.business, role: msg('en', `endorse.roles.${r}`), token: c.token },
        paragraphs: ['endorse.email.requestBody', 'endorse.email.requestHow'],
        quote: note,
        action: { label: 'endorse.email.open', path: '/portal/endorse' },
      });
    }
    return { ok: true, message: msg(locale, 'endorse.done.requested') };
  } catch (error) {
    return fail(locale, error, 'end.compose');
  }
}

export async function withdrawEndorsement(locale: Locale, id: string): Promise<EndResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('end_withdraw', { p_endorsement: uuid.parse(id) });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'endorse.done.withdrawn') };
  } catch (error) {
    return fail(locale, error, 'end.withdraw');
  }
}

/** end.remind (applicant) and adm.prop.remind (officer): the database decides which of the two the person is */
export async function remindEndorser(locale: Locale, id: string): Promise<EndResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('end_remind', { p_endorsement: uuid.parse(id) });
    if (error) throw error;
    refresh();
    for (const c of data ?? []) {
      await mail({
        to: c.email,
        name: c.full_name,
        subject: 'endorse.email.remindSubject',
        vars: {
          applicant: c.applicant,
          business: c.business,
          role: msg('en', `endorse.roles.${c.role}`),
          token: c.token,
        },
        paragraphs: ['endorse.email.remindBody'],
        action: { label: 'endorse.email.open', path: '/portal/endorse' },
      });
    }
    return { ok: true, message: msg(locale, 'endorse.done.reminded') };
  } catch (error) {
    return fail(locale, error, 'end.remind');
  }
}

// ───────── endorser ─────────

/** the request must be in the person's own inbox (their session, RLS) before the server acts for it */
async function ownRequest(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.schema('api').rpc('end_inbox');
  const row = (data ?? []).find((r) => r.id === id);
  if (!row) throw new PermissionError('not-in-company');
  return row;
}

/** end.approve: consent only (owner's decision, docs/21 point 17) — no code, no signature */
export async function approveEndorsement(locale: Locale, id: string): Promise<EndResult> {
  try {
    await requireUser();
    const row = await ownRequest(uuid.parse(id));
    if (row.status !== 'Pending') return { ok: false, message: msg(locale, 'endorse.errors.wrong_stage') };
    const h = await headers();
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('end_approve', {
      p_endorsement: row.id,
      p_ip: trustedClientIp(h) ?? '',
      p_user_agent: (h.get('user-agent') ?? '').slice(0, 300),
    });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'endorse.done.approved') };
  } catch (error) {
    return fail(locale, error, 'end.approve');
  }
}

export async function declineEndorsement(locale: Locale, id: string, reason: string): Promise<EndResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('end_decline', { p_endorsement: uuid.parse(id), p_reason: z.string().trim().min(1).max(500).parse(reason) });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'endorse.done.declined') };
  } catch (error) {
    return fail(locale, error, 'end.decline');
  }
}
