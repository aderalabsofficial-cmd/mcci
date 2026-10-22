'use client';

import { type ReactNode, useState } from 'react';
import { NavEntry } from '@/components/shared/nav-entry';
import { NavIcon } from '@/components/shared/nav-icon';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { isCurrent, type NavItem } from '@/lib/nav/model';
import { cn } from '@/lib/utils';

/**
 * Compact bottom tab bar (docs/15-mobile-app.md §5.3): four destinations + "More". More opens a bottom sheet with
 * the top-bar tools (language, theme — on phones the app bar only carries the brand) and every other page as a
 * 4-column icon grid. Shown at ≤ 640 px, and on the public site only inside the Android app.
 */
export function BottomTabs({
  tabs,
  more,
  tools,
  locale,
  navLabel,
  closeLabel,
  className,
}: {
  tabs: NavItem[];
  more: NavItem[];
  /** controls moved here from the top bar on phones */
  tools?: ReactNode;
  locale: Locale;
  navLabel: string;
  closeLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const moreTab = tabs.find((t) => t.id === 'more');
  const moreActive = more.some((m) => isCurrent(m, pathname));

  const tabClass =
    'group flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[12px] font-semibold leading-none tracking-[-.01em] text-muted';
  const tabCurrent = 'is-current text-gold-text';
  // Material-style indicator: the current tab's icon sits in a soft gold pill
  const pill =
    'grid h-7 w-12 place-items-center rounded-full transition-colors group-[.is-current]:bg-[color-mix(in_srgb,var(--gold)_18%,transparent)]';

  return (
    <nav
      aria-label={navLabel}
      className={cn(
        'pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_srgb,var(--card)_94%,transparent)] backdrop-blur-md',
        className,
      )}
    >
      <ul className="flex h-[var(--bottomnav-h)] items-stretch">
        {tabs.map((tab) =>
          tab.id === 'more' ? null : (
            <li key={tab.id} className="flex min-w-0 flex-1">
              <NavEntry item={tab} className={tabClass} currentClassName={tabCurrent} disabledClassName="opacity-45">
                <span className={pill}>
                  <NavIcon name={tab.icon} className="size-[22px]" />
                </span>
                <span className="max-w-full truncate">{tab.label[locale]}</span>
              </NavEntry>
            </li>
          ),
        )}
        {moreTab && (
          <li className="flex min-w-0 flex-1">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button type="button" data-action="menu.toggle" className={cn(tabClass, moreActive && tabCurrent)}>
                  <span className={pill}>
                    <NavIcon name="menu" className="size-[22px]" />
                  </span>
                  <span>{moreTab.label[locale]}</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                closeLabel={closeLabel}
                aria-describedby={undefined}
                className="gap-3 px-3 pb-5"
              >
                <div className="flex min-h-12 items-center gap-2 pe-12">
                  <SheetTitle className="text-[16px] font-bold">{moreTab.label[locale]}</SheetTitle>
                  {tools && <div className="ms-auto flex items-center gap-2">{tools}</div>}
                </div>
                <ul className="grid grid-cols-4 gap-x-1 gap-y-2 max-[360px]:grid-cols-3">
                  {more.map((item) => (
                    <li key={item.id} className="flex">
                      <NavEntry
                        item={item}
                        onNavigate={() => setOpen(false)}
                        className="group flex min-h-[76px] w-full flex-col items-center gap-1.5 rounded-[14px] px-0.5 py-2 text-center text-[12px] leading-[1.25] font-semibold"
                        enabledClassName="hover:bg-hover"
                        currentClassName="is-current bg-hover text-gold-text"
                        disabledClassName="opacity-45"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-line bg-card2 group-[.is-current]:border-gold-600">
                          <NavIcon name={item.icon} className="size-5" />
                        </span>
                        <span className="line-clamp-2 break-words">{item.label[locale]}</span>
                      </NavEntry>
                    </li>
                  ))}
                </ul>
              </SheetContent>
            </Sheet>
          </li>
        )}
      </ul>
    </nav>
  );
}
