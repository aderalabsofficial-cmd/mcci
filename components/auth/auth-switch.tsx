'use client';

import { useEffect, useState } from 'react';
import { AuthArt } from '@/components/auth/auth-art';
import { RegisterForm } from '@/components/auth/account-forms';
import { LoginPanel } from '@/components/auth/login-panel';
import { LangToggle } from '@/components/shared/lang-toggle';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

export type AuthMode = 'signin' | 'signup';

/**
 * /login and /register are one sliding page (the owner's design): the photo panel crosses over between Sign In and
 * Sign Up, and the address follows, so each route still opens on its own form and a reload stays there. Only the pane
 * showing holds a form (the other leaves once the panel has covered it), so nothing behind the panel can be reached.
 */
export function AuthSwitch({ locale, mode: initial, next, notice }: { locale: Locale; mode: AuthMode; next?: string; notice?: string }) {
  const [mode, setMode] = useState<AuthMode>(initial);
  const [leaving, setLeaving] = useState<AuthMode | null>(null);
  const [animate, setAnimate] = useState(false);
  const m = (k: string) => msg(locale, `landing.au.${k}`);

  useEffect(() => {
    setAnimate(true);
  }, []);
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), 550);
    return () => clearTimeout(t);
  }, [leaving]);

  const go = (to: AuthMode) => {
    if (to === mode) return;
    setLeaving(mode);
    setMode(to);
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const query = to === 'signin' && next ? `?next=${encodeURIComponent(next)}` : '';
    window.history.replaceState(null, '', `${prefix}${to === 'signup' ? '/register' : '/login'}${query}`);
    document.title = msg(locale, to === 'signup' ? 'auth.registerPage.title' : 'auth.title');
  };

  const top = (
    <div className="au-top">
      <Link className="au-back" href="/" data-action="nav">
        <svg className="au-arrow" viewBox="0 0 24 24" aria-hidden>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        <span>{m('back')}</span>
      </Link>
      <LangToggle variant="slide" />
    </div>
  );
  const tabs = (
    <div className="au-tabs" role="tablist" aria-label={m('tabs')}>
      <button type="button" role="tab" data-action="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'on' : ''} onClick={() => go('signin')}>
        {m('tab_in')}
      </button>
      <button type="button" role="tab" data-action="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => go('signup')}>
        {m('tab_up')}
      </button>
      <i className={`au-tab-thumb ${mode === 'signup' ? 'is-right' : ''}`} aria-hidden />
    </div>
  );
  const shown = (pane: AuthMode) => mode === pane || leaving === pane;

  return (
    <div className="lp">
      <div className={`au-shell ${animate ? '' : 'no-anim'}`} data-mode={mode}>
        <section className="au-pane au-up" inert={mode !== 'signup'}>
          {shown('signup') && (
            <>
              {top}
              <div className="au-card">
                <RegisterForm locale={locale} tabs={tabs} onSignIn={() => go('signin')} />
              </div>
            </>
          )}
        </section>
        <section className="au-pane au-in" inert={mode !== 'signin'}>
          {shown('signin') && (
            <>
              {top}
              <div className="au-card">
                <LoginPanel locale={locale} tabs={tabs} next={next} notice={notice} onSignUp={() => go('signup')} />
              </div>
            </>
          )}
        </section>
        <AuthArt locale={locale} />
      </div>
    </div>
  );
}
