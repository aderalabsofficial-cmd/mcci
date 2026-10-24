'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { type ActionResult, dbFail, fail, ok, permissionFail } from '@/lib/access/result';
import { sendInvitation } from '@/lib/invitations/email';
import { msg } from '@/lib/nav/model';
import { requireCompanyPermission, requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { PARTICULAR_FIELDS } from './fields';

/**
 * Company Profile (actions user.invite, user.edit, user.resend, user.remove, profile.change, setting.toggle me.prefs).
 * Colleagues are managed by the company's Owner only (area 'profile' level 3, docs/06): requireCompanyPermission
 * refuses early, and the api.* functions / RLS policies check the same rule again in the database and write
 * audit_log. The last active Owner cannot be removed or demoted (trigger keep_one_owner, finding F-20).
 */

const PAGE = '/[locale]/portal/profile';
const localeOf = (form: FormData): Locale => asLocale(String(form.get('locale') ?? 'en'));
const uuid = z.string().uuid();
const INVITE_ROLES = ['Manager', 'Services', 'Accounts', 'Viewer'] as const;

async function owner(locale: Locale, form: FormData) {
  const company = uuid.safeParse(form.get('company'));
  if (!company.success) return { denied: fail(locale, 'access.errors.notAllowed') };
  try {
    return { actor: await requireCompanyPermission(company.data, 'profile', 'approve'), company: company.data };
  } catch (error) {
    return { denied: permissionFail(locale, error) };
  }
}

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  role: z.enum(INVITE_ROLES),
});

export async function inviteCompanyUser(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await owner(locale, form);
  if (g.denied) return g.denied;
  const parsed = inviteSchema.safeParse({ name: form.get('name'), email: form.get('email'), role: form.get('role') });
  if (!parsed.success) {
    return fail(
      locale,
      parsed.error.issues.some((i) => i.path[0] === 'email') ? 'access.errors.email' : 'access.errors.required',
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('invite_company_user', {
    p_company: g.company!,
    p_email: parsed.data.email,
    p_full_name: parsed.data.name,
    p_role: parsed.data.role,
  });
  if (error) return dbFail(locale, error, 'user.invite');
  const token = data?.[0]?.token;
  if (!token) return fail(locale, 'access.errors.generic');
  const companyName = g.actor!.access.companies.find((c) => c.id === g.company)?.name ?? null;
  const sent = await sendInvitation({
    kind: 'company_user',
    to: parsed.data.email.toLowerCase(),
    name: parsed.data.name,
    inviter: g.actor!.access.full_name || companyName || 'MCCI',
    company: companyName,
    role: parsed.data.role,
    token,
  });
  revalidatePath(PAGE, 'page');
  return sent
    ? ok(locale, 'access.company.invited', { email: parsed.data.email.toLowerCase() })
    : { ok: false, message: msg(locale, 'access.company.invitedNoEmail') };
}

export async function resendCompanyInvite(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await owner(locale, form);
  if (g.denied) return g.denied;
  const id = uuid.safeParse(form.get('id'));
  if (!id.success) return fail(locale, 'access.errors.generic');
  const supabase = await createClient();
  const inv = await supabase
    .from('invitations')
    .select('email, full_name, company_role, company_id')
    .eq('id', id.data)
    .maybeSingle();
  if (inv.error || !inv.data || inv.data.company_id !== g.company) return fail(locale, 'access.errors.invite_closed');
  const { data: token, error } = await supabase.schema('api').rpc('invite_resend', { p_id: id.data });
  if (error) return dbFail(locale, error, 'user.resend');
  const companyName = g.actor!.access.companies.find((c) => c.id === g.company)?.name ?? null;
  const sent = await sendInvitation({
    kind: 'company_user',
    to: inv.data.email,
    name: inv.data.full_name,
    inviter: g.actor!.access.full_name || companyName || 'MCCI',
    company: companyName,
    role: inv.data.company_role,
    token: token as string,
  });
  revalidatePath(PAGE, 'page');
  return sent
    ? ok(locale, 'access.company.resent', { email: inv.data.email })
    : { ok: false, message: msg(locale, 'access.company.invitedNoEmail') };
}

export async function revokeCompanyInvite(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await owner(locale, form);
  if (g.denied) return g.denied;
  const id = uuid.safeParse(form.get('id'));
  if (!id.success) return fail(locale, 'access.errors.generic');
  const supabase = await createClient();
  const { error } = await supabase.schema('api').rpc('invite_revoke', { p_id: id.data });
  if (error) return dbFail(locale, error, 'user.remove');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.company.cancelled');
}

const userSchema = z.object({ user: uuid, role: z.enum(INVITE_ROLES) });

export async function updateCompanyUser(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await owner(locale, form);
  if (g.denied) return g.denied;
  const parsed = userSchema.safeParse({ user: form.get('user'), role: form.get('role') });
  if (!parsed.success) return fail(locale, 'access.errors.required');
  if (parsed.data.user === g.actor!.userId) return fail(locale, 'access.errors.self');
  const supabase = await createClient();
  const { error } = await supabase.schema('api').rpc('company_user_update', {
    p_company: g.company!,
    p_user: parsed.data.user,
    p_role: parsed.data.role,
    p_active: true,
  });
  if (error) return dbFail(locale, error, 'user.edit');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.company.saved');
}

export async function removeCompanyUser(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await owner(locale, form);
  if (g.denied) return g.denied;
  const user = uuid.safeParse(form.get('user'));
  if (!user.success) return fail(locale, 'access.errors.generic');
  if (user.data === g.actor!.userId) return fail(locale, 'access.errors.self');
  const supabase = await createClient();
  const people = await supabase.schema('api').rpc('company_people', { p_company: g.company! });
  const person = people.data?.find((p) => p.user_id === user.data);
  if (!person) return fail(locale, 'access.errors.not_member');
  const { error } = await supabase.schema('api').rpc('company_user_update', {
    p_company: g.company!,
    p_user: user.data,
    p_role: person.role,
    p_active: false,
  });
  if (error) return dbFail(locale, error, 'user.remove');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.company.removed', { name: person.full_name });
}

const changeSchema = z.object({
  field: z.enum(PARTICULAR_FIELDS),
  value: z.string().trim().min(1).max(500),
  reason: z.string().trim().max(500).optional(),
});

/** profile.change: a request MCCI approves later (members register, M8); RLS allows it for the Owner only. */
export async function requestParticularChange(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await owner(locale, form);
  if (g.denied) return g.denied;
  const parsed = changeSchema.safeParse({
    field: form.get('field'),
    value: form.get('value'),
    reason: form.get('reason') || undefined,
  });
  if (!parsed.success) return fail(locale, 'access.errors.required');
  const supabase = await createClient();
  const current = await supabase.from('companies').select(parsed.data.field).eq('id', g.company!).maybeSingle();
  if (current.error || !current.data) return fail(locale, 'access.errors.notAllowed');
  const old = (current.data as Record<string, unknown>)[parsed.data.field];
  const { error } = await supabase.from('change_requests').insert({
    company_id: g.company!,
    field: parsed.data.field,
    old_value: old == null ? null : String(old),
    new_value: parsed.data.value,
    reason: parsed.data.reason ?? null,
  });
  if (error) return dbFail(locale, error, 'profile.change');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.company.changeSent');
}

/** setting.toggle me.prefs.urdu: the person's own language for emails and messages (profiles.lang, own row). */
export async function setUrduFirst(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  let actor;
  try {
    actor = await requireUser();
  } catch (error) {
    return permissionFail(locale, error);
  }
  const lang = form.get('urdu') === 'on' ? 'ur' : 'en';
  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ lang }).eq('id', actor.userId);
  if (error) return dbFail(locale, error, 'setting.toggle');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.company.saved');
}
