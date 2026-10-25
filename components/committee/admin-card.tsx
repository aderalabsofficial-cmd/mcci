import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import type { AppCommittee } from '@/lib/committee/load';
import { pkr, voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';

const TONE: Record<string, string> = { Approved: 'green', Deferred: 'orange', Rejected: 'red' };

/** Application Review: the committee's record of this file — agenda items, decisions, number and voucher */
export function CommitteeAdminCard({ locale, data, canOpenDesk }: { locale: Locale; data: AppCommittee; canOpenDesk: boolean }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.card.${k}`, v);
  const day = (d: string | null) => (d ? voucherDate(`${d}T12:00:00+05:00`, locale) : '—');
  return (
    <>
      {data.items.length ? (
        data.items.map((i) => (
          <div className="tg" key={i.meeting}>
            <span>
              <b>
                {i.name} ({i.meeting}){i.item ? ` · ${m('item', { n: String(i.item) })}` : ''}
              </b>
              <small style={{ display: 'block' }}>
                {day(i.held_on)}
                {i.note ? ` · ${i.note}` : ''}
              </small>
            </span>
            <span className={`bd ${i.decision ? TONE[i.decision] : 'blue'}`}>{m(`decision.${i.decision ?? 'open'}`)}</span>
          </div>
        ))
      ) : (
        <p className="muted">{m('none')}</p>
      )}
      {data.member_no && (
        <p style={{ marginTop: 10 }}>
          {m('number')}: <b>{data.member_no}</b>
        </p>
      )}
      {data.voucher && (
        <p>
          {m('voucher', {
            no: data.voucher.no,
            amount: pkr(data.voucher.amount),
            due: voucherDate(data.voucher.due_at, locale),
            status: msg(locale, `committee.pay.status.${data.voucher.status}`),
          })}
        </p>
      )}
      {canOpenDesk && (
        <div className="pb" style={{ marginTop: 10 }}>
          <Link className="btn btn-w" href="/admin/committee" data-action="nav">
            {m('openDesk')}
          </Link>
        </div>
      )}
    </>
  );
}
