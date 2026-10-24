import { setRequestLocale } from 'next-intl/server';
import { RegisterForm } from '@/components/auth/account-forms';
import { AuthSplit } from '@/components/auth/auth-split';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { getSession } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: msg(asLocale((await params).locale), 'auth.registerPage.title') };
}

/**
 * register.start — "Creates account with email verification, then opens the guided form" (docs/catalogue/actions).
 * The account stays inactive until the emailed link is opened (Auth: email confirmation required).
 */
export default async function RegisterPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  if (await getSession()) redirect({ href: '/portal', locale });
  const t = (k: string) => msg(locale, `auth.registerPage.${k}`);
  return (
    <AuthSplit locale={locale}>
      <RegisterForm
        locale={locale}
        text={{
          title: t('title'),
          help: t('help'),
          name: t('name'),
          email: t('email'),
          password: t('password'),
          confirm: t('confirm'),
          create: t('create'),
          sent: t('sent'),
          resend: t('resend'),
          resent: t('resent'),
          haveAccount: t('haveAccount'),
          working: msg(locale, 'auth.working'),
        }}
      />
    </AuthSplit>
  );
}
