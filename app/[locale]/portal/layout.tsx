import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AreaShell } from '@/components/shell/area-shell';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { getSession } from '@/lib/permissions/server';

/** Member portal: a signed-in person (middleware redirects earlier; this is the server-side check). */
export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect({ href: '/login?next=/portal', locale });
  const company = session!.access.companies[0];
  return (
    <AreaShell
      area="portal"
      locale={locale}
      account={{ name: session!.access.full_name ?? session!.access.email ?? '', role: company?.role ?? null }}
    >
      {children}
    </AreaShell>
  );
}
