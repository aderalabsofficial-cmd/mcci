import { BadgeCheck, FileText, Folder, Landmark, type LucideIcon, Mail, ShieldCheck, Users } from 'lucide-react';
import { Card } from '@/components/site/blocks';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import type { ServiceType } from '@/lib/site/load';

/** icon and colour per service (prototype M.SV) */
export const SERVICE_LOOK: Record<string, { icon: LucideIcon; color: string }> = {
  ebil: { icon: Mail, color: '#3b82f6' },
  visa: { icon: Users, color: '#14b8a6' },
  guar: { icon: ShieldCheck, color: '#ef4444' },
  sample: { icon: Folder, color: '#f59e0b' },
  other: { icon: FileText, color: '#8b5cf6' },
  co: { icon: Landmark, color: '#c8963e' },
  att: { icon: BadgeCheck, color: '#1b4f9c' },
};

export const serviceName = (s: ServiceType, locale: Locale) => (locale === 'ur' ? s.name_ur || s.name_en : s.name_en);

/** the seven service cards (prototype svcCards) */
export function ServiceCards({ locale, services }: { locale: Locale; services: ServiceType[] }) {
  return (
    <div className="g4">
      {services.map((s) => {
        const look = SERVICE_LOOK[s.key] ?? { icon: FileText, color: '#1b4f9c' };
        return (
          <Card
            key={s.key}
            icon={look.icon}
            color={look.color}
            title={serviceName(s, locale)}
            body={msg(locale, `site.svc.${s.key}.desc`)}
            href={`/service?s=${s.key}`}
            action="nav"
            more={`${msg(locale, 'site.services.view')} →`}
          />
        );
      })}
    </div>
  );
}
