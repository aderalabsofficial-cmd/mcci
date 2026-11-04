'use client';

import { useActionState, useEffect, useState } from 'react';
import { passwordScore } from '@/components/auth/account-forms';
import { FieldIcon, FloatField } from '@/components/auth/login-panel';
import { PasswordField } from '@/components/shared/password-field';
import type { Locale } from '@/i18n/routing';
import { finishSignup, type SignupState } from '@/lib/auth/signup-actions';
import { msg } from '@/lib/nav/model';

/**
 * register.finish, step 3 of sign-up (owner, 4 Nov 2026): the person's name, a password and "Are you an existing member
 * of MCCI?". An existing member picks the class and types the membership number in digits only (the form shows the
 * MCCI-C- / MCCI-A- prefix); unsure of the number, they give the company name instead. Kept simple on purpose: big
 * choices, one question at a time, Urdu under each. lib/auth/signup-actions.ts checks everything again.
 */
export function FinishSignupForm({
  locale,
  email,
  name,
  welcome = false,
}: {
  locale: Locale;
  email: string;
  name: string;
  /** right after the emailed code: the welcome plays first, then the form */
  welcome?: boolean;
}) {
  const [state, action, pending] = useActionState<SignupState, FormData>(finishSignup, {});
  const [greeting, setGreeting] = useState(welcome);
  useEffect(() => {
    if (!greeting) return;
    const done = setTimeout(() => setGreeting(false), 2400);
    return () => clearTimeout(done);
  }, [greeting]);
  const [fullName, setFullName] = useState(name);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [member, setMember] = useState<'yes' | 'no' | ''>('');
  const [cls, setCls] = useState<'Corporate' | 'Associate' | ''>('');
  const [digits, setDigits] = useState('');
  const [company, setCompany] = useState('');
  const [err, setErr] = useState('');
  const t = (k: string) => msg(locale, `auth.signup.${k}`);
  const both = (k: string) => (
    <>
      <b>{msg(locale, `auth.signup.${k}`)}</b>
      {locale === 'en' && <small lang="ur">{msg('ur', `auth.signup.${k}`)}</small>}
    </>
  );
  const score = passwordScore(password);

  if (greeting)
    return (
      <div className="au-done au-welcome" data-testid="welcome" role="status">
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
        <h1>{t('welcome')}</h1>
        <p className="au-sub">{t('welcomeNext')}</p>
      </div>
    );

  const check = (e: { preventDefault: () => void }) => {
    const message =
      fullName.trim().length < 2
        ? msg(locale, 'landing.au.err_fields')
        : score === 0
          ? msg(locale, 'auth.registerPage.weak')
          : password !== confirm
            ? msg(locale, 'landing.au.err_match')
            : !member
              ? t('needAnswer')
              : member === 'yes' && !cls
                ? t('needClass')
                : member === 'yes' && !digits && !company.trim()
                  ? t('needNumber')
                  : '';
    if (message) {
      e.preventDefault();
      setErr(message);
    } else setErr('');
  };

  return (
    <form action={action} onSubmit={check} noValidate className="au-finish">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="member" value={member} />
      <input type="hidden" name="memberClass" value={member === 'yes' ? cls : ''} />
      <h1>{t('finishTitle')}</h1>
      <p className="au-sub">{t('finishSub').replace('{email}', email)}</p>
      <FloatField
        label={msg(locale, 'auth.registerPage.name')}
        icon={FieldIcon.person}
        name="fullName"
        autoComplete="name"
        maxLength={120}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <PasswordField
        locale={locale}
        className="fl fl-pw"
        label={msg(locale, 'auth.registerPage.password')}
        icon={FieldIcon.lock}
        name="password"
        placeholder=" "
        autoComplete="new-password"
        minLength={10}
        maxLength={200}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="pw-meter" data-score={score}>
        <i />
        <i />
        <i />
        <i />
        <span>{msg(locale, `landing.au.pw_${score}`)}</span>
      </div>
      <PasswordField
        locale={locale}
        className="fl fl-pw"
        label={msg(locale, 'auth.registerPage.confirm')}
        icon={FieldIcon.shield}
        name="confirm"
        placeholder=" "
        autoComplete="new-password"
        minLength={10}
        maxLength={200}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <fieldset className="au-q">
        <legend>{both('existingQ')}</legend>
        <div className="au-choice">
          {(['yes', 'no'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={member === v}
              className={member === v ? 'on' : ''}
              data-action={`register.member.${v}`}
              onClick={() => setMember(v)}
            >
              {both(v === 'yes' ? 'existingYes' : 'existingNo')}
            </button>
          ))}
        </div>
      </fieldset>

      {member === 'yes' && (
        <div className="au-claim" data-testid="claim">
          <fieldset className="au-q">
            <legend>{both('classQ')}</legend>
            <div className="au-choice">
              {(['Corporate', 'Associate'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cls === c}
                  className={cls === c ? 'on' : ''}
                  data-action="register.class"
                  onClick={() => setCls(c)}
                >
                  {both(c === 'Corporate' ? 'corporate' : 'associate')}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="au-number">
            <span>{t('numberLabel')}</span>
            <span className="au-number-in">
              <em aria-hidden>{`MCCI-${cls === 'Associate' ? 'A' : 'C'}-`}</em>
              <input
                name="digits"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                value={digits}
                aria-describedby="number-help"
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 8))}
              />
            </span>
            <small id="number-help">{t('numberHelp')}</small>
          </label>
          <FloatField
            label={t('companyLabel')}
            icon={FieldIcon.building}
            name="company"
            autoComplete="organization"
            maxLength={200}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <p className="au-hint">{t('claimWhy')}</p>
        </div>
      )}

      <p className="au-err" role="alert">
        {err || state.error}
      </p>
      <div className="au-actions">
        <button className="au-btn au-btn-full" type="submit" data-action="register.finish" disabled={pending}>
          {pending ? msg(locale, 'auth.working') : t('finish')}
        </button>
      </div>
    </form>
  );
}
