import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AuthSplit } from '@/components/auth/auth-split';
import { StaffLoginForm } from '@/components/auth/login-panel';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { getSession } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ expired?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: msg(asLocale((await params).locale), 'auth.staffPage.title'),
    robots: { index: false, follow: false },
  };
}

export const dynamic = 'force-dynamic';

/**
 * Staff sign-in (owner's request, 29 Oct 2026): separate from the members' login page and linked from nowhere on the
 * public website; at /staff/login, or only at the private address MCCI sets in STAFF_LOGIN_PATH (middleware.ts). Email
 * + password (attempts limited), then the mandatory 2-step code (/login/verify). Signed-in people move on.
 */
export default async function StaffLoginPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (session)
    redirect({
      href: session.access.staff ? (session.aal === 'aal2' ? '/admin' : '/login/verify') : '/portal',
      locale,
    });

  const t = (k: string) => msg(locale, `auth.${k}`);
  return (
    <AuthSplit locale={locale}>
      <h2 className="text-[24px] font-extrabold">{t('staffPage.title')}</h2>
      {locale === 'en' && (
        <p lang="ur" dir="rtl" className="text-[16px] leading-[1.9] text-muted">
          {msg('ur', 'auth.staffPage.title')}
        </p>
      )}
      <p className="mt-2 mb-5 text-[14px] text-muted">{t('staffPage.intro')}</p>
      <StaffLoginForm
        locale={locale}
        notice={(await searchParams).expired === '1' ? t('idleSignedOut') : undefined}
        text={{
          staffEmail: t('staffEmail'),
          password: t('password'),
          openAdmin: t('openAdmin'),
          working: t('working'),
          forgot: t('forgot'),
        }}
      />
    </AuthSplit>
  );
}
