import type { ReactNode } from 'react';
import { LangToggle } from '@/components/shared/lang-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import type { Locale } from '@/i18n/routing';
import { bottomTabsModel, moreSheetModel, msg, pageTabsModel, sidebarModel } from '@/lib/nav/model';
import { screen } from '@/lib/nav/registry';
import { BottomTabs } from './bottom-tabs';
import { PageTabs } from './page-tabs';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

/**
 * Shared frame of the member portal and the admin panel: sidebar + top bar + page tabs on desktop,
 * app bar + bottom tabs + More sheet at ≤ 640 px (docs/15-mobile-app.md §5).
 * Member labels are bilingual (EN + UR); the admin shows the active language only, as in the prototype.
 */
export function AreaShell({
  area,
  locale,
  children,
}: {
  area: 'portal' | 'admin';
  locale: Locale;
  children: ReactNode;
}) {
  const bilingual = area === 'portal';
  const home = screen(area, 'dashboard').href;
  const brand = {
    name: msg(locale, 'brand.name'),
    area: msg(locale, area === 'portal' ? 'brand.portal' : 'brand.admin'),
    sub: msg(locale, area === 'portal' ? 'brand.portalSub' : 'brand.adminSub'),
  };
  const logoAlt = msg(locale, 'brand.logoAlt');
  // The prototype's admin top bar has no language switch; the member top bar does.
  const tools = (
    <>
      {area === 'portal' && <LangToggle />}
      <ThemeToggle />
    </>
  );

  return (
    <div className="flex min-h-svh" data-area={area}>
      <Sidebar
        sections={sidebarModel(area, locale)}
        locale={locale}
        bilingual={bilingual}
        home={home}
        brand={brand}
        logoAlt={logoAlt}
        menuLabel={msg(locale, 'common.mainMenu')}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* On phones the top bar keeps only the brand; its tools move to the More sheet (Binance-style app bar). */}
        <TopBar home={home} brand={brand} logoAlt={logoAlt}>
          {tools}
        </TopBar>
        <main
          id="main"
          className="flex-1 px-[var(--gutter)] pt-4 pb-[calc(var(--bottomnav-h)+env(safe-area-inset-bottom)+16px)] sm:pt-[26px] sm:pb-10"
        >
          <PageTabs
            groups={pageTabsModel(area, locale)}
            locale={locale}
            bilingual={bilingual}
            label={msg(locale, 'common.pageTabs')}
          />
          {children}
        </main>
      </div>
      <BottomTabs
        tabs={bottomTabsModel(area, locale)}
        more={moreSheetModel(area, locale)}
        tools={tools}
        locale={locale}
        navLabel={msg(locale, 'common.bottomNav')}
        closeLabel={msg(locale, 'common.close')}
        className="sm:hidden"
      />
    </div>
  );
}
