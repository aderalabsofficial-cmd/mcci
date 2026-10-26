import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Kpi } from '@/components/review/kpi';
import { SlaRules } from '@/components/services/staff';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { loadRequests, timeLeft } from '@/lib/services/load';
import { SVC_TONE } from '@/lib/services/reference';
import { loadServices } from '@/lib/site/load';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'svc.sla.title') };
}

export const dynamic = 'force-dynamic';

/**
 * SLA Monitor (prototype admin/sla): open requests nearest to their deadline, breaches, and the average response of
 * issued requests (submitted → issued, real figures); SLA rules (sla.rules) for platform staff.
 */
export default async function SlaPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'svc', 'svc.sla.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.sla.${k}`, v);
  const supabase = await createClient();
  const [rows, services, { data: types }] = await Promise.all([
    loadRequests(),
    loadServices(),
    supabase.from('service_types').select('key, name_en, fee, sla_hours, active, docs, fields').order('sort'),
  ]);
  const open = rows.filter((r) => !['Issued', 'Rejected'].includes(r.status));
  const now = Date.now();
  const issued = rows.filter((r) => r.status === 'Issued' && r.issued_at);
  const avg = issued.length
    ? issued.reduce((s, r) => s + (new Date(r.issued_at!).getTime() - new Date(r.submitted_at).getTime()), 0) / issued.length / 3_600_000
    : null;
  const name = (k: string) => services.find((s) => s.key === k)?.name_en ?? k;
  const hours = services[0]?.sla_hours ?? 24;
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub', { hours: String(hours) })}</p>
        </div>
        <div className="pb">
          <SlaRules
            locale={locale}
            canEdit={staffLevel(session.access, 'plat') >= 2}
            services={(types ?? []).map((t) => ({
              key: t.key,
              name: t.name_en,
              fee: t.fee,
              sla: t.sla_hours,
              active: t.active,
              docs: t.docs as string[],
              fields: t.fields as string[],
            }))}
          />
        </div>
      </div>
      <div className="kg">
        <Kpi label={m('kOpen')} value={open.length} icon="file" color="#3b82f6" />
        <Kpi label={m('kBreached')} value={open.filter((r) => new Date(r.sla_due_at).getTime() < now).length} icon="ban" color="#ef4444" />
        <Kpi
          label={m('kSoon')}
          value={open.filter((r) => {
            const d = new Date(r.sla_due_at).getTime() - now;
            return d > 0 && d < 3 * 3_600_000;
          }).length}
          icon="clock"
          color="#f59e0b"
        />
        <Kpi label={m('kAvg')} value={avg === null ? '—' : `${avg.toFixed(1)}h`} sub={m('kAvgSub')} icon="check" color="#1fa34a" />
      </div>
      <section className="card" aria-labelledby="sl-h">
        <div className="ch">
          <h3 id="sl-h">{m('table')}</h3>
        </div>
        {open.length ? (
          <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
            <table>
              <thead>
                <tr>
                  {(['token', 'member', 'service', 'due', 'left', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {msg(locale, `svc.list.cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {open.map((r) => {
                  const t = timeLeft(r.sla_due_at, now);
                  return (
                    <tr className="st" key={r.id} data-request={r.token} data-overdue={t.overdue || undefined}>
                      <td>
                        <Link className="rowlink" href={`/admin/review?t=${r.token}`} data-action="svc.open">
                          {r.token}
                        </Link>
                      </td>
                      <td>{r.company}</td>
                      <td>{name(r.service_key)}</td>
                      <td>{new Date(r.sla_due_at).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{t.overdue ? <b style={{ color: '#b91c1c' }}>{msg(locale, 'svc.list.breached')}</b> : msg(locale, 'svc.list.hoursLeft', { h: String(t.h), m: String(t.m) })}</td>
                      <td>
                        <span className={`bd ${SVC_TONE[r.status] ?? 'gray'}`}>{msg(locale, `svc.status.${r.status}`)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="em">{msg(locale, 'svc.admin.empty')}</p>
        )}
      </section>
    </div>
  );
}
