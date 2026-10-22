import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AreaShell } from '@/components/shell/area-shell';
import { asLocale } from '@/i18n/locale';

// TODO(M1): require a signed-in member (redirect to /login) once auth exists.
export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <AreaShell area="portal" locale={locale}>
      {children}
    </AreaShell>
  );
}
