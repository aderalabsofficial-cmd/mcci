import { setRequestLocale } from 'next-intl/server';
import { ResetForm } from '@/components/auth/account-forms';
import { AuthSplit } from '@/components/auth/auth-split';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { getSession } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: msg(asLocale((await params).locale), 'auth.resetPage.title') };
}

export const dynamic = 'force-dynamic';

/** New password, reached from the emailed reset link (/auth/confirm establishes the recovery session). */
export default async function ResetPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  if (!(await getSession())) redirect({ href: '/login?notice=link', locale });
  const t = (k: string) => msg(locale, `auth.resetPage.${k}`);
  return (
    <AuthSplit locale={locale}>
      <ResetForm
        locale={locale}
        text={{
          title: t('title'),
          help: t('help'),
          password: t('password'),
          confirm: t('confirm'),
          save: t('save'),
          working: msg(locale, 'auth.working'),
        }}
      />
    </AuthSplit>
  );
}
