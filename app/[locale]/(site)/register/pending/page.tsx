import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AuthSplit } from '@/components/auth/auth-split';
import { GoHomeSoon } from '@/components/auth/go-home-soon';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'auth.signup.pendingTitle'), robots: { index: false } };
}

/** After an existing member's claim (owner, 4 Nov 2026): "ready within 6 to 12 hours", then the home page. */
export default async function SignupPendingPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = (k: string) => msg(locale, `auth.signup.${k}`);
  return (
    <AuthSplit locale={locale}>
      <div className="au-done" role="status" data-testid="claim-pending">
        <svg className="tick" viewBox="0 0 80 80" aria-hidden>
          <circle cx="40" cy="40" r="36" />
          <path d="M24 41l11 11 22-24" />
        </svg>
        <h1>{t('pendingTitle')}</h1>
        <p className="au-sub">{t('pendingText')}</p>
        {locale === 'en' && (
          <p className="au-sub" lang="ur" dir="rtl">
            {msg('ur', 'auth.signup.pendingText')}
          </p>
        )}
        <Link href="/" className="au-btn" data-action="nav">
          {t('toHome')}
        </Link>
        <GoHomeSoon locale={locale} />
      </div>
    </AuthSplit>
  );
}
