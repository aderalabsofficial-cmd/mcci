'use client';

import { useActionState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
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
      <label className="form-field">
        {text.password}
        <input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={200} required />
      </label>
      <label className="form-field">
        {text.confirm}
        <input name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={200} required />
      </label>
      <Alert text={state.error} />
      <div>
        <button className="btn btn-primary btn-big" data-action="auth.reset.save" disabled={pending}>
          {pending ? text.working : text.save}
        </button>
      </div>
    </form>
  );
}

export function RegisterForm({
  locale,
  text,
}: {
  locale: Locale;
  text: {
    title: string;
    help: string;
    name: string;
    email: string;
    password: string;
    confirm: string;
    create: string;
    sent: string;
    resend: string;
    resent: string;
    haveAccount: string;
    working: string;
  };
}) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(registerAccount, {});
  if (state.sentTo) return <RegisterSent locale={locale} email={state.sentTo} text={text} />;
  return (
    <form action={action} className="grid gap-[14px]">
      <input type="hidden" name="locale" value={locale} />
      <Heading title={text.title} help={text.help} />
      <>
        <label className="form-field">
          {text.name}
          <input name="fullName" autoComplete="name" required minLength={2} maxLength={120} />
        </label>
        <label className="form-field">
          {text.email}
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label className="form-field">
          {text.password}
          <input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={200} required />
        </label>
        <label className="form-field">
          {text.confirm}
          <input name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={200} required />
        </label>
        <Alert text={state.error} />
        <div>
          <button className="btn btn-gold btn-big" data-action="register.start" disabled={pending}>
            {pending ? text.working : text.create}
          </button>
        </div>
      </>
      <Link
        href="/login"
        className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-gold-text underline-offset-4 hover:underline"
      >
        {text.haveAccount}
      </Link>
    </form>
  );
}

/** After registering: the "check your email" notice and a button to send the confirmation link again. */
function RegisterSent({
  locale,
  email,
  text,
}: {
  locale: Locale;
  email: string;
  text: {
    title: string;
    help: string;
    sent: string;
    resend: string;
    resent: string;
    haveAccount: string;
    working: string;
  };
}) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(resendConfirmation, {});
  return (
    <form action={action} className="grid gap-[14px]">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="email" value={email} />
      <Heading title={text.title} help={text.help} />
      <Alert tone="ok" text={(state.resent ? text.resent : text.sent).replace('{email}', email)} />
      <Alert text={state.error} />
      <div>
        <button className="btn btn-outline btn-big" data-action="register.resend" disabled={pending}>
          {pending ? text.working : text.resend}
        </button>
      </div>
      <Link
        href="/login"
        className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-gold-text underline-offset-4 hover:underline"
      >
        {text.haveAccount}
      </Link>
    </form>
  );
}
