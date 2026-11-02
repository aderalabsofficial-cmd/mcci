'use client';

import { PasswordField } from '@/components/shared/password-field';
import { Mail } from 'lucide-react';
import { type InputHTMLAttributes, type ReactNode, useActionState, useState } from 'react';
import { guardForm } from '@/lib/client/call-action';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requestEmailCode, signInMember, signInStaff, verifyEmailCode, type AuthFormState } from '@/lib/auth/actions';
import { msg } from '@/lib/nav/model';

/** the design's field icons */
export const FieldIcon = {
  person: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  ),
};

/** The design's floating-label field: the label sits inside the input and rises when there is text. */
export function FloatField({
  label,
  icon,
  bad,
  ...input
}: { label: string; icon: ReactNode; bad?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`fl ${bad ? 'bad' : ''}`}>
      <input placeholder=" " aria-invalid={bad || undefined} {...input} />
      <span>{label}</span>
      {icon}
    </label>
  );
}

export function Alert({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p
      role="alert"
      className="mt-3 rounded-[10px] border border-[#f3c7c7] bg-[#fdecec] px-3 py-2 text-[14px] text-[#9b1c1c]"
    >
      {text}
    </p>
  );
}

/**
 * The design's sign-in form, on the same server actions as before: password, or a 6-digit code by email. Staff sign in
 * on their own page (StaffLoginForm below, owner's request of 29 Oct 2026). Each form posts to a server action; nothing
 * is decided in the browser. New applicants go to the Sign Up side of the page.
 */
export function LoginPanel({
  locale,
  tabs,
  next,
  notice,
  onSignUp,
}: {
  locale: Locale;
  tabs: ReactNode;
  next?: string;
  notice?: string;
  onSignUp: () => void;
}) {
  const [member, memberAction, memberPending] = useActionState<AuthFormState, FormData>(
    guardForm(locale, signInMember),
    {},
  );
  const [codeReq, codeReqAction, codeReqPending] = useActionState<AuthFormState, FormData>(
    guardForm(locale, requestEmailCode),
    {},
  );
  const [codeVerify, codeVerifyAction, codeVerifyPending] = useActionState<AuthFormState, FormData>(
    guardForm(locale, verifyEmailCode),
    {},
  );
  const [showCode, setShowCode] = useState(true);
  const t = (k: string) => msg(locale, `auth.${k}`);
  const m = (k: string) => msg(locale, `landing.au.${k}`);

  const codeEmail = codeVerify.email ?? codeReq.email;
  const codeStep = showCode && (codeVerify.step === 'code' || codeReq.step === 'code') && codeEmail;
  const hidden = (
    <>
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}
    </>
  );

  return (
    <div>
      {notice && (
        <p
          role="alert"
          className="mb-4 rounded-[10px] border border-[#f3d9a8] bg-[#fdf5e3] px-3 py-2 text-[14px] text-[#6b4a0e]"
        >
          {notice}
        </p>
      )}
      {tabs}
      <div role="tabpanel" aria-label={t('tabs.member')}>
        <h1>{m('in_title')}</h1>
        <p className="au-sub">{m('in_sub')}</p>
        {codeStep ? (
          <form action={codeVerifyAction}>
            {hidden}
            <input type="hidden" name="email" value={codeEmail} />
            <h2>{t('code.title')}</h2>
            <p className="au-sub">{t('code.sent').replace('{email}', codeEmail)}</p>
            <FloatField
              label={t('code.label')}
              icon={FieldIcon.shield}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
            />
            <Alert text={codeVerify.error} />
            <div className="au-actions">
              <button className="au-btn au-btn-full" data-action="login.otp" disabled={codeVerifyPending}>
                {codeVerifyPending ? t('working') : t('code.verify')}
              </button>
              <button type="button" className="au-btn au-btn-ghost au-btn-full" data-action="login.otp.back" onClick={() => setShowCode(false)}>
                {t('code.other')}
              </button>
            </div>
          </form>
        ) : (
          <form action={memberAction}>
            {hidden}
            <FloatField
              label={t('identifier')}
              icon={FieldIcon.person}
              name="identifier"
              autoComplete="username"
              required
              maxLength={254}
            />
            <PasswordField
              locale={locale}
              className="fl fl-pw"
              label={t('password')}
              icon={FieldIcon.lock}
              name="password"
              placeholder=" "
              autoComplete="current-password"
              maxLength={200}
            />
            <div className="au-row">
              <Link href="/login/forgot" className="au-link" data-action="nav">
                {t('forgot')}
              </Link>
            </div>
            <Alert text={member.error ?? codeReq.error} />
            <div className="au-actions">
              <button className="au-btn au-btn-full" data-action="login.member" disabled={memberPending}>
                {memberPending ? t('working') : t('signIn')}
              </button>
              <button
                className="au-btn au-btn-ghost au-btn-full"
                formAction={(fd) => {
                  setShowCode(true);
                  codeReqAction(fd);
                }}
                formNoValidate
                data-action="login.otp"
                disabled={codeReqPending}
              >
                <Mail className="size-4" aria-hidden />
                {codeReqPending ? t('working') : t('emailCode')}
              </button>
            </div>
          </form>
        )}
      </div>
      <p className="au-alt">
        <span>{m('in_new')}</span>{' '}
        <button type="button" data-action="tab" onClick={onSignUp}>
          {m('in_new_link')}
        </button>
      </p>
    </div>
  );
}

/** The staff sign-in page's form (app/[locale]/staff/login): staff email + password, then the 2-step page. */
export function StaffLoginForm({
  locale,
  text,
  notice,
}: {
  locale: Locale;
  text: { staffEmail: string; password: string; openAdmin: string; working: string; forgot: string };
  notice?: string;
}) {
  const [staff, staffAction, staffPending] = useActionState<AuthFormState, FormData>(
    guardForm(locale, signInStaff),
    {},
  );
  return (
    <form action={staffAction} className="grid gap-[14px]" data-staff-login>
      <input type="hidden" name="locale" value={locale} />
      {notice && (
        <p
          role="alert"
          className="rounded-[10px] border border-[#f3d9a8] bg-[#fdf5e3] px-3 py-2 text-[14px] text-[#6b4a0e]"
        >
          {notice}
        </p>
      )}
      <label className="form-field">
        {text.staffEmail}
        <input name="email" type="email" autoComplete="username" required maxLength={254} />
      </label>
      <PasswordField
        locale={locale}
        label={text.password}
        name="password"
        autoComplete="current-password"
        required
        maxLength={200}
      />
      <Alert text={staff.error} />
      <div className="mt-1">
        <button className="btn btn-primary btn-big" data-action="login.staff" disabled={staffPending}>
          {staffPending ? text.working : text.openAdmin}
        </button>
      </div>
      <Link
        href="/login/forgot"
        className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-gold-text underline-offset-4 hover:underline"
      >
        {text.forgot}
      </Link>
    </form>
  );
}
