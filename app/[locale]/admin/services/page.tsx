import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EditService } from '@/components/services/staff';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { NoAccess } from '@/components/admin/no-access';
import { PageHeader } from '@/components/shared/page-header';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'svc.setup.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Services Setup (prototype admin/services): fee, documents, details, response hours and availability per service.
 * Read by service and platform staff; changed by platform administrators (plat ≥ 2). TODO(MCCI): confirm the fees.
 */
export default async function ServicesSetupPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const plat = staffLevel(session.access, 'plat');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.setup.${k}`, v);
  if (plat < 1 && staffLevel(session.access, 'svc') < 1) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'svc.setup.title'), ur: msg('ur', 'svc.setup.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="plat" />
      </>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase.from('service_types').select('key, name_en, name_ur, fee, sla_hours, active, docs, fields').order('sort');
  const rows = data ?? [];
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <section className="card" aria-labelledby="sc-h">
        <div className="ch">
          <h3 id="sc-h">{m('table')}</h3>
        </div>
        <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
          <table>
            <thead>
              <tr>
                {(['service', 'documents', 'fee', 'sla', 'active'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`cols.${c}`)}
                  </th>
                ))}
                <th scope="col">
                  <span className="sr-only">{m('edit', { service: '' })}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr className="st" key={s.key} data-service={s.key}>
                  <td>
                    <b>{locale === 'ur' ? s.name_ur || s.name_en : s.name_en}</b>
                  </td>
                  <td>{(s.docs as string[]).length}</td>
                  <td>{s.fee > 0 ? `PKR ${s.fee.toLocaleString('en-US')}` : msg(locale, 'svc.apply.kv.noFee')}</td>
                  <td>{s.sla_hours}h</td>
                  <td>
                    <span className={`bd ${s.active ? 'green' : 'gray'}`}>{s.active ? m('yes') : m('no')}</span>
                  </td>
                  <td>
                    <EditService
                      locale={locale}
                      canEdit={plat >= 2}
                      service={{ key: s.key, name: s.name_en, fee: s.fee, sla: s.sla_hours, active: s.active, docs: s.docs as string[], fields: s.fields as string[] }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
