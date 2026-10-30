'use client';

import { Eye, EyeOff } from 'lucide-react';
import { type InputHTMLAttributes, type ReactNode, useId, useState } from 'react';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

/**
 * A password field with a show / hide eye inside it (owner, 30 Oct 2026). The input takes its name from the label text
 * only (aria-labelledby), so it stays exactly "Password"; the eye is its own button ("Show password" / "Hide password",
 * aria-pressed). Only the input's type changes — same name, autocomplete and value — so password managers keep working;
 * the value is never stored, logged or sent anywhere by this component. The server still checks every password.
 */
export function PasswordField({
  locale,
  label,
  className = 'form-field',
  ...input
}: {
  locale: Locale;
  label: ReactNode;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [shown, setShown] = useState(false);
  const id = useId();
  const inputId = input.id ?? `pw-${id}`;
  const say = msg(locale, shown ? 'auth.passwordHide' : 'auth.passwordShow');
  return (
    <label className={className}>
      <span id={`${inputId}-l`}>{label}</span>
      <span className="pw-wrap">
        <input
          {...input}
          id={inputId}
          type={shown ? 'text' : 'password'}
          aria-labelledby={`${inputId}-l`}
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="pw-eye"
          aria-controls={inputId}
          aria-pressed={shown}
          aria-label={say}
          title={say}
          data-action="password.toggle"
          onClick={(e) => {
            e.preventDefault();
            setShown((s) => !s);
          }}
        >
          {shown ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </span>
    </label>
  );
}
