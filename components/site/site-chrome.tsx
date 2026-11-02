'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * Which frame a public page gets: the owner's design on the home page, none on the sign-in pages (their design has its
 * own "Back to website" and language switch), the regular header and footer on every other page. A client component so
 * a Link between them swaps the frame without a full reload.
 */
export function SiteChrome({ landing, site }: { landing: ReactNode; site: ReactNode }) {
  const pathname = usePathname();
  if (/^\/(login|register|invite)(\/|$)/.test(pathname)) return null;
  return <>{pathname === '/' ? landing : site}</>;
}
