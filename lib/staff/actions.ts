'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { type ActionResult, dbFail, fail, ok, permissionFail } from '@/lib/access/result';
import { deleteAuthenticators } from '@/lib/auth/admin/invitations';
import { sendInvitation } from '@/lib/invitations/email';
import { msg } from '@/lib/nav/model';
import { STAFF_MODULES } from '@/lib/permissions/levels';
import { requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Staff & Roles (actions staff.invite, staff.edit, staff.resend, staff.revoke, staff.reset2fa, perm.cycle, perm.reset —
 * docs/catalogue/actions.md). Each starts with requirePermission('staff', 'approve') — Secretary General by default
 * (docs/06) — and then calls an api.* function WITH THE USER'S OWN SESSION, which checks the same permission again
 * in the database, changes the rows and writes audit_log (who, old → new, why) through the row triggers
 * (migrations 0280, 0290). Invitation tokens exist only in memory here, on their way into the email.
 */

const PAGE = '/[locale]/admin/staff';
const localeOf = (form: FormData): Locale => asLocale(String(form.get('locale') ?? 'en'));

async function guard(locale: Locale) {
  try {
    return { actor: await requirePermission('staff', 'approve') };
  } catch (error) {
    return { denied: permissionFail(locale, error) };
  }
}

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  designation: z.string().trim().min(1).max(80),
  note: z.string().trim().max(1000).optional(),
});

export async function inviteStaff(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const parsed = inviteSchema.safeParse({
    name: form.get('name'),
    email: form.get('email'),
    designation: form.get('designation'),
    note: form.get('note') || undefined,
  });
  if (!parsed.success) {
    return fail(
      locale,
      parsed.error.issues.some((i) => i.path[0] === 'email') ? 'access.errors.email' : 'access.errors.required',
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('invite_staff', {
    p_email: parsed.data.email,
    p_full_name: parsed.data.name,
    p_designation: parsed.data.designation,
  });
  if (error) return dbFail(locale, error, 'staff.invite');
  const token = data?.[0]?.token;
  if (!token) return fail(locale, 'access.errors.generic');
  const sent = await sendInvitation({
    kind: 'staff',
    to: parsed.data.email.toLowerCase(),
    name: parsed.data.name,
    inviter: g.actor!.access.full_name || 'MCCI',
    designation: parsed.data.designation,
    note: parsed.data.note,
    token,
  });
  revalidatePath(PAGE, 'page');
  return sent
    ? ok(locale, 'access.staff.invited', { email: parsed.data.email.toLowerCase() })
    : { ok: false, message: msg(locale, 'access.staff.invitedNoEmail') };
}

const uuid = z.string().uuid();

export async function resendStaffInvite(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const id = uuid.safeParse(form.get('id'));
  if (!id.success) return fail(locale, 'access.errors.generic');
  const supabase = await createClient();
  // read before resend: the row (RLS: staff level 3) gives the email and name for the new message
  const inv = await supabase
    .from('invitations')
    .select('email, full_name, designation, kind')
    .eq('id', id.data)
    .maybeSingle();
  if (inv.error || !inv.data || inv.data.kind !== 'staff') return fail(locale, 'access.errors.invite_closed');
  const { data: token, error } = await supabase.schema('api').rpc('invite_resend', { p_id: id.data });
  if (error) return dbFail(locale, error, 'staff.resend');
  const sent = await sendInvitation({
    kind: 'staff',
    to: inv.data.email,
    name: inv.data.full_name,
    inviter: g.actor!.access.full_name || 'MCCI',
    designation: inv.data.designation,
    token: token as string,
  });
  revalidatePath(PAGE, 'page');
  return sent
    ? ok(locale, 'access.staff.resent', { email: inv.data.email })
    : { ok: false, message: msg(locale, 'access.staff.invitedNoEmail') };
}

export async function revokeStaffInvite(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const id = uuid.safeParse(form.get('id'));
  if (!id.success) return fail(locale, 'access.errors.generic');
  const supabase = await createClient();
  const { error } = await supabase.schema('api').rpc('invite_revoke', { p_id: id.data });
  if (error) return dbFail(locale, error, 'staff.revoke');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.staff.cancelled');
}

const updateSchema = z.object({
  user: uuid,
  designation: z.string().trim().min(1).max(80),
  status: z.enum(['Active', 'Disabled']),
});

export async function updateStaff(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const parsed = updateSchema.safeParse({
    user: form.get('user'),
    designation: form.get('designation'),
    status: form.get('status'),
  });
  if (!parsed.success) return fail(locale, 'access.errors.required');
  const supabase = await createClient();
  const { error } = await supabase.schema('api').rpc('staff_update', {
    p_user: parsed.data.user,
    p_designation: parsed.data.designation,
    p_active: parsed.data.status === 'Active',
  });
  if (error) return dbFail(locale, error, 'staff.edit');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.staff.saved');
}

export async function resetStaffMfa(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const user = uuid.safeParse(form.get('user'));
  if (!user.success) return fail(locale, 'access.errors.generic');
  const supabase = await createClient();
  // the database decides and audits first; only then does the admin API remove the authenticators
  const { error } = await supabase.schema('api').rpc('staff_mfa_reset', { p_user: user.data });
  if (error) return dbFail(locale, error, 'staff.reset2fa');
  await deleteAuthenticators(user.data);
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.staff.reset2faDone');
}

const limitSchema = z.object({
  designation: z.string().trim().min(1).max(80),
  module: z.enum(STAFF_MODULES),
  level: z.coerce.number().int().min(0).max(3),
});

export async function setRoleLimit(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const parsed = limitSchema.safeParse({
    designation: form.get('designation'),
    module: form.get('module'),
    level: form.get('level'),
  });
  if (!parsed.success) return fail(locale, 'access.errors.level');
  const supabase = await createClient();
  const { error } = await supabase.schema('api').rpc('role_permission_set', {
    p_designation: parsed.data.designation,
    p_module: parsed.data.module,
    p_level: parsed.data.level,
  });
  if (error) return dbFail(locale, error, 'perm.cycle');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.staff.limitSaved', {
    designation: parsed.data.designation,
    module: msg(locale, `access.modules.${parsed.data.module}`),
    level: msg(locale, `access.levels.${parsed.data.level}`),
  });
}

export async function resetRoleLimits(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const supabase = await createClient();
  const { error } = await supabase.schema('api').rpc('role_permissions_reset');
  if (error) return dbFail(locale, error, 'perm.reset');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.staff.limitsReset');
}
