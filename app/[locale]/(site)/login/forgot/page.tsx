import { setRequestLocale } from 'next-intl/server';
import { ForgotForm } from '@/components/auth/account-forms';
import { AuthSplit } from '@/components/auth/auth-split';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: msg(asLocale((await params).locale), 'auth.forgotPage.title') };
}

/** Forgot password (docs/16 C1): emails a one-time link to /auth/confirm → /login/reset. */
export default async function ForgotPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = (k: string) => msg(locale, `auth.forgotPage.${k}`);
  return (
    <AuthSplit locale={locale}>
      <ForgotForm
        locale={locale}
        text={{
          title: t('title'),
          help: t('help'),
          email: t('email'),
          send: t('send'),
          sent: t('sent'),
          back: t('back'),
          working: msg(locale, 'auth.working'),
        }}
      />
    </AuthSplit>
  );
}
