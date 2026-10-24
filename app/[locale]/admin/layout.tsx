import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AreaShell } from '@/components/shell/area-shell';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { getSession } from '@/lib/permissions/server';

/**
 * Admin panel: active staff only, with a TOTP-verified session (docs/09). Members are sent to their portal, staff
 * without the second step to /login/verify. Each admin action checks its own module level (requirePermission).
 * TODO(M1+): hide menu items above the person's designation limits.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect({ href: '/login?next=/admin', locale });
  if (!session!.access.staff) redirect({ href: '/portal', locale });
  if (session!.aal !== 'aal2') redirect({ href: '/login/verify', locale });
  return (
    <AreaShell
      area="admin"
      locale={locale}
      account={{ name: session!.access.full_name ?? '', role: session!.access.staff!.designation }}
    >
      {children}
    </AreaShell>
  );
}
