'use server';

import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { createClient } from '@/lib/supabase/server';
import { classifyIdentifier } from './identifier';

/**
 * Forgot / reset password (docs/16 C1). Sign-up is lib/auth/signup-actions.ts (a code by email since 4 Nov 2026).
 * Supabase Auth sends the emails through ITS SMTP settings; links point at /auth/confirm on APP_URL — never at the
 * request's Host header, which a client controls.
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
