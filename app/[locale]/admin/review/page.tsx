import { BadgeCheck, Eye } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Kpi } from '@/components/review/kpi';
import { RequestView } from '@/components/services/request-view';
import { ReviewActions } from '@/components/services/staff';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadRequest, loadRequests, timeLeft } from '@/lib/services/load';
import { loadServices } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'svc.review.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Review Desk (prototype admin/review): one service request — the time left, the member's standing, the fee, the
 * details and documents, the checks — and start / return / approve / not approve / sign & issue. Without ?t the first
 * request under review (else the nearest deadline) opens.
 */
export default async function ServiceReviewPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'svc', 'svc.review.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.review.${k}`, v);
  let token = (await searchParams).t;
  if (!token) {
    const all = await loadRequests();
    token = (all.find((r) => r.status === 'In review') ?? all.find((r) => !['Issued', 'Rejected'].includes(r.status)))?.token;
  }
  const [detail, services] = await Promise.all([token ? loadRequest(token, session.userId) : Promise.resolve(null), loadServices()]);
  if (!detail) {
    return (
      <div className="proto">
        <div className="card em" style={{ textAlign: 'center' }}>
          <h2>{m('none')}</h2>
          <p className="muted">{m('noneSub')}</p>
          <Link className="btn btn-primary" href="/admin/applications" data-action="nav">
            {msg(locale, 'svc.admin.title')}
          </Link>
        </div>
      </div>
    );
  }
  const s = services.find((x) => x.key === detail.service_key);
  const t = timeLeft(detail.sla_due_at);
  const feeOk = !detail.voucher || detail.voucher.status === 'Paid';
  const memberOk = detail.member && ['Permanent', 'Temporary'].includes(detail.member.status) && new Date(detail.member.valid_to) >= new Date(new Date().toDateString());
  return (
    <div className="proto">
      <RequestView
        locale={locale}
        detail={detail}
        serviceName={s?.name_en ?? detail.service_key}
        hours={s?.sla_hours ?? 24}
        audience="staff"
        actions={<ReviewActions locale={locale} requestId={detail.id} status={detail.status} level={g.level} feeOk={feeOk} />}
        aside={
          <>
            <div className="kg" style={{ marginTop: 14 }}>
              <Kpi
                label={m('kTime')}
                value={detail.status === 'Issued' ? msg(locale, 'svc.list.done') : t.overdue ? msg(locale, 'svc.list.breached') : `${t.h}h ${t.m}m`}
                sub={m('kTimeSub', { hours: String(s?.sla_hours ?? 24) })}
                icon="clock"
                color="#14b8a6"
              />
              <Kpi
                label={m('kMember')}
                value={detail.member ? msg(locale, `register.status.${detail.member.status}`) : '—'}
                sub={detail.member?.member_no ?? ''}
                icon="users"
                color={memberOk ? '#1fa34a' : '#ef4444'}
              />
              <Kpi
                label={m('kFee')}
                value={detail.voucher ? (detail.voucher.status === 'Paid' ? m('paid') : m('unpaid')) : m('noFee')}
                sub={detail.voucher ? `PKR ${detail.voucher.amount.toLocaleString('en-US')} · ${detail.voucher.voucher_no}` : ''}
                icon="card"
                color={feeOk ? '#1fa34a' : '#f59e0b'}
              />
              <Kpi label={m('kDocs')} value={detail.docs.length} sub={m('kDocsSub')} icon="folder" color="#3b82f6" />
            </div>
            <div className="gr" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
              <section className="card" aria-labelledby="dt-h">
                <div className="ch">
                  <h3 id="dt-h">{m('details')}</h3>
                </div>
                <div className="paper">
                  {(s?.fields ?? Object.keys(detail.data)).map((f) => (
                    <p key={f}>
                      {f}: <mark>{detail.data[f] || '—'}</mark>
                    </p>
                  ))}
                </div>
              </section>
              <section className="card" aria-labelledby="ck-h">
                <div className="ch">
                  <h3 id="ck-h">{m('checks')}</h3>
                </div>
                {(
                  [
                    [memberOk, memberOk ? m('memberValid') : m('memberInvalid'), detail.member ? `${detail.member.member_no} · ${detail.member.status}` : ''],
                    [detail.docs.length > 0, m('docsPresent'), (s?.docs ?? []).join(', ')],
                    [feeOk, m('feeCheck'), detail.voucher ? `${detail.voucher.voucher_no} · ${detail.voucher.status}` : m('noFee')],
                  ] as const
                ).map(([ok, title, sub]) => (
                  <div className="li st" key={title} data-check={ok ? 'ok' : 'no'}>
                    <i style={{ background: ok ? '#1fa34a22' : '#ef444422' }} aria-hidden>
                      {ok ? '✓' : '!'}
                    </i>
                    <div>
                      <b>{title}</b>
                      <small>{sub}</small>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          </>
        }
        issued={
          detail.doc ? (
            <>
              <BadgeCheck size={48} color="#1fa34a" aria-hidden />
              <p className="muted">{detail.doc.code}</p>
              <Link className="btn btn-primary" href={`/admin/review/letter?t=${detail.token}`} data-action="doc.view">
                <Eye size={16} aria-hidden /> {m('viewIssued')}
              </Link>
            </>
          ) : null
        }
      />
    </div>
  );
}
