'use client';

import { PasswordField } from '@/components/shared/password-field';
import { type ReactNode, useActionState, useState } from 'react';
import { FieldIcon, FloatField } from '@/components/auth/login-panel';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { normalizeMobile } from '@/lib/auth/identifier';
import { msg } from '@/lib/nav/model';
import { requestPasswordReset, updatePassword, type AccountFormState } from '@/lib/auth/account-actions';
import { type SignupState, startSignup, verifySignupCode } from '@/lib/auth/signup-actions';

function Alert({ text, tone = 'error' }: { text?: string; tone?: 'error' | 'ok' }) {
  if (!text) return null;
  const cls =
    tone === 'ok' ? 'border-[#bfe8d6] bg-[#e9f8f1] text-[#0f5b3c]' : 'border-[#f3c7c7] bg-[#fdecec] text-[#9b1c1c]';
  return (
    <p role={tone === 'ok' ? 'status' : 'alert'} className={`rounded-[10px] border px-3 py-2 text-[14px] ${cls}`}>
      {text}
    </p>
  );
}

const Heading = ({ title, help }: { title: string; help: string }) => (
  <>
    <h2 className="text-[22px] font-extrabold tracking-[-0.01em]">{title}</h2>
    <p className="text-[14px] text-muted">{help}</p>
  </>
);

export function ForgotForm({
  locale,
  text,
}: {
  locale: Locale;
  text: { title: string; help: string; email: string; send: string; sent: string; back: string; working: string };
}) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="grid gap-[14px]">
      <input type="hidden" name="locale" value={locale} />
      <Heading title={text.title} help={text.help} />
      {state.sentTo ? (
        <Alert tone="ok" text={text.sent.replace('{email}', state.sentTo)} />
      ) : (
        <>
          <label className="form-field">
            {text.email}
            <input name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <Alert text={state.error} />
          <div>
            <button className="btn btn-primary btn-big" data-action="auth.reset.request" disabled={pending}>
              {pending ? text.working : text.send}
            </button>
          </div>
        </>
      )}
      <Link
        href="/login"
        className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-gold-text underline-offset-4 hover:underline"
      >
        {text.back}
      </Link>
    </form>
  );
}

export function ResetForm({
  locale,
  text,
}: {
  locale: Locale;
  text: { title: string; help: string; password: string; confirm: string; save: string; working: string };
}) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="grid gap-[14px]">
      <input type="hidden" name="locale" value={locale} />
      <Heading title={text.title} help={text.help} />
      <PasswordField
        locale={locale}
        label={text.password}
        name="password"
        autoComplete="new-password"
        minLength={10}
        maxLength={200}
        required
      />
      <PasswordField
        locale={locale}
        label={text.confirm}
        name="confirm"
        autoComplete="new-password"
        minLength={10}
        maxLength={200}
        required
      />
      <Alert text={state.error} />
      <div>
        <button className="btn btn-primary btn-big" data-action="auth.reset.save" disabled={pending}>
          {pending ? text.working : text.save}
        </button>
      </div>
    </form>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** the design's four-step strength meter, for the same rule the server enforces: 10 characters or it does not count */
export function passwordScore(v: string): number {
  if (v.length < 10) return 0;
  let s = 1;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

/**
 * register.start, the sign-up of 4 Nov 2026 (owner): mobile number and email, then the 6-digit code sent to the email
 * (to the mobile once SMS masking is approved), then a welcome and "finish your sign-up" (/register/details: name,
 * password, existing member or not). No company or representative name here: the application form reads them from the
 * documents. The browser's checks are for friendliness only: lib/auth/signup-actions.ts checks everything again.
 */
export function RegisterForm({ locale, tabs, onSignIn }: { locale: Locale; tabs: ReactNode; onSignIn: () => void }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(startSignup, {});
  const [values, setValues] = useState({ mobile: '', email: '' });
  const [terms, setTerms] = useState(false);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState(0);
  const [seen, setSeen] = useState(0);
  const m = (k: string) => msg(locale, `landing.au.${k}`);
  const t = (k: string) => msg(locale, `auth.signup.${k}`);

  // a code was sent (this answer, not one from before "use a different email")
  const sentTo = state.sentTo && seen === edit && !pending ? state.sentTo : null;
  if (sentTo)
    return (
      <SignupCode
        locale={locale}
        email={sentTo}
        mobile={values.mobile}
        steps={<SignupSteps locale={locale} at={1} />}
        onChange={() => setEdit((n) => n + 1)}
      />
    );

  const field = (name: keyof typeof values) => ({
    name,
    value: values[name],
    bad: bad.has(name),
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      setBad((b) => {
        const copy = new Set(b);
        copy.delete(name);
        return copy;
      });
    },
  });
  const check = (e: { preventDefault: () => void }) => {
    const empty = (['mobile', 'email'] as const).filter((n) => !values[n].trim());
    const message = empty.length
      ? m('err_fields')
      : !normalizeMobile(values.mobile)
        ? m('err_mobile')
        : !EMAIL.test(values.email.trim())
          ? m('err_email')
          : !terms
            ? m('err_terms')
            : '';
    if (message) {
      e.preventDefault();
      setBad(new Set(empty.length ? empty : message === m('err_mobile') ? ['mobile'] : message === m('err_email') ? ['email'] : []));
      setErr(message);
      return;
    }
    setErr('');
    setSeen(edit);
  };

  return (
    <>
      {tabs}
      <h1>{m('up_title')}</h1>
      <p className="au-sub">{t('sub')}</p>
      <SignupSteps locale={locale} at={0} />
      <form action={action} onSubmit={check} noValidate>
        <input type="hidden" name="locale" value={locale} />
        <FloatField
          label={m('up_mobile')}
          icon={FieldIcon.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          {...field('mobile')}
        />
        <FloatField
          label={t('email')}
          icon={FieldIcon.mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          {...field('email')}
        />
        <p className="au-hint">{t('emailWhy')}</p>
        <label className="check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span className="check-box" aria-hidden />
          <span>{m('up_terms')}</span>
        </label>
        <p className="au-err" role="alert">
          {err || state.error}
        </p>
        <div className="au-actions">
          <button className="au-btn" type="submit" data-action="register.start" disabled={pending}>
            <span>{pending ? msg(locale, 'auth.working') : t('send')}</span>
            <svg className="au-arrow" viewBox="0 0 24 24" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </form>
      <p className="au-alt">
        <span>{m('up_have')}</span>{' '}
        <button type="button" data-action="tab" onClick={onSignIn}>
          {m('up_have_link')}
        </button>
      </p>
    </>
  );
}

/** the three steps of sign-up, with the current one marked */
function SignupSteps({ locale, at }: { locale: Locale; at: number }) {
  const t = (k: string) => msg(locale, `auth.signup.${k}`);
  return (
    <ol className="au-steps" aria-label={msg(locale, 'landing.au.steps')}>
      {(['step1', 'step2', 'step3'] as const).map((k, i) => (
        <li key={k} className={i === at ? 'on' : i < at ? 'done' : ''} aria-current={i === at ? 'step' : undefined}>
          <b>{i + 1}</b>
          <span>{t(k)}</span>
        </li>
      ))}
    </ol>
  );
}

/** register.code: the 6 digits from the email; a right code opens "finish your sign-up" (the server redirects) */
function SignupCode({
  locale,
  email,
  mobile,
  steps,
  onChange,
}: {
  locale: Locale;
  email: string;
  mobile: string;
  steps: ReactNode;
  onChange: () => void;
}) {
  const [state, action, pending] = useActionState<SignupState, FormData>(verifySignupCode, {});
  const [again, againAction, sending] = useActionState<SignupState, FormData>(startSignup, {});
  const t = (k: string) => msg(locale, `auth.signup.${k}`);

  return (
    <>
      <h1>{t('codeTitle')}</h1>
      <p className="au-sub">{t('codeSent').replace('{email}', email)}</p>
      {steps}
      <form action={action}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="email" value={email} />
        <FloatField
          label={t('code')}
          icon={FieldIcon.shield}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
        />
        <p className="au-err" role="alert">
          {state.error}
        </p>
        <div className="au-actions">
          <button className="au-btn au-btn-full" data-action="register.code" disabled={pending}>
            {pending ? msg(locale, 'auth.working') : t('verify')}
          </button>
        </div>
      </form>
      <form action={againAction} className="au-alt">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="mobile" value={mobile} />
        <input type="hidden" name="resend" value="1" />
        <Alert tone="ok" text={again.resent ? t('resent') : undefined} />
        <Alert text={again.error} />
        <button className="au-link" data-action="register.resend" disabled={sending}>
          {sending ? msg(locale, 'auth.working') : t('resend')}
        </button>{' '}
        ·{' '}
        <button type="button" className="au-link" data-action="register.change" onClick={onChange}>
          {t('change')}
        </button>
      </form>
    </>
  );
}
