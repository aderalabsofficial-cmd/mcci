'use client';

import { PasswordField } from '@/components/shared/password-field';
import { type ReactNode, useActionState, useState } from 'react';
import { FieldIcon, FloatField } from '@/components/auth/login-panel';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { normalizeMobile } from '@/lib/auth/identifier';
import { msg } from '@/lib/nav/model';
import {
  registerAccount,
  requestPasswordReset,
  resendConfirmation,
  updatePassword,
  type AccountFormState,
} from '@/lib/auth/account-actions';

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
function passwordScore(v: string): number {
  if (v.length < 10) return 0;
  let s = 1;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

/**
 * register.start, the design's sign-up in two steps (it had three; the class step is removed: the class follows from the
 * application form). "Creates account with email verification, then opens the guided form" (docs/catalogue/actions).
 * The browser's checks are for friendliness only: registerAccount checks everything again.
 */
export function RegisterForm({ locale, tabs, onSignIn }: { locale: Locale; tabs: ReactNode; onSignIn: () => void }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(registerAccount, {});
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ businessName: '', fullName: '', mobile: '', email: '', password: '', confirm: '' });
  const [terms, setTerms] = useState(false);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const [err, setErr] = useState('');
  const t = (k: string) => msg(locale, `auth.registerPage.${k}`);
  const m = (k: string) => msg(locale, `landing.au.${k}`);

  if (state.sentTo) return <RegisterSent locale={locale} email={state.sentTo} />;

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
  const problems = (names: (keyof typeof values)[]) => names.filter((n) => !values[n].trim());
  const toAccount = () => {
    const empty = problems(['businessName', 'fullName', 'mobile', 'email']);
    if (empty.length) {
      setBad(new Set(empty));
      setErr(m('err_fields'));
      return;
    }
    if (!normalizeMobile(values.mobile)) {
      setBad(new Set(['mobile']));
      setErr(m('err_mobile'));
      return;
    }
    if (!EMAIL.test(values.email.trim())) {
      setBad(new Set(['email']));
      setErr(m('err_email'));
      return;
    }
    setBad(new Set());
    setErr('');
    setStep(1);
  };
  const check = (e: { preventDefault: () => void }) => {
    if (step === 0) {
      e.preventDefault();
      toAccount();
      return;
    }
    const empty = problems(['password', 'confirm']);
    const message = empty.length
      ? m('err_fields')
      : passwordScore(values.password) === 0
        ? t('weak')
        : values.password !== values.confirm
          ? m('err_match')
          : !terms
            ? m('err_terms')
            : '';
    if (message) {
      e.preventDefault();
      setBad(new Set(empty.length ? empty : message === m('err_match') ? ['confirm'] : message === t('weak') ? ['password'] : []));
      setErr(message);
    } else setErr('');
  };
  const score = passwordScore(values.password);

  return (
    <>
      {tabs}
      <h1>{m('up_title')}</h1>
      <p className="au-sub">{m('up_sub')}</p>
      <ol className="au-steps" aria-label={m('steps')}>
        {(['st1', 'st2'] as const).map((k, i) => (
          <li key={k} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            <b>{i + 1}</b>
            <span>{m(k)}</span>
          </li>
        ))}
      </ol>
      <form action={action} onSubmit={check} noValidate>
        <input type="hidden" name="locale" value={locale} />
        <fieldset className={`au-step ${step === 0 ? 'on' : ''}`}>
          <FloatField label={m('up_business')} icon={FieldIcon.building} autoComplete="organization" maxLength={200} {...field('businessName')} />
          <FloatField label={t('name')} icon={FieldIcon.person} autoComplete="name" maxLength={120} {...field('fullName')} />
          <div className="fl-row">
            <FloatField label={m('up_mobile')} icon={FieldIcon.phone} type="tel" inputMode="tel" autoComplete="tel" maxLength={30} {...field('mobile')} />
            <FloatField label={t('email')} icon={FieldIcon.mail} type="email" inputMode="email" autoComplete="email" maxLength={254} {...field('email')} />
          </div>
        </fieldset>
        <fieldset className={`au-step ${step === 1 ? 'on' : ''}`}>
          <PasswordField
            locale={locale}
            className={`fl fl-pw ${bad.has('password') ? 'bad' : ''}`}
            label={t('password')}
            icon={FieldIcon.lock}
            name="password"
            placeholder=" "
            autoComplete="new-password"
            minLength={10}
            maxLength={200}
            value={values.password}
            onChange={field('password').onChange}
          />
          <div className="pw-meter" data-score={score}>
            <i />
            <i />
            <i />
            <i />
            <span>{m(`pw_${score}`)}</span>
          </div>
          <PasswordField
            locale={locale}
            className={`fl fl-pw ${bad.has('confirm') ? 'bad' : ''}`}
            label={t('confirm')}
            icon={FieldIcon.shield}
            name="confirm"
            placeholder=" "
            autoComplete="new-password"
            minLength={10}
            maxLength={200}
            value={values.confirm}
            onChange={field('confirm').onChange}
          />
          <label className="check">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span className="check-box" aria-hidden />
            <span>{m('up_terms')}</span>
          </label>
        </fieldset>
        <p className="au-err" role="alert">
          {err || state.error}
        </p>
        <div className="au-actions">
          {step === 1 && (
            <button className="au-btn au-btn-ghost" type="button" data-action="register.back" onClick={() => setStep(0)}>
              {m('up_prev')}
            </button>
          )}
          {step === 0 ? (
            <button className="au-btn" type="button" data-action="register.next" onClick={toAccount}>
              <span>{m('up_next')}</span>
              <svg className="au-arrow" viewBox="0 0 24 24" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          ) : (
            <button className="au-btn" type="submit" data-action="register.start" disabled={pending}>
              {pending ? msg(locale, 'auth.working') : t('create')}
            </button>
          )}
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

/** After registering: the design's tick, the "check your email" notice and a button to send the confirmation link again. */
function RegisterSent({ locale, email }: { locale: Locale; email: string }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(resendConfirmation, {});
  const t = (k: string) => msg(locale, `auth.registerPage.${k}`);
  return (
    <div className="au-done">
      <div className="burst" aria-hidden>
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <svg className="tick" viewBox="0 0 80 80" aria-hidden>
        <circle cx="40" cy="40" r="36" />
        <path d="M24 41l11 11 22-24" />
      </svg>
      <h1>{msg(locale, 'landing.au.done_up_t')}</h1>
      <form action={action}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="email" value={email} />
        <Alert tone="ok" text={(state.resent ? t('resent') : t('sent')).replace('{email}', email)} />
        <Alert text={state.error} />
        <button className="au-btn au-btn-ghost" data-action="register.resend" disabled={pending}>
          {pending ? msg(locale, 'auth.working') : t('resend')}
        </button>
      </form>
      <Link href="/login" className="au-link" data-action="nav">
        {t('haveAccount')}
      </Link>
    </div>
  );
}
