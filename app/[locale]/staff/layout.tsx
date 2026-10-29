import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { asLocale } from '@/i18n/locale';
import '@/app/styles/proto.css';
import '@/app/styles/site.css';
import '@/app/styles/mobile.css';

/** The staff sign-in page's frame: no public website header, footer or links (lib/auth/staff-path.ts). */
export default async function StaffLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(asLocale((await params).locale));
  return <main id="main">{children}</main>;
}
