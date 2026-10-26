import { FileText, MessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';
import { StoredNote } from '@/components/services/stored-note';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { type SvcDetail, timeLeft } from '@/lib/services/load';
import { SVC_TONE } from '@/lib/services/reference';

const HIST = ['submitted', 'review started', 'returned', 'resubmitted', 'approved for signature', 'fee paid', 'signed and issued', 'rejected', 'cancelled'];

const when = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * One service request, as the member (prototype member/application) and staff (admin/review) see it: progress, the
 * SLA countdown or the issued document, documents, messages and the full timeline. Buttons come from the page.
 */
export function RequestView({
  locale,
  detail,
  serviceName,
  hours,
  audience,
  actions,
  issued,
  aside,
}: {
  locale: Locale;
  detail: SvcDetail;
  serviceName: string;
  hours: number;
  audience: 'member' | 'staff';
  actions?: ReactNode;
  issued?: ReactNode;
  aside?: ReactNode;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.detail.${k}`, v);
  const order = ['Submitted', 'In review', 'Ready to sign', 'Issued'];
  const i = detail.status === 'Returned' ? 1 : order.indexOf(detail.status);
  const state = (n: number) => (i > n ? 'd' : i === n ? 'n' : '');
  const t = timeLeft(detail.sla_due_at);
  const open = !['Issued', 'Rejected', 'Cancelled'].includes(detail.status);
  const steps: [string, string, string][] = [
    [m('t.submitted'), when(detail.submitted_at, locale), 'd'],
    [m('t.ai'), m('t.aiSub'), 'd'],
    [m('t.review'), detail.status === 'Returned' ? m('t.returned', { note: detail.return_note ?? '' }) : m('t.reviewSub'), state(1)],
    [m('t.sign'), m('t.signSub'), state(2)],
    [m('t.issued'), m('t.issuedSub'), i >= 3 ? 'd' : ''],
  ];
  return (
    <div data-request={detail.token} data-status={detail.status}>
      <div className="ph">
        <div>
          <h1>
            {serviceName} · {detail.token}
          </h1>
          <p>
            {m('sub', { company: detail.company, date: voucherDate(detail.submitted_at, locale) })}{' '}
            <span className={`bd ${SVC_TONE[detail.status] ?? 'gray'}`}>{msg(locale, `svc.status.${detail.status}`)}</span>
          </p>
        </div>
      </div>
      <StoredNote />
      {detail.status === 'Returned' && detail.return_note && (
        <p className="banner orange" role="status" style={{ marginBottom: 14 }}>
          {m('returnedBanner', { note: detail.return_note })}
        </p>
      )}
      {detail.status === 'Rejected' && (
        <p className="banner red" role="status" style={{ marginBottom: 14 }}>
          {m('rejected', { reason: detail.reject_reason ?? '' })}
        </p>
      )}
      {detail.voucher && (
        <p className="muted" style={{ marginBottom: 10 }} data-voucher={detail.voucher.status}>
          {m('payVoucher', { voucher: detail.voucher.voucher_no, amount: detail.voucher.amount.toLocaleString('en-US'), status: detail.voucher.status })}
          {audience === 'member' && detail.voucher.status !== 'Paid' && detail.voucher.status !== 'Cancelled' && (
            <>
              {' · '}
              <Link href="/portal/payments" data-action="nav">
                {m('openPayments')}
              </Link>
            </>
          )}
        </p>
      )}
      {actions}
      {aside}
      <div className="gr" style={{ gridTemplateColumns: '1.2fr 1fr', marginTop: 16 }}>
        <section className="card" aria-labelledby="pg-h">
          <div className="ch">
            <h3 id="pg-h">{m('progress')}</h3>
          </div>
          <ul className="tl">
            {steps.map(([a, b, c]) => (
              <li key={a} className={c}>
                <i aria-hidden>{c === 'd' ? '✓' : ''}</i>
                <div>
                  <b>{a}</b>
                  <small style={{ display: 'block' }}>{b}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card" style={{ textAlign: 'center' }} aria-label={m('progress')}>
          {detail.status === 'Issued' ? (
            <>
              <h3>{m('issuedOn', { date: detail.issued_at ? voucherDate(detail.issued_at, locale) : '' })}</h3>
              {issued}
            </>
          ) : open ? (
            <>
              <div className="cdw" data-overdue={t.overdue || undefined}>
                {t.overdue ? msg(locale, 'svc.list.breached') : `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}`}
              </div>
              <small className="muted">{msg(locale, 'svc.review.kTimeSub', { hours: String(hours) })}</small>
              <p style={{ marginTop: 8 }}>
                <span className={`bd ${SVC_TONE[detail.status] ?? 'gray'}`}>{msg(locale, `svc.status.${detail.status}`)}</span>
              </p>
            </>
          ) : (
            <span className={`bd ${SVC_TONE[detail.status] ?? 'gray'}`}>{msg(locale, `svc.status.${detail.status}`)}</span>
          )}
        </section>
      </div>
      <div className="gr" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <section className="card" aria-labelledby="dc-h">
          <div className="ch">
            <h3 id="dc-h">{m('documents')}</h3>
          </div>
          {detail.docs.map((d) => (
            <div className="li st" key={d.id}>
              <i style={{ background: '#3b82f622' }} aria-hidden>
                <FileText size={18} color="#3b82f6" />
              </i>
              <div style={{ flex: 1 }}>
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noopener noreferrer" data-action="doc.view">
                    <b>{d.file_name}</b>
                  </a>
                ) : (
                  <b>{d.file_name}</b>
                )}
                <small>{when(d.created_at, locale)}</small>
              </div>
            </div>
          ))}
        </section>
        <section className="card" aria-labelledby="ms-h">
          <div className="ch">
            <h3 id="ms-h">{m('messages')}</h3>
          </div>
          {detail.messages.length ? (
            detail.messages.map((x) => (
              <div className="li st" key={x.id} data-message={x.id}>
                <i style={{ background: '#14b8a622' }} aria-hidden>
                  <MessageSquare size={18} color="#14b8a6" />
                </i>
                <div>
                  <b>{x.mine ? msg(locale, 'svc.detail.you') : audience === 'member' ? 'MCCI' : detail.company}</b>
                  <small style={{ whiteSpace: 'pre-wrap' }}>{x.body}</small>
                  <small>{when(x.at, locale)}</small>
                </div>
              </div>
            ))
          ) : (
            <p className="em">{m('noMessages')}</p>
          )}
        </section>
      </div>
      <section className="card" aria-labelledby="hs-h">
        <div className="ch">
          <h3 id="hs-h">{m('history')}</h3>
        </div>
        <ul className="tl">
          {[...detail.history].reverse().map((h, n) => (
            <li key={n} className="d">
              <i aria-hidden>✓</i>
              <div>
                <b>{HIST.includes(h.step) ? msg(locale, `svc.hist.${h.step}`) : h.step}</b>
                <small style={{ display: 'block' }}>
                  {m('by', { who: h.by_name ?? '—', date: when(h.at, locale) })}
                  {h.note ? ` — ${h.note}` : ''}
                </small>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
