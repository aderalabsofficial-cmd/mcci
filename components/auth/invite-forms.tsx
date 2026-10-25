'use client';

import { useActionState } from 'react';
import { guardForm } from '@/lib/client/call-action';
import { acceptAsSignedIn, activateInvitedAccount, type InviteFormState } from '@/lib/invitations/actions';
import type { Locale } from '@/i18n/routing';

function Alert({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p
      role="alert"
      className="rounded-[10px] border border-[#f3c7c7] bg-[#fdecec] px-3 py-2 text-[14px] text-[#9b1c1c]"
    >
      {text}
    </p>
  );
}

/** No account yet: create a password; the account is created for the invited email and the invitation accepted. */
export function ActivateForm({
  locale,
  token,
  email,
  text,
}: {
  locale: Locale;
  token: string;
  email: string;
  text: { password: string; confirm: string; rule: string; activate: string; working: string };
}) {
  const [state, action, pending] = useActionState<InviteFormState, FormData>(guardForm(locale, activateInvitedAccount), {});
  return (
    <form action={action} className="grid gap-[14px]">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      {/* lets password managers save the new credential under the right address */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <label className="form-field">
        {text.password}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={200}
          required
          aria-describedby="pw-rule"
        />
      </label>
      <p id="pw-rule" className="-mt-2 text-[13px] text-muted">
        {text.rule}
      </p>
      <label className="form-field">
        {text.confirm}
        <input name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={200} required />
      </label>
      <Alert text={state.error} />
      <div>
        <button className="btn btn-primary btn-big" data-action="invite.activate" disabled={pending}>
          {pending ? text.working : text.activate}
        </button>
      </div>
    </form>
  );
}

/** Signed in with the invited address: one button. */
export function AcceptForm({
  locale,
  token,
  text,
}: {
  locale: Locale;
  token: string;
  text: { accept: string; working: string };
}) {
  const [state, action, pending] = useActionState<InviteFormState, FormData>(guardForm(locale, acceptAsSignedIn), {});
  return (
    <form action={action} className="grid gap-[14px]">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <Alert text={state.error} />
      <div>
        <button className="btn btn-primary btn-big" data-action="invite.accept" disabled={pending}>
          {pending ? text.working : text.accept}
        </button>
      </div>
    </form>
  );
}
