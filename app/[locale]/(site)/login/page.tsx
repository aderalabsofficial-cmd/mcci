import { setRequestLocale } from 'next-intl/server';
import { AuthSwitch } from '@/components/auth/auth-switch';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { safeNext } from '@/lib/auth/identifier';
import { msg } from '@/lib/nav/model';
import { getSession } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string; notice?: string; expired?: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: msg(asLocale((await params).locale), 'auth.title') };
}

/**
 * Login (the owner's design): member password or email code; Sign Up slides in beside it. Staff sign in on their own page
 * (lib/auth/staff-path.ts), linked from nowhere here. Signed-in people move on.
 */
export default async function LoginPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const { next, notice, expired } = await searchParams;
  const session = await getSession();
  if (session) {
    // staff accounts never use the member portal (owner's request, 29 Oct 2026)
    if (session.access.staff) redirect({ href: session.aal === 'aal2' ? '/admin' : '/login/verify', locale });
    else redirect({ href: safeNext(next, '/portal'), locale });
  }

  const t = (k: string) => msg(locale, `auth.${k}`);
  return (
    <AuthSwitch
      locale={locale}
      mode="signin"
      next={next ? safeNext(next, '/portal') : undefined}
      notice={notice === 'link' ? t('link.invalid') : expired === '1' ? t('idleSignedOut') : undefined}
    />
  );
}
