import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PreparingAccount } from '@/components/web/preparing-account';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { safeNext } from '@/lib/auth/identifier';
import { msg } from '@/lib/nav/model';
import { getSession } from '@/lib/permissions/server';
import '@/app/styles/welcome.css';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'landing.prep_title'), robots: { index: false } };
}

export const dynamic = 'force-dynamic';

/**
 * "Preparing your account" (owner's design, 6 Nov 2026): shown once, right after a new account is created (sign-up,
 * or an invitation activated), while the app prefetches the person's first screen; then it continues there. Only for
 * someone signed in; `next` is a same-site path only (safeNext), defaulting to the member portal.
 */
export default async function WelcomePage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const next = safeNext((await searchParams).next, '/portal');
  const session = await getSession();
  if (!session) redirect({ href: `/login?next=${encodeURIComponent(next)}`, locale });
  const both = (k: string) => ({ en: msg('en', `landing.${k}`), ur: msg('ur', `landing.${k}`) });
  return (
    <PreparingAccount
      next={next}
      text={{
        title: both('prep_title'),
        tag: both('prep_tag'),
        steps: ['prep_s1', 'prep_s2', 'prep_s3', 'prep_s4', 'prep_s5'].map(both),
        ready: both('prep_ready'),
        go: both('prep_go'),
        brand: both('prep_brand'),
        skip: msg(locale, 'landing.prep_skip'),
      }}
    />
  );
}
