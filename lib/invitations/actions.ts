'use server';

import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { acceptInvitation, type AcceptError, createInvitedAccount } from '@/lib/auth/admin/invitations';
import { msg } from '@/lib/nav/model';
import { getSession } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Accepting an invitation (staff.accept / user.accept in the built system): the invitee opens the emailed link and
 * either sets a password (no account yet) or, already signed in with the invited address, accepts. Staff then go
 * to the 2-step login set-up (/login/verify), company users to their company profile.
 */
export interface InviteFormState {
  error?: string;
}

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{40,64}$/);

function errorText(locale: Locale, error: AcceptError): string {
  switch (error) {
    case 'invite_expired':
      return msg(locale, 'access.invite.expired');
    case 'invite_invalid':
      return msg(locale, 'access.invite.invalid');
    case 'email_mismatch':
      return msg(locale, 'access.invite.invalid');
    case 'account_exists':
      return msg(locale, 'access.invite.haveAccount');
    default:
      return msg(locale, 'access.errors.generic');
  }
}

const next = (kind: 'staff' | 'company_user') => (kind === 'staff' ? '/login/verify' : '/portal/profile');

export async function activateInvitedAccount(_: InviteFormState, form: FormData): Promise<InviteFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const token = tokenSchema.safeParse(form.get('token'));
  if (!token.success) return { error: msg(locale, 'access.invite.invalid') };
  const password = String(form.get('password') ?? '');
  if (password.length < 10 || password.length > 200) return { error: msg(locale, 'access.invite.passwordRule') };
  if (password !== String(form.get('confirm') ?? '')) return { error: msg(locale, 'access.invite.mismatch') };

  const created = await createInvitedAccount(token.data, password);
  if ('error' in created) return { error: errorText(locale, created.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: created.email, password });
  if (error) {
    console.error('invited account: sign-in after activation failed', error.status, error.code);
    redirect({ href: '/login', locale });
  }
  redirect({ href: next(created.kind), locale });
  return {};
}

export async function acceptAsSignedIn(_: InviteFormState, form: FormData): Promise<InviteFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const token = tokenSchema.safeParse(form.get('token'));
  if (!token.success) return { error: msg(locale, 'access.invite.invalid') };
  const session = await getSession();
  if (!session) {
    redirect({ href: `/login?next=${encodeURIComponent(`/invite/${token.data}`)}`, locale });
    return {};
  }
  const accepted = await acceptInvitation(token.data, session.userId);
  if ('error' in accepted) return { error: errorText(locale, accepted.error) };
  redirect({ href: next(accepted.kind), locale });
  return {};
}
