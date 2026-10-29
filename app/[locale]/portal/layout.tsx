import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AreaShell } from '@/components/shell/area-shell';
import { IdleGuard } from '@/components/shell/idle-guard';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { getSession } from '@/lib/permissions/server';
import { IDLE_MS } from '@/lib/session/idle';
import '@/app/styles/proto.css';
import '@/app/styles/proto-app.css';
import '@/app/styles/mobile.css';
import { MobileTables } from '@/components/shared/mobile-tables';

/**
 * Member portal: a signed-in person (middleware redirects earlier; this is the server-side check). Staff accounts never
 * use the portal (owner's request, 29 Oct 2026): they go to the admin panel, and a staff member who also wants a member
 * account makes one with another email. The database agrees (migration 0470: staff see no company's data).
 */
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
  if (session!.access.staff) redirect({ href: session!.aal === 'aal2' ? '/admin' : '/login/verify', locale });
  const company = session!.access.companies[0];
  return (
    <AreaShell
      area="portal"
      locale={locale}
      account={{ name: session!.access.full_name ?? session!.access.email ?? '', role: company?.role ?? null }}
    >
      {/* prototype styles for the member screens (app/styles/proto.css) */}
      <div className="proto">{children}</div>
      <MobileTables />
      <IdleGuard locale={locale} idleMs={IDLE_MS} />
    </AreaShell>
  );
}
