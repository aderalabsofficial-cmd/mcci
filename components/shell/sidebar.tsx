'use client';

import Image from 'next/image';
import { Bi } from '@/components/shared/bi';
import { NavEntry } from '@/components/shared/nav-entry';
import { NavIcon } from '@/components/shared/nav-icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { NavSectionModel } from '@/lib/nav/model';

/** Navy sidebar of the member portal and the admin panel (prototype .sb / .ni). Hidden at ≤ 640 px. */
export function Sidebar({
  sections,
  locale,
  bilingual,
  home,
  brand,
  logoAlt,
  menuLabel,
}: {
  sections: NavSectionModel[];
  locale: Locale;
  bilingual: boolean;
  home: string;
  brand: { name: string; area: string; sub: string };
  logoAlt: string;
  menuLabel: string;
}) {
  return (
    <aside
      aria-label={menuLabel}
      className="sb-pattern sticky top-0 hidden h-svh w-[var(--sidebar-w)] shrink-0 flex-col overflow-y-auto bg-linear-to-b from-navy-800 to-navy-900 px-3 pb-3 text-[#d6e4db] sm:flex"
    >
      <Link href={home} className="relative flex items-center gap-2.5 px-2 pt-5 pb-4">
        <Image src="/images/logo-white.png" width={46} height={46} alt={logoAlt} priority />
        <div className="min-w-0">
          <b className="block text-[21px] leading-tight tracking-tight text-white">
            {brand.name} <span className="text-[#f3d98b]">{brand.area}</span>
          </b>
          <small className="block text-[12px] text-[#9fb6dc]">{brand.sub}</small>
        </div>
      </Link>
      <nav className="relative flex-1">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <h2 className="mx-2 mt-4 mb-1.5 text-[11px] font-bold tracking-[.08em] text-[#8fb0e0]">
                <Bi label={section.title} locale={locale} single={!bilingual} row />
              </h2>
            )}
            <ul>
              {section.items.map((item) => (
                <li key={item.id}>
                  <NavEntry
                    item={item}
                    className="relative my-0.5 flex min-h-11 w-full items-center gap-2.5 rounded-[11px] border border-transparent px-2 py-1.5 text-start text-[13.5px] font-medium transition"
                    enabledClassName="hover:bg-white/6"
                    currentClassName="border-[rgba(217,180,91,.45)] from-[rgba(217,180,91,.2)] to-[rgba(217,180,91,.04)] text-white before:absolute before:inset-y-[20%] before:-start-3 before:w-[3px] before:rounded-[3px] before:bg-gold-600 ltr:bg-linear-to-r rtl:bg-linear-to-l"
                    disabledClassName="cursor-not-allowed opacity-55"
                  >
                    <span
                      className="grid size-[30px] shrink-0 place-items-center rounded-[9px]"
                      style={{ background: `${item.color ?? '#9fd0ff'}22`, color: item.color }}
                    >
                      <NavIcon name={item.icon} className="size-[18px]" />
                    </span>
                    <Bi label={item.label} locale={locale} single={!bilingual} className="min-w-0" />
                  </NavEntry>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
