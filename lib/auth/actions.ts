'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { accessSchema } from '@/lib/permissions/levels';
import { msg } from '@/lib/nav/model';
import { trustedClientIp } from '@/lib/net/client-ip';
import { createClient } from '@/lib/supabase/server';
import { resolveLoginEmail } from './admin/resolve-login';
import { classifyIdentifier, safeNext } from './identifier';

/**
 * Sign-in, email code, 2-step login and sign-out (actions login.member, login.otp, login.staff — docs/catalogue).
 * Supabase Auth checks the password, sends and verifies codes and owns the session; these actions validate input,
 * map Auth's answers to one bilingual message each and decide where the person goes next. Nothing here reveals
 * whether an account exists.
 */
export interface AuthFormState {
  error?: string;
  step?: 'code';
  email?: string;
}

type AuthError = { code?: string; status?: number; message: string } | null;

function errorText(locale: Locale, error: AuthError): string {
  if (!error) return msg(locale, 'auth.errors.unavailable');
  if (error.code === 'email_not_confirmed') return msg(locale, 'auth.errors.unconfirmed');
  if (error.status === 429 || /rate_limit/.test(error.code ?? '')) return msg(locale, 'auth.errors.rateLimited');
  if (error.code === 'invalid_credentials' || error.status === 400) return msg(locale, 'auth.errors.invalid');
  return msg(locale, 'auth.errors.unavailable');
}

const signInSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

async function myAccess(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.schema('api').rpc('my_access');
  if (error) throw new Error(`api.my_access failed: ${error.message}`);
  return accessSchema.parse(data);
}

/** Member login tab: email, member ID or mobile + password. */
export async function signInMember(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const parsed = signInSchema.safeParse({ identifier: form.get('identifier'), password: form.get('password') });
  if (!parsed.success) return { error: msg(locale, 'auth.errors.required') };

  const email = await resolveLoginEmail(classifyIdentifier(parsed.data.identifier), trustedClientIp(await headers()));
  if (!email) return { error: msg(locale, 'auth.errors.invalid') };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) return { error: errorText(locale, error) };

  const access = await myAccess(supabase);
  const next = safeNext(
    form.get('next')?.toString(),
    access.staff && !access.companies.length ? '/login/verify' : '/portal',
  );
  redirect({ href: next, locale });
  return {};
}

/** Staff tab: staff email + password, then the 2-step page. Member accounts are signed out again. */
export async function signInStaff(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const parsed = signInSchema.safeParse({ identifier: form.get('email'), password: form.get('password') });
  const id = parsed.success ? classifyIdentifier(parsed.data.identifier) : null;
  if (!parsed.success || id?.kind !== 'email') return { error: msg(locale, 'auth.errors.required') };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: id.value, password: parsed.data.password });
  if (error) return { error: errorText(locale, error) };

  const access = await myAccess(supabase);
  if (!access.staff) {
    await supabase.auth.signOut({ scope: 'local' });
    return { error: msg(locale, 'auth.errors.notStaff') };
  }
  redirect({ href: '/login/verify', locale });
  return {};
}

/** "Sign in with email code": emails a one-time code (existing accounts only; no account is created here). */
export async function requestEmailCode(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const id = classifyIdentifier(String(form.get('identifier') ?? ''));
  if (id.kind !== 'email') return { error: msg(locale, 'auth.errors.emailForCode') };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: id.value, options: { shouldCreateUser: false } });
  // 4xx other than rate limits (e.g. no such account) look exactly like success, so the form reveals nothing.
  // A 5xx means Auth could not send the email: say so instead of pretending a code is on its way.
  if (error && (error.status === 429 || (error.status ?? 500) >= 500)) {
    if ((error.status ?? 500) >= 500) console.error('auth: email code not sent', error.status, error.code);
    return { error: errorText(locale, error.status === 429 ? error : null) };
  }
  return { step: 'code', email: id.value };
}

const codeSchema = z.object({ email: z.string().email().max(254), code: z.string().regex(/^\d{6}$/) });

export async function verifyEmailCode(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const parsed = codeSchema.safeParse({ email: form.get('email'), code: String(form.get('code') ?? '').trim() });
  if (!parsed.success) {
    return { step: 'code', email: String(form.get('email') ?? ''), error: msg(locale, 'auth.errors.codeInvalid') };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: 'email' });
  if (error) {
    const text = error.status === 429 ? errorText(locale, error) : msg(locale, 'auth.errors.codeInvalid');
    return { step: 'code', email: parsed.data.email, error: text };
  }
  const access = await myAccess(supabase);
  redirect({
    href: safeNext(
      form.get('next')?.toString(),
      access.staff && !access.companies.length ? '/login/verify' : '/portal',
    ),
    locale,
  });
  return {};
}

export interface MfaFormState {
  error?: string;
}

/** 2-step login: verifies a TOTP code for the given factor; on success the session becomes AAL2 → admin panel. */
export async function verifyTotp(_: MfaFormState, form: FormData): Promise<MfaFormState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const factorId = z.string().uuid().safeParse(form.get('factorId'));
  const code = String(form.get('code') ?? '').replace(/\s/g, '');
  if (!factorId.success || !/^\d{6}$/.test(code)) return { error: msg(locale, 'auth.mfa.invalid') };

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factorId.data, code });
  if (error) return { error: error.status === 429 ? errorText(locale, error) : msg(locale, 'auth.mfa.invalid') };
  redirect({ href: '/admin', locale });
  return {};
}

/** Signs out of this browser and returns to the login page. */
export async function signOut(form: FormData): Promise<void> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect({ href: '/login', locale });
}
