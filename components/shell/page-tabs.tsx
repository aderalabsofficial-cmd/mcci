'use client';

import { Bi } from '@/components/shared/bi';
import { NavEntry } from '@/components/shared/nav-entry';
import { NavIcon } from '@/components/shared/nav-icon';
import { usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { isCurrent, type NavItem } from '@/lib/nav/model';

/**
 * Page tabs (prototype .ptabs / M.GROUPS): the screens that share one sidebar item, e.g.
 * My Membership → Status · Application form · Track · Official form. Underlined tabs on desktop, scrolling chips
 * (active language only) on phones. Renders nothing outside a group.
 */
export function PageTabs({
  groups,
  locale,
  bilingual,
  label,
}: {
  groups: NavItem[][];
  locale: Locale;
  bilingual: boolean;
  label: string;
}) {
  const pathname = usePathname();
  const group = groups.find((g) => g.some((item) => isCurrent(item, pathname)));
  if (!group) return null;
  return (
    <nav
      aria-label={label}
      className="-mx-[var(--gutter)] mb-3 [scrollbar-width:none] overflow-x-auto px-[var(--gutter)] sm:mx-0 sm:-mt-1.5 sm:mb-5 sm:border-b sm:border-line sm:px-0"
    >
      <ul className="flex min-w-max gap-2 sm:gap-1">
        {group.map((item) => (
          <li key={item.id}>
            <NavEntry
              item={item}
              className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-3.5 text-[13px] font-bold text-muted transition sm:-mb-px sm:rounded-none sm:rounded-t-[10px] sm:border-0 sm:border-b-[3px] sm:border-transparent sm:bg-transparent sm:px-4 sm:py-2.5 sm:text-[15px] max-sm:[&_.bi-ur]:hidden"
              enabledClassName="hover:bg-hover hover:text-ink"
              currentClassName="border-gold-600 text-gold-text max-sm:bg-[color-mix(in_srgb,var(--gold)_14%,var(--card))] sm:bg-card"
              disabledClassName="opacity-55"
            >
              <NavIcon name={item.icon} className="size-4" />
              <Bi label={item.label} locale={locale} single={!bilingual} row />
            </NavEntry>
          </li>
        ))}
      </ul>
    </nav>
  );
}
