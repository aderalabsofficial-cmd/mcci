import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Kpi } from '@/components/review/kpi';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadRequests, timeLeft } from '@/lib/services/load';
import { SVC_TONE } from '@/lib/services/reference';
import { loadServices } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'svc.admin.title') };
}

export const dynamic = 'force-dynamic';

const COLS = [
  ['Submitted', '#3b82f6'],
  ['In review', '#f59e0b'],
  ['Ready to sign', '#c8963e'],
  ['Returned', '#ef4444'],
  ['Issued', '#1fa34a'],
] as const;

/** Service Requests (prototype admin/applications): all seven services as a board by status and a table with the SLA */
export default async function ServiceRequestsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'svc', 'svc.admin.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.admin.${k}`, v);
  const [rows, services] = await Promise.all([loadRequests(), loadServices()]);
  const name = (k: string) => services.find((s) => s.key === k)?.name_en ?? k;
  const open = rows.filter((r) => !['Issued', 'Rejected'].includes(r.status));
  const left = (due: string) => {
    const t = timeLeft(due);
    return t.overdue ? msg(locale, 'svc.list.breached') : msg(locale, 'svc.list.hoursLeft', { h: String(t.h), m: String(t.m) });
  };
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <div className="kg">
        <Kpi label={m('kOpen')} value={open.length} sub={m('kOpenSub')} icon="file" color="#3b82f6" />
        <Kpi
          label={m('kDue')}
          value={open.filter((r) => new Date(r.sla_due_at).getTime() - Date.now() < 3 * 3_600_000).length}
          sub={m('kDueSub')}
          icon="clock"
          color="#ef4444"
          wrap={(inner) => (
            <Link href="/admin/sla" className="kpi" data-action="nav">
              {inner}
            </Link>
          )}
        />
        <Kpi
          label={m('kSign')}
          value={rows.filter((r) => r.status === 'Ready to sign').length}
          sub={m('kSignSub')}
          icon="signature"
          color="#c8963e"
          wrap={(inner) => (
            <Link href="/admin/approvals" className="kpi" data-action="nav">
              {inner}
            </Link>
          )}
        />
        <Kpi label={m('kIssued')} value={rows.filter((r) => r.status === 'Issued').length} sub={m('kIssuedSub')} icon="check" color="#1fa34a" />
      </div>
      <section className="card" aria-labelledby="bd-h">
        <div className="ch">
          <h3 id="bd-h">{m('board')}</h3>
        </div>
        <div className="kan" style={{ gridTemplateColumns: 'repeat(5, minmax(160px, 1fr))', overflowX: 'auto' }}>
          {COLS.map(([s, c]) => {
            const list = rows.filter((r) => r.status === s);
            return (
              <div className="kc" key={s} data-column={s}>
                <h4>
                  <i style={{ background: c }} aria-hidden />
                  {msg(locale, `svc.status.${s}`)}
                  <b>{list.length}</b>
                </h4>
                {list.map((r) => (
                  <Link className="kcard" key={r.id} href={`/admin/review?t=${r.token}`} data-action="svc.open" aria-label={m('open', { token: r.token })}>
                    <b>{name(r.service_key)}</b>
                    <small>
                      {r.company} · {s === 'Issued' ? msg(locale, 'svc.list.done') : left(r.sla_due_at)}
                    </small>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </section>
      <section className="card" aria-labelledby="al-h" style={{ marginTop: 18 }}>
        <div className="ch">
          <h3 id="al-h">{m('all')}</h3>
        </div>
        {rows.length ? (
          <div className="tw" tabIndex={0} role="region" aria-label={m('all')}>
            <table>
              <thead>
                <tr>
                  {(['token', 'member', 'service', 'submitted', 'left', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {msg(locale, `svc.list.cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr className="st" key={r.id} data-request={r.token}>
                    <td>
                      <Link className="rowlink" href={`/admin/review?t=${r.token}`} data-action="svc.open">
                        {r.token}
                      </Link>
                    </td>
                    <td>{r.company}</td>
                    <td>{name(r.service_key)}</td>
                    <td>{new Date(r.submitted_at).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{r.status === 'Issued' ? msg(locale, 'svc.list.done') : r.status === 'Rejected' ? '—' : left(r.sla_due_at)}</td>
                    <td>
                      <span className={`bd ${SVC_TONE[r.status] ?? 'gray'}`}>{msg(locale, `svc.status.${r.status}`)}</span>
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
