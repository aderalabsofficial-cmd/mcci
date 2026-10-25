import { ActionButton } from '@/components/admin/action-button';
import type { Locale } from '@/i18n/routing';
import { pkr, voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import type { StaffVoucher } from '@/lib/payments/load';

const TONE: Record<string, string> = {
  Unpaid: 'blue',
  'Receipt uploaded': 'orange',
  Paid: 'green',
  Rejected: 'red',
  Cancelled: 'gray',
  Expired: 'red',
};

/** All vouchers (prototype admin/payments "All vouchers", admin/psid "Vouchers") with the actions each status allows */
export function VoucherTable({
  locale,
  rows,
  title,
  canAct,
  dateCol,
}: {
  locale: Locale;
  rows: StaffVoucher[];
  title: string;
  canAct: boolean;
  dateCol: 'paid' | 'due';
}) {
  const m = (k: string) => msg(locale, `pay.${k}`);
  return (
    <div className="card">
      <div className="ch">
        <h3>{title}</h3>
      </div>
      <div className="tw" tabIndex={0} role="region" aria-label={title}>
        <table>
          <thead>
            <tr>
              {(['voucher', 'member', 'purpose', 'amount', dateCol === 'paid' ? 'verified' : 'due', 'status'] as const).map((c) => (
                <th key={c} scope="col">
                  {m(`cols.${c}`)}
                </th>
              ))}
              {canAct && <th scope="col">{m('cols.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr className="st" key={v.no} data-voucher={v.no}>
                <td>
                  <b>{v.no}</b>
                  {v.token && (
                    <>
                      <br />
                      <small className="muted">{v.token}</small>
                    </>
                  )}
                </td>
                <td>{v.company}</td>
                <td>{msg(locale, `committee.pay.purpose.${v.ref_type}`)}</td>
                <td>{pkr(v.amount)}</td>
                <td>{dateCol === 'paid' ? (v.paid_at ? voucherDate(v.paid_at, locale) : '—') : voucherDate(v.due_at, locale)}</td>
                <td>
                  <span className={`bd ${TONE[v.status] ?? 'gray'}`}>{msg(locale, `committee.pay.status.${v.status}`)}</span>
                </td>
                {canAct && (
                  <td>
                    <div className="pb">
                      {v.status === 'Receipt uploaded' && (
                        <>
                          <ActionButton locale={locale} action="pay.verify" target={v.no} subject={v.no} className="btn btn-w btn-primary" />
                          <ActionButton locale={locale} action="pay.reject" target={v.no} subject={v.no} />
                        </>
                      )}
                      {(v.status === 'Unpaid' || v.status === 'Rejected' || v.status === 'Receipt uploaded') && (
                        <ActionButton locale={locale} action="psid.markpaid" target={v.no} subject={v.no} />
                      )}
                      {(v.status === 'Unpaid' || v.status === 'Rejected') && (
                        <ActionButton locale={locale} action="psid.cancel" target={v.no} subject={v.no} />
                      )}
                      {(v.status === 'Expired' || v.status === 'Cancelled') && v.ref_type === 'membership' && (
                        <ActionButton locale={locale} action="psid.gen" target={v.no} subject={v.no} />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr className="st">
                <td colSpan={canAct ? 7 : 6} className="em">
                  {m('noVouchers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
