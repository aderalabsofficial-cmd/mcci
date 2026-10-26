'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { type ActionResult, dbFail, fail, ok, permissionFail } from '@/lib/access/result';
import { deleteAuthenticators } from '@/lib/auth/admin/invitations';
import { confirmPassword } from '@/lib/auth/admin/reauth';
import { sendInvitation } from '@/lib/invitations/email';
import { msg } from '@/lib/nav/model';
import { forwardedAuthHeaders } from '@/lib/net/client-ip';
import { STAFF_MODULES } from '@/lib/permissions/levels';
import { requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Staff & Roles (actions staff.invite, staff.edit, staff.resend, staff.revoke, staff.reset2fa, perm.save, perm.reset —
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

/** the password is checked by Supabase Auth on the server, then the database requires that fresh check (0400) */
async function confirmed(locale: Locale, userId: string, form: FormData): Promise<ActionResult | null> {
  const password = String(form.get('password') ?? '');
  if (!password) return fail(locale, 'access.errors.reauth');
  const r = await confirmPassword(userId, password, forwardedAuthHeaders(await headers()));
  if (r === 'limited') return fail(locale, 'access.errors.reauthLimited');
  if (r === 'wrong') return fail(locale, 'access.errors.reauthWrong');
  return null;
}

const levelsSchema = z.partialRecord(z.enum(STAFF_MODULES), z.number().int().min(0).max(3));

/**
 * perm.save: one designation's limits, saved together after the person re-enters their password (owner's request,
 * 26 Oct 2026; migration 0400). Only the levels that changed are written; every change is audited with the reason.
 */
export async function saveRoleLimits(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const designation = z.string().trim().min(1).max(80).safeParse(form.get('designation'));
  let levels;
  try {
    levels = levelsSchema.parse(JSON.parse(String(form.get('levels') ?? '{}')));
  } catch {
    return fail(locale, 'access.errors.level');
  }
  if (!designation.success) return fail(locale, 'access.errors.designation');
  const refused = await confirmed(locale, g.actor!.userId, form);
  if (refused) return refused;
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('role_permissions_save', { p_designation: designation.data, p_levels: levels });
  if (error) return dbFail(locale, error, 'perm.save');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.staff.limitsSaved', { designation: designation.data, n: String(data ?? 0) });
}

export async function resetRoleLimits(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const locale = localeOf(form);
  const g = await guard(locale);
  if (g.denied) return g.denied;
  const refused = await confirmed(locale, g.actor!.userId, form);
  if (refused) return refused;
  const supabase = await createClient();
  const { error } = await supabase.schema('api').rpc('role_permissions_reset');
  if (error) return dbFail(locale, error, 'perm.reset');
  revalidatePath(PAGE, 'page');
  return ok(locale, 'access.staff.limitsReset');
}
