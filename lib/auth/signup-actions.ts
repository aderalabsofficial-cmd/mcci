'use server';

import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { createClient, createStatelessClient } from '@/lib/supabase/server';
import { normalizeMobile } from './identifier';
import { signupUnfinished } from './signup';

/**
 * Sign-up (owner, 4 Nov 2026; migration 0680), actions register.start, register.code, register.finish:
 *   1. mobile number and email → a 6-digit code by email (Auth's confirmation / magic-link templates carry the code,
 *      supabase/templates). When MCCI's SMS masking is approved the code goes to the mobile, and email becomes optional.
 *   2. the code → signed in, and on to "finish your sign-up", which opens with the welcome.
 *   3. name, password and "Are you an existing member of MCCI?": no → the dashboard; yes → class, the membership number
 *      in digits (or the company name) → a claim staff approve (api.claim_submit), and "ready within 6 to 12 hours".
 * The answers never say whether an email already has an account; the code proves the person owns the address.
 */
export interface SignupState {
  error?: string;
  sentTo?: string;
  resent?: boolean;
}

const email = z.string().trim().toLowerCase().email().max(254);
const code = z.string().regex(/^\d{6}$/);

function mailError(locale: Locale, error: { status?: number } | null): string | null {
  if (!error) return null;
  if (error.status === 429) return msg(locale, 'auth.errors.rateLimited');
  if ((error.status ?? 500) >= 500) return msg(locale, 'auth.errors.unavailable');
  return null;
}

/** register.start / register.resend: the code to the email; the mobile goes with the account until step 3 */
export async function startSignup(_: SignupState, form: FormData): Promise<SignupState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const mobile = normalizeMobile(String(form.get('mobile') ?? ''));
  const address = email.safeParse(form.get('email'));
  if (!mobile) return { error: msg(locale, 'landing.au.err_mobile') };
  if (!address.success) return { error: msg(locale, 'landing.au.err_email') };
  // cookie-less: the code is checked by its digits, so no PKCE cookie is needed; a cookie written here made Next.js
  // redraw the page with the answer, which reset the form on the owner's browser (4 Nov 2026) instead of showing step 2
  const supabase = await createStatelessClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: address.data,
    options: { shouldCreateUser: true, data: { mobile, lang: locale, signup_started: true } },
  });
  const text = mailError(locale, error);
  if (text) {
    if ((error?.status ?? 500) >= 500) console.error('auth: sign-up code not sent', error?.status);
    return { sentTo: form.get('resend') ? address.data : undefined, error: text };
  }
  return { sentTo: address.data, resent: Boolean(form.get('resend')) };
}

/** register.code: the 6 digits from the email sign the person in; someone who finished before goes to the portal */
export async function verifySignupCode(_: SignupState, form: FormData): Promise<SignupState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const address = email.safeParse(form.get('email'));
  const digits = code.safeParse(String(form.get('code') ?? '').replace(/\s/g, ''));
  if (!address.success) return { error: msg(locale, 'auth.errors.required') };
  if (!digits.success) return { sentTo: address.data, error: msg(locale, 'auth.signup.codeFormat') };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email: address.data, token: digits.data, type: 'email' });
  if (error || !data.user) {
    const text =
      error?.status === 429 ? msg(locale, 'auth.errors.rateLimited') : msg(locale, 'auth.signup.codeWrong');
    return { sentTo: address.data, error: text };
  }
  // the next page is opened from here: the welcome plays there (/register/details?welcome=1), so nothing depends on this
  // page surviving the redraw that the new session's cookies cause
  redirect({ href: signupUnfinished(data.user.user_metadata) ? '/register/details?welcome=1' : '/portal', locale });
  return {};
}

const finishSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    password: z.string().min(10).max(200),
    confirm: z.string(),
    member: z.enum(['yes', 'no']),
    memberClass: z.enum(['Corporate', 'Associate']).optional(),
    digits: z.string().trim().regex(/^\d{0,8}$/),
    company: z.string().trim().max(200),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'] })
  .refine((v) => v.member === 'no' || (v.memberClass && (v.digits || v.company)), { path: ['digits'] });

const HINTS = ['mobile_taken', 'mobile', 'name', 'linked', 'pending', 'digits', 'required', 'staff'];

/** register.finish: name and password; an existing member's claim; then where they go */
export async function finishSignup(_: SignupState, form: FormData): Promise<SignupState> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const t = (k: string) => msg(locale, `auth.signup.${k}`);
  const parsed = finishSchema.safeParse({
    fullName: form.get('fullName'),
    password: String(form.get('password') ?? ''),
    confirm: String(form.get('confirm') ?? ''),
    member: form.get('member'),
    memberClass: form.get('memberClass') || undefined,
    digits: String(form.get('digits') ?? '').replace(/\s/g, ''),
    company: form.get('company') ?? '',
  });
  if (!parsed.success) {
    const at = parsed.error.issues[0]?.path[0];
    return {
      error:
        at === 'password'
          ? msg(locale, 'auth.registerPage.weak')
          : at === 'confirm'
            ? msg(locale, 'landing.au.err_match')
            : at === 'digits'
              ? t('needNumber')
              : msg(locale, 'auth.errors.required'),
    };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { data: who } = await supabase.auth.getUser();
  if (!who.user) return { error: msg(locale, 'auth.resetPage.noSession') };
  const mobile = typeof who.user.user_metadata?.mobile === 'string' ? who.user.user_metadata.mobile : null;

  const db = supabase.schema('api');
  const saved = await db.rpc('signup_finish', { p_full_name: v.fullName, p_mobile: mobile ?? '' });
  if (saved.error) return { error: hintText(locale, saved.error) };
  if (v.member === 'yes') {
    const claim = await db.rpc('claim_submit', {
      p_class: v.memberClass!,
      p_digits: v.digits,
      p_company: v.company,
    });
    if (claim.error) return { error: hintText(locale, claim.error) };
  }
  const { error } = await supabase.auth.updateUser({
    password: v.password,
    data: { full_name: v.fullName, signup_done: true },
  });
  // a retry after a refused claim sends the same password again: that is fine
  if (error && error.code !== 'same_password') {
    if (error.code === 'weak_password') return { error: msg(locale, 'auth.registerPage.weak') };
    return { error: mailError(locale, error) ?? msg(locale, 'auth.errors.unavailable') };
  }
  // a new account sees "Preparing your account" first (owner's design, 6 Nov 2026), then its first screen
  const first = v.member === 'yes' ? '/register/pending' : '/portal';
  redirect({ href: `/welcome?next=${encodeURIComponent(first)}`, locale });
  return {};
}

function hintText(locale: Locale, error: { code?: string; hint?: string; message?: string }): string {
  if (error.code === 'P0001' && error.hint && HINTS.includes(error.hint)) return msg(locale, `auth.signup.errors.${error.hint}`);
  console.error('register.finish failed', error.code, error.message);
  return msg(locale, 'auth.errors.unavailable');
}
