import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Invitation steps that run before the invitee has a session, or that only Auth's admin API can do. Each one is
 * reached only from a server action or page that has already decided it may run:
 *   lookupInvitation      what an invitation link is for (api.invite_lookup — service role only, migration 0280)
 *   acceptInvitation      api.invite_accept: the token AND the account's email must match the invitation
 *   createInvitedAccount  the invitee sets a password: the account is created already confirmed, because opening the
 *                         emailed link proves control of that address; then the invitation is accepted
 *   deleteAuthenticators  2-step reset: removes the person's TOTP factors after api.staff_mfa_reset() allowed and
 *                         audited it with the manager's own session
 * Lookups are throttled per visitor address so the page cannot be used to probe tokens (they are 256-bit random,
 * the limit is defence in depth).
 */
export interface Invitation {
  id: string;
  kind: 'staff' | 'company_user';
  email: string;
  fullName: string | null;
  designation: string | null;
  companyName: string | null;
  companyRole: string | null;
  status: 'Invited' | 'Active' | 'Expired' | 'Revoked';
  expiresAt: string;
  /** an account with the invited email already exists (sign in instead of creating one) */
  accountExists: boolean;
}

const TOKEN = /^[A-Za-z0-9_-]{40,64}$/;

export type LookupResult = { state: 'ok'; invitation: Invitation } | { state: 'invalid' | 'throttled' };

export async function lookupInvitation(token: string, clientIp: string | null): Promise<LookupResult> {
  if (!TOKEN.test(token)) return { state: 'invalid' };
  const db = createAdminClient();
  const { data: allowed, error: limitError } = await db.schema('api').rpc('rate_limit_take', {
    p_bucket: `invite-lookup:ip:${clientIp ?? 'unknown'}`,
    p_limit: 60,
    p_window_seconds: 300,
  });
  if (limitError) throw new Error(`rate limit check failed: ${limitError.message}`);
  if (allowed !== true) return { state: 'throttled' };

  const { data, error } = await db.schema('api').rpc('invite_lookup', { p_token: token });
  if (error) throw new Error(`invite_lookup failed: ${error.message}`);
  const row = data?.[0];
  if (!row) return { state: 'invalid' };
  const account = await db.from('profiles').select('id').eq('email', row.email).maybeSingle();
  if (account.error) throw new Error(`profile lookup failed: ${account.error.message}`);
  return {
    state: 'ok',
    invitation: {
      id: row.id,
      kind: row.kind as Invitation['kind'],
      email: row.email,
      fullName: row.full_name,
      designation: row.designation,
      companyName: row.company_name,
      companyRole: row.company_role,
      status: row.status as Invitation['status'],
      expiresAt: row.expires_at,
      accountExists: !!account.data,
    },
  };
}

export type AcceptError = 'invite_invalid' | 'invite_expired' | 'email_mismatch' | 'account_exists' | 'failed';

function acceptError(error: { code?: string; hint?: string | null; message: string }): AcceptError {
  if (error.code === 'P0001' && ['invite_invalid', 'invite_expired', 'email_mismatch'].includes(error.hint ?? ''))
    return error.hint as AcceptError;
  console.error('invite_accept failed', error.code, error.message);
  return 'failed';
}

export async function acceptInvitation(
  token: string,
  userId: string,
): Promise<{ kind: Invitation['kind'] } | { error: AcceptError }> {
  if (!TOKEN.test(token)) return { error: 'invite_invalid' };
  const db = createAdminClient();
  const { data, error } = await db.schema('api').rpc('invite_accept', { p_token: token, p_user: userId });
  if (error) return { error: acceptError(error) };
  return { kind: (data?.[0]?.kind ?? 'company_user') as Invitation['kind'] };
}

/** Creates the invited person's account (confirmed) and accepts; returns the email to sign in with. */
export async function createInvitedAccount(
  token: string,
  password: string,
): Promise<{ email: string; kind: Invitation['kind'] } | { error: AcceptError }> {
  if (!TOKEN.test(token)) return { error: 'invite_invalid' };
  const db = createAdminClient();
  const { data, error } = await db.schema('api').rpc('invite_lookup', { p_token: token });
  if (error) throw new Error(`invite_lookup failed: ${error.message}`);
  const inv = data?.[0];
  if (!inv || inv.status !== 'Invited')
    return { error: inv?.status === 'Expired' ? 'invite_expired' : 'invite_invalid' };
  const existing = await db.from('profiles').select('id').eq('email', inv.email).maybeSingle();
  if (existing.error) throw new Error(`profile lookup failed: ${existing.error.message}`);
  if (existing.data) return { error: 'account_exists' };

  const created = await db.auth.admin.createUser({
    email: inv.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: inv.full_name ?? inv.email.split('@')[0] },
  });
  if (created.error || !created.data.user) {
    console.error('invited account not created', created.error?.status, created.error?.code);
    return { error: 'failed' };
  }
  const accepted = await acceptInvitation(token, created.data.user.id);
  if ('error' in accepted) {
    // never leave a half-made account behind: it would block the next attempt with "account exists"
    await db.auth.admin.deleteUser(created.data.user.id);
    return accepted;
  }
  return { email: inv.email, kind: accepted.kind };
}

export async function deleteAuthenticators(userId: string): Promise<void> {
  const db = createAdminClient();
  const { data, error } = await db.auth.admin.mfa.listFactors({ userId });
  if (error) throw new Error(`listing authenticators failed: ${error.message}`);
  for (const factor of data.factors) {
    const removed = await db.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
    if (removed.error) throw new Error(`removing an authenticator failed: ${removed.error.message}`);
  }
}
