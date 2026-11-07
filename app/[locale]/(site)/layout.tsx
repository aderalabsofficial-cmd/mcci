import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { LangToggle } from '@/components/shared/lang-toggle';
import { BottomTabs } from '@/components/shell/bottom-tabs';
import { SiteChrome } from '@/components/site/site-chrome';
import { webChrome } from '@/components/web/web-chrome';
import { WebFx } from '@/components/web/web-fx';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { bottomTabsModel, moreSheetModel, msg } from '@/lib/nav/model';
import { getShell } from '@/lib/shell/server';
import '@/app/styles/proto.css';
import '@/app/styles/proto-app.css';
import '@/app/styles/site.css';
import '@/app/styles/mobile.css';
import '@/app/styles/theme.css';
import '@/app/styles/landing.css';
import { MobileTables } from '@/components/shared/mobile-tables';

/**
 * Public website frame. In a browser: the owner's design on the home page, none on the sign-in pages, and the
 * transparent header + footer on the others (compact header and menu sheet on phones).
 * Inside the Android app: app bar + visitor bottom tabs, no footer (docs/15-mobile-app.md §4).
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const shell = await getShell();
  const c = (k: string) => msg(locale, `landing.city_${k}`);
  // the design's effects; inside the app nothing moves (WebFx reads data-shell)
  const fx = (
    <WebFx
      cities={{
        london: c('london'),
        riyadh: c('riyadh'),
        dubai: c('dubai'),
        beijing: c('beijing'),
        guangzhou: c('guangzhou'),
        kl: c('kl'),
      }}
      multan={c('multan')}
      ur={locale === 'ur'}
    />
  );

  if (shell === 'app') {
    return (
      <>
        <header className="pt-safe sticky top-0 z-40 bg-navy-800 text-white">
          <div className="flex h-[var(--appbar-h)] items-center gap-2 px-[var(--gutter)]">
            <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2">
              <Image src="/images/logo-white.png" width={32} height={32} alt={msg(locale, 'brand.logoAlt')} priority />
              <b className="truncate text-[18px]">{msg(locale, 'brand.name')}</b>
            </Link>
          </div>
        </header>
        {/* the pages are the owner's design (scoped to .lp); the app keeps its own bar and bottom tabs */}
        <div className="lp">
          <main id="main" className="pb-[calc(var(--bottomnav-h)+env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
        <MobileTables />
        {fx}
        <BottomTabs
          tabs={bottomTabsModel('site', locale)}
          more={moreSheetModel('site', locale)}
          locale={locale}
          tools={<LangToggle />}
          navLabel={msg(locale, 'common.bottomNav')}
          closeLabel={msg(locale, 'common.close')}
        />
      </>
    );
  }

  const chrome = await webChrome(locale);
  return (
    <div className="lp">
      <SiteChrome>
        {chrome.ticker}
        {chrome.header}
      </SiteChrome>
      <main id="main">{children}</main>
      <MobileTables />
      <SiteChrome>{chrome.footer}</SiteChrome>
      {fx}
    </div>
  );
}
