'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * The website's header, menu and footer appear on every public page except the sign-in pages, whose design has its
 * own "Back to website" and language switch (and the account-preparation screen after sign-up). A client component so
 * a Link between them swaps the frame without a full reload.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (/^\/(login|register|invite|welcome)(\/|$)/.test(pathname)) return null;
  return <>{children}</>;
}
