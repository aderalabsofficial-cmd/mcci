import Image from 'next/image';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

/**
 * Sticky top bar of the portal and admin (prototype .tb). On desktop it holds the tools at the end. At ≤ 640 px it is
 * a slim 56 px app bar with only the logo and area name: the tools live in the bottom bar's More sheet.
 */
export function TopBar({
  home,
  brand,
  logoAlt,
  children,
}: {
  home: string;
  brand: { name: string; area: string };
  logoAlt: string;
  children: ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-[14px]">
      <div className="flex h-[var(--appbar-h)] items-center gap-2 px-[var(--gutter)] sm:h-[66px] sm:gap-3.5">
        <Link href={home} className="flex min-h-11 min-w-0 items-center gap-2 sm:hidden">
          <Image src="/images/logo.png" width={32} height={32} alt={logoAlt} className="dark:hidden" />
          <Image src="/images/logo-white.png" width={32} height={32} alt={logoAlt} className="hidden dark:block" />
          <b className="truncate text-[17px] tracking-tight">
            {brand.name} <span className="text-gold-text">{brand.area}</span>
          </b>
        </Link>
        <div className="ms-auto flex items-center gap-2.5 max-sm:hidden">{children}</div>
      </div>
    </header>
  );
}
