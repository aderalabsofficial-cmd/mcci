import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { WhatNowCard } from '@/components/portal/what-now-card';
import { PageHeader } from '@/components/shared/page-header';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.dashboard') };
}

/** Member home. M0: the frame only; greeting, tiles and live status arrive with M3 (docs/catalogue/screens.md). */
export default async function PortalHomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const both = (path: string) => ({ en: msg('en', path), ur: msg('ur', path) });

  return (
    <>
      <PageHeader locale={locale} title={both('screens.portal.dashboard')} bilingual />
      <WhatNowCard
        locale={locale}
        tone="blue"
        icon="clock"
        heading={both('portal.whatNow')}
        title={both('portal.setupTitle')}
        body={msg(locale, 'portal.setupBody')}
      />
    </>
  );
}
