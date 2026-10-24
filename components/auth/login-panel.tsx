'use client';

import { Mail } from 'lucide-react';
import { useActionState, useId, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requestEmailCode, signInMember, signInStaff, verifyEmailCode, type AuthFormState } from '@/lib/auth/actions';

export interface LoginText {
  tabs: { member: string; applicant: string; staff: string };
  identifier: string;
  password: string;
  signIn: string;
  emailCode: string;
  forgot: string;
  applicantIntro: string;
  startApplication: string;
  staffEmail: string;
  openAdmin: string;
  working: string;
  code: { title: string; sent: string; label: string; verify: string; other: string };
}

type Tab = 'member' | 'applicant' | 'staff';

function Alert({ text }: { text?: string }) {
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
 * The three tabs of the prototype's login card (site/login): Member login, New applicant, Staff. Each form posts to a
 * server action; nothing is decided in the browser.
 */
export function LoginPanel({
  locale,
  text,
  next,
  notice,
}: {
  locale: Locale;
  text: LoginText;
  next?: string;
  notice?: string;
}) {
  const [tab, setTab] = useState<Tab>('member');
  const [member, memberAction, memberPending] = useActionState<AuthFormState, FormData>(signInMember, {});
  const [codeReq, codeReqAction, codeReqPending] = useActionState<AuthFormState, FormData>(requestEmailCode, {});
  const [codeVerify, codeVerifyAction, codeVerifyPending] = useActionState<AuthFormState, FormData>(
    verifyEmailCode,
    {},
  );
  const [staff, staffAction, staffPending] = useActionState<AuthFormState, FormData>(signInStaff, {});
  const [showCode, setShowCode] = useState(true);
  const ids = { tabs: useId(), panel: useId() };

  const codeEmail = codeVerify.email ?? codeReq.email;
  const codeStep = showCode && (codeVerify.step === 'code' || codeReq.step === 'code') && codeEmail;
  const hidden = (
    <>
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}
    </>
  );
  const tabs: [Tab, string][] = [
    ['member', text.tabs.member],
    ['applicant', text.tabs.applicant],
    ['staff', text.tabs.staff],
  ];

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
      <div className="pill-tabs" role="tablist" id={ids.tabs}>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`${ids.panel}-${id}`}
            id={`${ids.tabs}-${id}`}
            data-action="tab"
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${ids.panel}-member`} aria-labelledby={`${ids.tabs}-member`} hidden={tab !== 'member'}>
        {codeStep ? (
          <form action={codeVerifyAction} className="grid gap-[14px]">
            {hidden}
            <input type="hidden" name="email" value={codeEmail} />
            <h2 className="text-[18px] font-extrabold">{text.code.title}</h2>
            <p className="text-[14px] text-muted">{text.code.sent.replace('{email}', codeEmail)}</p>
            <label className="form-field">
              {text.code.label}
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
              />
            </label>
            <Alert text={codeVerify.error} />
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary btn-big" data-action="login.otp" disabled={codeVerifyPending}>
                {codeVerifyPending ? text.working : text.code.verify}
              </button>
              <button type="button" className="btn btn-big" onClick={() => setShowCode(false)}>
                {text.code.other}
              </button>
            </div>
          </form>
        ) : (
          <form action={memberAction} className="grid gap-[14px]">
            {hidden}
            <label className="form-field">
              {text.identifier}
              <input name="identifier" autoComplete="username" required maxLength={254} />
            </label>
            <label className="form-field">
              {text.password}
              <input name="password" type="password" autoComplete="current-password" maxLength={200} />
            </label>
            <Alert text={member.error ?? codeReq.error} />
            <div className="mt-1 flex flex-wrap gap-2">
              <button className="btn btn-primary btn-big" data-action="login.member" disabled={memberPending}>
                {memberPending ? text.working : text.signIn}
              </button>
              <button
                className="btn btn-big"
                formAction={(fd) => {
                  setShowCode(true);
                  codeReqAction(fd);
                }}
                formNoValidate
                data-action="login.otp"
                disabled={codeReqPending}
              >
                <Mail className="size-4" aria-hidden />
                {codeReqPending ? text.working : text.emailCode}
              </button>
            </div>
            <Link
              href="/login/forgot"
              className="text-[14px] font-semibold text-gold-text underline-offset-4 hover:underline"
            >
              {text.forgot}
            </Link>
          </form>
        )}
      </div>

      <div
        role="tabpanel"
        id={`${ids.panel}-applicant`}
        aria-labelledby={`${ids.tabs}-applicant`}
        hidden={tab !== 'applicant'}
      >
        <p>{text.applicantIntro}</p>
        <br />
        <Link href="/register" className="btn btn-gold btn-big" data-action="register.start">
          {text.startApplication}
        </Link>
      </div>

      <div role="tabpanel" id={`${ids.panel}-staff`} aria-labelledby={`${ids.tabs}-staff`} hidden={tab !== 'staff'}>
        <form action={staffAction} className="grid gap-[14px]">
          {hidden}
          <label className="form-field">
            {text.staffEmail}
            <input name="email" type="email" autoComplete="username" required maxLength={254} />
          </label>
          <label className="form-field">
            {text.password}
            <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
          </label>
          <Alert text={staff.error} />
          <div className="mt-1">
            <button className="btn btn-primary btn-big" data-action="login.staff" disabled={staffPending}>
              {staffPending ? text.working : text.openAdmin}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
