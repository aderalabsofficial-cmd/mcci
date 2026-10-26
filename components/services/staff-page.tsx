import type { ReactNode } from 'react';
import { NoAccess } from '@/components/admin/no-access';
import { PageHeader } from '@/components/shared/page-header';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { staffLevel, type StaffModule } from '@/lib/permissions/levels';
import type { Session } from '@/lib/permissions/server';

/** the staff service screens open for designations with the module level; otherwise the "outside your limits" card */
export function guardStaff(
  session: Session,
  locale: Locale,
  module: StaffModule,
  titleKey: string,
  min = 1,
): { level: number; denied: ReactNode | null } {
  const level = staffLevel(session.access, module);
  if (level >= min) return { level, denied: null };
  return {
    level,
    denied: (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', titleKey), ur: msg('ur', titleKey) }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module={module} />
      </>
    ),
  };
}
