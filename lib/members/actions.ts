'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { sendInvitation } from '@/lib/invitations/email';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { BIZ_TYPES } from '@/lib/membership/reference';
import { createClient } from '@/lib/supabase/server';

/**
 * Members Register, minimal (mem.add): staff with module 'reg' ≥ 2 add an existing MCCI member (company, class,
 * membership number, representative, validity) and invite its owner by email; the owner then signs in to MCCI Digital
 * and can endorse applicants (docs/04). The full register, Excel import and change requests are M8.
 */

export interface MemberAddResult {
  ok: boolean;
  message: string;
}

const schema = z.object({
  company: z.string().trim().min(2).max(200),
  biz: z.enum(BIZ_TYPES),
  cls: z.enum(['Corporate', 'Associate']),
  memberNo: z.union([z.literal(''), z.string().trim().toUpperCase().regex(/^MCCI-[CA]-\d{3,6}$/)]),
  rep: z.string().trim().min(2).max(120),
  since: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sector: z.string().trim().max(40),
  women: z.boolean(),
  email: z.string().trim().toLowerCase().email().max(254),
  owner: z.string().trim().min(2).max(120),
});

export async function addMember(form: FormData): Promise<MemberAddResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const actor = await requirePermission('reg', 2);
    const p = schema.safeParse({
      company: form.get('company'),
      biz: form.get('biz'),
      cls: form.get('cls'),
      memberNo: form.get('memberNo') ?? '',
      rep: form.get('rep'),
      since: form.get('since') ?? '',
      validTo: form.get('validTo'),
      sector: form.get('sector') ?? '',
      women: form.get('women') === 'on',
      email: form.get('email'),
      owner: form.get('owner'),
    });
    if (!p.success) return { ok: false, message: msg(locale, 'register.errors.fields') };
    const d = p.data;
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('member_add', {
      p_company: d.company,
      p_biz: d.biz,
      p_class: d.cls,
      p_member_no: d.memberNo,
      p_rep: d.rep,
      p_since: d.since || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }),
      p_valid_to: d.validTo,
      p_sector: d.sector,
      p_women: d.women,
      p_owner_email: d.email,
      p_owner_name: d.owner,
    });
    if (error) {
      if (error.code === '42501') return { ok: false, message: msg(locale, 'register.errors.notAllowed') };
      if (error.hint === 'member_no' || error.hint === 'member_no_taken') return { ok: false, message: msg(locale, `register.errors.${error.hint}`) };
      if (error.hint === 'email') return { ok: false, message: msg(locale, 'register.errors.fields') };
      console.error('mem.add failed', error.code, error.message);
      return { ok: false, message: msg(locale, 'register.errors.generic') };
    }
    const row = data?.[0];
    if (!row?.token) return { ok: false, message: msg(locale, 'register.errors.generic') };
    const sent = await sendInvitation({
      kind: 'company_user',
      to: d.email,
      name: d.owner,
      inviter: actor.access.full_name || 'MCCI',
      company: d.company,
      role: 'Owner',
      token: row.token,
    });
    revalidatePath('/[locale]/admin/members', 'page');
    return {
      ok: true,
      message: msg(locale, sent ? 'register.done.added' : 'register.done.addedNoEmail', { no: row.member_no, email: d.email }),
    };
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'register.errors.notAllowed') };
    throw error;
  }
}

// ───────── member lifecycle (0440, docs/22 §3): renew, restore, blacklist / whitelist ─────────

const memberId = z.string().uuid();
const why = z.string().trim().min(3).max(1000);

function lifecycleFail(locale: Locale, error: unknown, what: string): MemberAddResult {
  if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'register.errors.notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: msg(locale, 'register.life.errors.reason_required') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: msg(locale, 'register.errors.notAllowed') };
  const known = ['reason_required', 'not_found', 'demo', 'not_whitelisted', 'wrong_status', 'already_renewed', 'open_voucher', 'not_blacklisted', 'fees', 'declaration', 'documents', 'period', 'not_open', 'date', 'not_legacy', 'fields', 'decided'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint)) {
    return { ok: false, message: msg(locale, `register.life.errors.${e.hint}`) };
  }
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: msg(locale, 'register.errors.generic') };
}

/** the documents a form carries: [{ path, name }] from the checked upload route */
const docsSchema = z.array(z.object({ path: z.string().min(10).max(300), name: z.string().max(200) })).max(10);
const parseDocs = (form: FormData, key: string) => docsSchema.parse(JSON.parse(String(form.get(key) || '[]')));
const dayText = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);
const refreshMembers = () => {
  revalidatePath('/[locale]/admin/members', 'page');
  revalidatePath('/[locale]/admin/member', 'page');
  revalidatePath('/[locale]/portal/membership', 'page');
};

/** changed particulars as the form lists them; only the fields the database accepts are sent */
const DECLARABLE = ['name', 'address', 'tel', 'email', 'ntn', 'gst', 'nature_sector', 'rep_name'] as const;
function declaredFields(form: FormData) {
  return DECLARABLE.flatMap((field) => {
    const value = String(form.get(`change_${field}`) ?? '').trim();
    return value ? [{ field, value: value.slice(0, 2000) }] : [];
  });
}

/**
 * reg.renew: the renewal voucher, with the declaration the owner requires: no change, or a change with its document,
 * which goes to the review queue. Staff may set the period (a reason is required when it differs from the proposal);
 * members take the proposal, from the date renewals open. Accounts verify the payment; the period then applies.
 */
export async function renewMember(form: FormData): Promise<MemberAddResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const id = memberId.parse(form.get('member'));
    const company = memberId.parse(form.get('company'));
    const declared = form.get('declaration') === 'change';
    if (!declared && form.get('declaration') !== 'none') {
      return { ok: false, message: msg(locale, 'register.life.errors.declaration') };
    }
    const staff = form.get('period') === 'staff';
    const from = dayText.parse(form.get('from') ?? '');
    const to = dayText.parse(form.get('to') ?? '');
    const period = {
      p_from: (staff && from ? from : null) as string,
      p_to: (staff && to ? to : null) as string,
      p_reason: String(form.get('reason') ?? '').trim().slice(0, 1000),
    };
    const supabase = await createClient();
    const { data, error } = declared
      ? await supabase.schema('api').rpc('member_renew_declared', {
          p_member: id,
          p_company: company,
          p_summary: why.parse(form.get('summary')),
          p_fields: declaredFields(form),
          p_docs: parseDocs(form, 'documents'),
          ...period,
        })
      : await supabase.schema('api').rpc('member_renew_start', { p_member: id, p_no_change: true, ...period });
    if (error) throw error;
    refreshMembers();
    return { ok: true, message: msg(locale, 'register.life.done.renew', { voucher: data ?? '' }) };
  } catch (error) {
    return lifecycleFail(locale, error, 'reg.renew');
  }
}

export interface RestoreQuote {
  ok: boolean;
  message?: string;
  lines?: { label: string; amount: number }[];
  total?: number;
  since?: string | null;
  until?: string;
}

export async function quoteRestore(locale: Locale, id: string): Promise<RestoreQuote> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('member_restore_quote', { p_member: memberId.parse(id) });
    if (error) throw error;
    return { ok: true, ...(data as object) };
  } catch (error) {
    return lifecycleFail(locale, error, 'reg.restore.quote');
  }
}

/** reg.restore: tax returns and all dues through a voucher. The date of enrollment never changes (owner, 1 Nov 2026). */
export async function restoreMember(form: FormData): Promise<MemberAddResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('member_restore_start', {
      p_member: memberId.parse(form.get('member')),
      p_docs: parseDocs(form, 'documents'),
      p_reason: String(form.get('reason') ?? '').trim().slice(0, 1000),
    });
    if (error) throw error;
    refreshMembers();
    return data
      ? { ok: true, message: msg(locale, 'register.life.done.restoreVoucher', { voucher: data }) }
      : { ok: true, message: msg(locale, 'register.life.done.restoreNow') };
  } catch (error) {
    return lifecycleFail(locale, error, 'reg.restore');
  }
}

/** reg.enrollment: a legacy member's date, the oldest of the SECP and FBR dates */
export async function setEnrollment(form: FormData): Promise<MemberAddResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('reg', 2);
    const secp = dayText.parse(form.get('secp') ?? '');
    const fbr = dayText.parse(form.get('fbr') ?? '');
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('member_enrollment_set', {
      p_member: memberId.parse(form.get('member')),
      p_secp: (secp || null) as string,
      p_fbr: (fbr || null) as string,
      p_reason: String(form.get('reason') ?? '').trim().slice(0, 1000),
    });
    if (error) throw error;
    refreshMembers();
    return { ok: true, message: msg(locale, 'register.life.done.enrollment', { d: data ?? '' }) };
  } catch (error) {
    return lifecycleFail(locale, error, 'reg.enrollment');
  }
}

/** reg.season: the day members can start their own renewal (a DGTO order or gazette notification can move it) */
export async function saveRenewalOpens(form: FormData): Promise<MemberAddResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('reg', 3);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('renewal_opens_save', {
      p_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(form.get('opensOn')),
      p_reason: why.parse(form.get('reason')),
    });
    if (error) throw error;
    refreshMembers();
    return { ok: true, message: msg(locale, 'register.life.done.season') };
  } catch (error) {
    return lifecycleFail(locale, error, 'reg.season');
  }
}

/** chg.submit: a change declared at any time from the portal, or by staff for a member, with its document */
export async function submitDeclaration(form: FormData): Promise<MemberAddResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const company = memberId.parse(form.get('company'));
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('declaration_submit', {
      p_company: company,
      p_context: 'anytime',
      p_summary: why.parse(form.get('summary')),
      p_fields: declaredFields(form),
      p_docs: parseDocs(form, 'documents'),
    });
    if (error) throw error;
    revalidatePath('/[locale]/portal/profile', 'page');
    revalidatePath('/[locale]/admin/changes', 'page');
    return { ok: true, message: msg(locale, 'register.life.done.declared') };
  } catch (error) {
    return lifecycleFail(locale, error, 'chg.submit');
  }
}

/** chg.decide: approved fields go to the live profile; a refusal needs its reason and tells the member */
export async function decideDeclaration(locale: Locale, id: string, approve: boolean, note: string): Promise<MemberAddResult> {
  try {
    await requirePermission('chg', 3);
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('declaration_decide', { p_id: memberId.parse(id), p_approve: approve, p_note: note.trim().slice(0, 1000) });
    if (error) throw error;
    revalidatePath('/[locale]/admin/changes', 'page');
    refreshMembers();
    return { ok: true, message: msg(locale, approve ? 'register.life.done.approved' : 'register.life.done.rejected') };
  } catch (error) {
    return lifecycleFail(locale, error, 'chg.decide');
  }
}

/** reg.blacklist / reg.whitelist: recorded with the source or the evidence; whitelisting is needed before renewal */
export async function setBlacklist(locale: Locale, id: string, on: boolean, reason: string): Promise<MemberAddResult> {
  try {
    await requirePermission('reg', 2);
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('member_blacklist', { p_member: memberId.parse(id), p_on: on, p_note: why.parse(reason) });
    if (error) throw error;
    revalidatePath('/[locale]/admin/members', 'page');
    return { ok: true, message: msg(locale, on ? 'register.life.done.blacklist' : 'register.life.done.whitelist') };
  } catch (error) {
    return lifecycleFail(locale, error, on ? 'reg.blacklist' : 'reg.whitelist');
  }
}
