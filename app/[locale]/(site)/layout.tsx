import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { LangToggle } from '@/components/shared/lang-toggle';
import { BottomTabs } from '@/components/shell/bottom-tabs';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { bottomTabsModel, loginModel, moreSheetModel, msg, siteNavModel } from '@/lib/nav/model';
import { getShell } from '@/lib/shell/server';

/**
 * Public website frame. In a browser: transparent header + footer (compact header and menu sheet on phones).
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
        <main id="main" className="pb-[calc(var(--bottomnav-h)+env(safe-area-inset-bottom))]">
          {children}
        </main>
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

  return (
    <>
      <SiteHeader
        locale={locale}
        nav={siteNavModel(locale)}
        login={loginModel(locale)}
        text={{
          name: msg(locale, 'brand.name'),
          tagline: msg(locale, 'brand.digitalChamber'),
          chamberUr: msg('ur', 'brand.chamber'),
          menu: msg(locale, 'common.menu'),
          close: msg(locale, 'common.close'),
          logoAlt: msg(locale, 'brand.logoAlt'),
          mainMenu: msg(locale, 'common.mainMenu'),
        }}
      />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} />
    </>
  );
}
