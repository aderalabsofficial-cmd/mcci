import { setRequestLocale } from 'next-intl/server';
import { AuthSplit } from '@/components/auth/auth-split';
import { MfaForm } from '@/components/auth/mfa-form';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLoginPath } from '@/lib/auth/staff-path';
import { getSession } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: msg(asLocale((await params).locale), 'auth.mfa.challengeTitle') };
}

// One enrolment per visit: a fresh QR must never be served from a cache.
export const dynamic = 'force-dynamic';

/**
 * Staff 2-step login (docs/09: TOTP mandatory for staff). A verified authenticator → enter its code. None yet → a new
 * enrolment (QR + key) is created here; earlier unfinished enrolments of this person are removed first, so only the
 * QR on screen can be completed.
 */
export default async function VerifyPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect({ href: staffLoginPath(), locale });
  if (!session!.access.staff) redirect({ href: '/portal', locale });
  if (session!.aal === 'aal2') redirect({ href: '/admin', locale });

  const supabase = await createClient();
  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(`could not read 2-step factors: ${error.message}`);
  const verified = factors.totp.find((f) => f.status === 'verified');
  const t = (k: string) => msg(locale, `auth.mfa.${k}`);
  const common = { secret: t('secret'), code: t('code'), verify: t('verify'), working: msg(locale, 'auth.working') };

  let form;
  if (verified) {
    form = (
      <MfaForm
        locale={locale}
        factorId={verified.id}
        text={{ ...common, title: t('challengeTitle'), help: t('challengeHelp') }}
      />
    );
  } else {
    for (const f of factors.all.filter((x) => x.factor_type === 'totp' && x.status !== 'verified')) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const enrolled = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'MCCI staff' });
    if (enrolled.error) throw new Error(`could not start 2-step enrolment: ${enrolled.error.message}`);
    form = (
      <MfaForm
        locale={locale}
        factorId={enrolled.data.id}
        qr={enrolled.data.totp.qr_code}
        secret={enrolled.data.totp.secret}
        text={{ ...common, title: t('enrollTitle'), help: t('enrollHelp') }}
      />
    );
  }

  return (
    <AuthSplit locale={locale}>
      {form}
      <div className="mt-6">
        <SignOutButton locale={locale} label={msg(locale, 'auth.signOut')} />
      </div>
    </AuthSplit>
  );
}
