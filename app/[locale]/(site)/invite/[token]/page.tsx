import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { AuthSplit } from '@/components/auth/auth-split';
import { AcceptForm, ActivateForm } from '@/components/auth/invite-forms';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { lookupInvitation } from '@/lib/auth/admin/invitations';
import { formatDate } from '@/lib/format';
import { msg } from '@/lib/nav/model';
import { trustedClientIp } from '@/lib/net/client-ip';
import { getSession } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // the token is in the path: never send it to another site as a referrer, never index the page
  return {
    title: msg(asLocale((await params).locale), 'access.invite.title'),
    referrer: 'no-referrer',
    robots: { index: false, follow: false },
  };
}

export const dynamic = 'force-dynamic';

/**
 * The emailed invitation link (staff.accept / user.accept). Shows what the invitation is for and the one step that
 * fits: set a password (no account yet), sign in (account exists), accept (signed in with the invited address), or
 * why the link no longer works. The token is checked on the server only.
 */
export default async function InvitePage({ params }: Props) {
  const { locale: raw, token } = await params;
  const locale = asLocale(raw);
  setRequestLocale(locale);
  const t = (k: string, vars?: Record<string, string>) => msg(locale, `access.invite.${k}`, vars);

  const found = await lookupInvitation(token, trustedClientIp(await headers()));
  const inv = found.state === 'ok' ? found.invitation : null;
  const session = inv ? await getSession() : null;

  const notice = (text: string, action?: React.ReactNode) => (
    <div className="grid gap-[14px]">
      <h2 className="text-[22px] font-extrabold tracking-[-0.01em]">{t('title')}</h2>
      <p role="status" className="rounded-[10px] border border-line bg-card2 px-3 py-2 text-[14px]">
        {text}
      </p>
      {action}
    </div>
  );
  const loginLink = (label: string) => (
    <div>
      <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} className="btn btn-primary btn-big">
        {label}
      </Link>
    </div>
  );

  let body: React.ReactNode;
  if (found.state === 'throttled') body = notice(msg(locale, 'auth.errors.rateLimited'));
  else if (!inv || inv.status === 'Revoked') body = notice(t('invalid'));
  else if (inv.status === 'Expired') body = notice(t('expired'));
  else if (inv.status === 'Active')
    body = notice(
      t('used'),
      <div>
        <Link href="/login" className="btn btn-primary btn-big">
          {t('goLogin')}
        </Link>
      </div>,
    );
  else {
    const intro =
      inv.kind === 'staff'
        ? t('staffIntro', { designation: inv.designation ?? '' })
        : t('companyIntro', {
            company: inv.companyName ?? '',
            role: inv.companyRole ? msg(locale, `access.roleNames.${inv.companyRole}`) : '',
          });
    const signedInEmail = session?.access.email ?? null;
    let step: React.ReactNode;
    if (session && signedInEmail?.toLowerCase() === inv.email.toLowerCase()) {
      step = (
        <>
          <p className="text-[14px]">{t('signedInAs', { email: signedInEmail })}</p>
          <AcceptForm
            locale={locale}
            token={token}
            text={{ accept: t('accept'), working: msg(locale, 'auth.working') }}
          />
        </>
      );
    } else if (session) {
      step = (
        <>
          <p
            role="alert"
            className="rounded-[10px] border border-[#f3c7c7] bg-[#fdecec] px-3 py-2 text-[14px] text-[#9b1c1c]"
          >
            {t('wrongAccount', { email: signedInEmail ?? '' })}
          </p>
          <SignOutButton locale={locale} label={t('signOut')} className="w-fit" />
        </>
      );
    } else if (inv.accountExists) {
      step = (
        <>
          <p className="text-[14px]">{t('haveAccount')}</p>
          {loginLink(t('signIn'))}
        </>
      );
    } else {
      step = (
        <ActivateForm
          locale={locale}
          token={token}
          email={inv.email}
          text={{
            password: t('createPassword'),
            confirm: t('confirmPassword'),
            rule: t('passwordRule'),
            activate: t('activate'),
            working: msg(locale, 'auth.working'),
          }}
        />
      );
    }
    body = (
      <div className="grid gap-[14px]">
        <h2 className="text-[22px] font-extrabold tracking-[-0.01em]">{t('title')}</h2>
        <p className="text-[15px]">{intro}</p>
        <dl className="grid gap-1 rounded-[12px] border border-line bg-card2 px-4 py-3 text-[14px]">
          <dt className="sr-only">{msg(locale, 'access.company.email')}</dt>
          <dd className="font-semibold">{t('forEmail', { email: inv.email })}</dd>
          <dd className="text-muted">{t('validUntil', { date: formatDate(locale, inv.expiresAt) })}</dd>
          {inv.kind === 'staff' && <dd className="text-muted">{t('staffNext')}</dd>}
        </dl>
        {step}
      </div>
    );
  }

  return <AuthSplit locale={locale}>{body}</AuthSplit>;
}
