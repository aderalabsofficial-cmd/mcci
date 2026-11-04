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
 * Signed in: finished → the portal; the code but no password yet → /register/details.
 */
export default async function RegisterPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  // signed in: a finished account goes to the portal, one with the code but no password yet to its last step
  if (await getSession()) {
    const { data } = await (await createClient()).auth.getUser();
    redirect({ href: signupUnfinished(data.user?.user_metadata) ? '/register/details' : '/portal', locale });
  }
  return <AuthSwitch locale={locale} mode="signup" />;
}
