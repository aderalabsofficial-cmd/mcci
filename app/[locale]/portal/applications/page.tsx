import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { both, L } from '@/components/membership/ui';
import { Kpi } from '@/components/review/kpi';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadMyRequests, serviceCompany, timeLeft } from '@/lib/services/load';
import { SVC_TONE } from '@/lib/services/reference';
import { loadServices } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.applications') };
}

export const dynamic = 'force-dynamic';

/** My requests (prototype member/applications): every service request of the company with its status and SLA clock */
export default async function MyRequestsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.list.${k}`, v);
  const company = serviceCompany(session.access);
  const [rows, services] = await Promise.all([company ? loadMyRequests(company.id) : Promise.resolve([]), loadServices()]);
  const sent = rows.filter((r) => !r.draft);
  const name = (k: string) => {
    const s = services.find((x) => x.key === k);
    return s ? (locale === 'ur' ? s.name_ur || s.name_en : s.name_en) : k;
  };
  const left = (due: string) => {
    const t = timeLeft(due);
    return t.overdue ? m('breached') : m('hoursLeft', { h: String(t.h), m: String(t.m) });
  };
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('svc.list.title')} />
          </h1>
        </div>
        <div className="pb">
          <Link className="btn btn-primary" href="/portal/apply" data-action="nav">
            <Plus size={16} aria-hidden /> {m('new')}
          </Link>
        </div>
      </div>
      <div className="kg">
        <Kpi label={m('kTotal')} value={sent.length} sub={m('kTotalSub')} icon="file" color="#3b82f6" />
        <Kpi
          label={m('kProgress')}
          value={sent.filter((r) => ['Submitted', 'In review', 'Ready to sign'].includes(r.status)).length}
          sub={m('kProgressSub')}
          icon="clock"
          color="#c8963e"
        />
        <Kpi label={m('kIssued')} value={sent.filter((r) => r.status === 'Issued').length} sub={m('kIssuedSub')} icon="check" color="#1fa34a" />
        <Kpi label={m('kAction')} value={sent.filter((r) => r.status === 'Returned').length} sub={m('kActionSub')} icon="flag" color="#ef4444" />
      </div>
      <section className="card" aria-labelledby="my-h">
        <div className="ch">
          <h3 id="my-h">{m('table')}</h3>
        </div>
        {rows.length ? (
          <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
            <table>
              <thead>
                <tr>
                  {(['token', 'service', 'submitted', 'left', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr className="st" key={r.id} data-request={r.token} data-status={r.draft ? 'Draft' : r.status}>
                    <td>
                      <Link className="rowlink" href={r.draft ? `/portal/apply?r=${r.id}` : `/portal/application?t=${r.token}`} data-action={r.draft ? 'nav' : 'svc.open'}>
                        {r.draft ? m('continue') : r.token}
                      </Link>
                    </td>
                    <td>{name(r.service_key)}</td>
                    <td>{r.draft ? '—' : voucherDate(r.submitted_at, locale)}</td>
                    <td>{r.draft ? '—' : r.status === 'Issued' ? m('done') : ['Rejected'].includes(r.status) ? '—' : left(r.sla_due_at)}</td>
                    <td>
                      <span className={`bd ${r.draft ? 'gray' : (SVC_TONE[r.status] ?? 'gray')}`}>{r.draft ? m('draft') : msg(locale, `svc.status.${r.status}`)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="em">{m('empty')}</p>
        )}
      </section>
    </div>
  );
}
