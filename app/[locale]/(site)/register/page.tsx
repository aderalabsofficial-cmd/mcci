import { setRequestLocale } from 'next-intl/server';
import { AuthSwitch } from '@/components/auth/auth-switch';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { signupUnfinished } from '@/lib/auth/signup';
import { msg } from '@/lib/nav/model';
import { getSession } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: msg(asLocale((await params).locale), 'auth.registerPage.title') };
}

/**
 * register.start (owner, 4 Nov 2026): mobile and email, a 6-digit code by email, a welcome, then /register/details.
 * Everyone signed in who finished goes to the portal.
 */
export default async function RegisterPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  // a finished account goes to the portal. One that is not finished stays: right after the emailed code this page is
  // drawn again under the new session and must keep showing the welcome (its own link opens /register/details)
  if (await getSession()) {
    const { data } = await (await createClient()).auth.getUser();
    if (!signupUnfinished(data.user?.user_metadata)) redirect({ href: '/portal', locale });
  }
  return <AuthSwitch locale={locale} mode="signup" />;
}
