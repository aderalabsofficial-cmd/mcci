import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AreaShell } from '@/components/shell/area-shell';
import { asLocale } from '@/i18n/locale';

// TODO(M1): require a signed-in staff user with TOTP; menu items filtered by designation limits.
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <AreaShell area="admin" locale={locale}>
      {children}
    </AreaShell>
  );
}
