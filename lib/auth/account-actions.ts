'use server';

import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { createClient, createStatelessClient } from '@/lib/supabase/server';
import { classifyIdentifier } from './identifier';

/**
 * Forgot / reset password and account registration (docs/16 C1, action register.start). Supabase Auth sends the
 * emails through ITS SMTP settings; links point at /auth/confirm on APP_URL — never at the request's Host header,
 * which a client controls.
 */
export interface AccountFormState {
  error?: string;
  sentTo?: string;
  resent?: boolean;
}

function appUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error('APP_URL is not set: email links cannot be built');
  return url.replace(/\/+$/, '');
}

function confirmLink(locale: Locale, next: string): string {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `${appUrl()}/auth/confirm?next=${encodeURIComponent(prefix + next)}`;
}

/** A 5xx from Auth means the email was not sent: say so. 429 = too many requests. Anything else reveals nothing. */
function mailError(locale: Locale, error: { status?: number } | null): string | null {
  if (!error) return null;
  if (error.status === 429) return msg(locale, 'auth.errors.rateLimited');
  if ((error.status ?? 500) >= 500) return msg(locale, 'auth.errors.unavailable');
  return null;
}

export async function requestPasswordReset(_: AccountFormState, form: FormData): Promise<AccountFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const id = classifyIdentifier(String(form.get('email') ?? ''));
  if (id.kind !== 'email') return { error: msg(locale, 'auth.errors.emailForCode') };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(id.value, {
    redirectTo: confirmLink(locale, '/login/reset'),
  });
  const text = mailError(locale, error);
  if (text) {
    if ((error?.status ?? 500) >= 500) console.error('auth: reset email not sent', error?.status);
    return { error: text };
  }
  return { sentTo: id.value };
}

const newPassword = z.string().min(10).max(200);

export async function updatePassword(_: AccountFormState, form: FormData): Promise<AccountFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const password = String(form.get('password') ?? '');
  if (password !== String(form.get('confirm') ?? '')) return { error: msg(locale, 'auth.resetPage.mismatch') };
  if (!newPassword.safeParse(password).success) return { error: msg(locale, 'auth.resetPage.tooShort') };

  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: msg(locale, 'auth.resetPage.noSession') };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === 'weak_password') return { error: msg(locale, 'auth.resetPage.tooShort') };
    if (error.code === 'same_password') return { error: msg(locale, 'auth.resetPage.same') };
    return {
      error: error.status === 429 ? msg(locale, 'auth.errors.rateLimited') : msg(locale, 'auth.errors.unavailable'),
    };
  }
  // docs/09: a password change signs the person out everywhere else
  await supabase.auth.signOut({ scope: 'others' });
  redirect({ href: '/login', locale });
  return {};
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: newPassword,
});

export async function registerAccount(_: AccountFormState, form: FormData): Promise<AccountFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const password = String(form.get('password') ?? '');
  if (password !== String(form.get('confirm') ?? '')) return { error: msg(locale, 'auth.resetPage.mismatch') };
  const parsed = registerSchema.safeParse({ fullName: form.get('fullName'), email: form.get('email'), password });
  if (!parsed.success) {
    const weak = parsed.error.issues.some((i) => i.path[0] === 'password');
    return { error: msg(locale, weak ? 'auth.registerPage.weak' : 'auth.errors.required') };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: confirmLink(locale, '/portal'),
      // profiles.full_name and profiles.lang come from this metadata (trigger handle_new_user, migration 0120)
      data: { full_name: parsed.data.fullName, lang: locale },
    },
  });
  if (error?.code === 'weak_password') return { error: msg(locale, 'auth.registerPage.weak') };
  const text = mailError(locale, error);
  if (text) {
    if ((error?.status ?? 500) >= 500) console.error('auth: confirmation email not sent', error?.status);
    return { error: text };
  }
  // An existing address gets the same answer (Auth does not reveal it either).
  return { sentTo: parsed.data.email };
}

/**
 * "Didn't get the email? Send it again" after registering: a new confirmation link for an account that is not
 * confirmed yet. Auth allows one email per address per minute (429 → "too many attempts") and answers the same for
 * unknown or already-confirmed addresses, so nothing about other accounts is revealed. Cookie-less, so the first
 * link keeps working when the resend is refused; the new link is the MCCI template's token_hash link (any device).
 */
export async function resendConfirmation(_: AccountFormState, form: FormData): Promise<AccountFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const parsed = registerSchema.shape.email.safeParse(form.get('email'));
  if (!parsed.success) return { error: msg(locale, 'auth.errors.required') };
  const supabase = await createStatelessClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data,
    options: { emailRedirectTo: confirmLink(locale, '/portal') },
  });
  const text = mailError(locale, error);
  if (text) {
    if ((error?.status ?? 500) >= 500) console.error('auth: confirmation email not re-sent', error?.status);
    return { sentTo: parsed.data, error: text };
  }
  return { sentTo: parsed.data, resent: true };
}
