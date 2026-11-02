import type { ReactNode } from 'react';
import { AuthArt } from '@/components/auth/auth-art';
import { LangToggle } from '@/components/shared/lang-toggle';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import '@/app/styles/landing.css';

/** "Back to website" and the language switch, at the top of a sign-in pane */
export function AuthTop({ locale }: { locale: Locale }) {
  return (
    <div className="au-top">
      <Link className="au-back" href="/" data-action="nav">
        <svg className="au-arrow" viewBox="0 0 24 24" aria-hidden>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        <span>{msg(locale, 'landing.au.back')}</span>
      </Link>
      <LangToggle variant="slide" />
    </div>
  );
}

/**
 * The owner's sign-in design for a page with one form (forgot, reset, 2-step, invitation, staff): the photo panel next
 * to the form. /login and /register have their sliding version (components/auth/auth-switch.tsx). The staff page is
 * linked from nowhere and links to nowhere (lib/auth/staff-path.ts), so it has no top row: `top={false}`.
 */
export function AuthSplit({ locale, top = true, children }: { locale: Locale; top?: boolean; children: ReactNode }) {
  return (
    <div className="lp">
      <div className="au-shell" data-mode="signin">
        <div className="au-pane au-up au-empty" aria-hidden />
        <div className="au-pane au-in">
          {top && <AuthTop locale={locale} />}
          <div className="au-card">{children}</div>
        </div>
        <AuthArt locale={locale} solo />
      </div>
    </div>
  );
}
