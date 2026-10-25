import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrintButton } from '@/components/membership/print-button';
import { ReceiptUpload } from '@/components/payments/receipt-upload';
import { both, Ic, KV, L } from '@/components/membership/ui';
import { asLocale } from '@/i18n/locale';
import { bankDetails, lineKey, pkr, type VoucherLine, voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.payments') };
}

export const dynamic = 'force-dynamic';

/**
 * Payments (prototype member/payments): the payment voucher issued after the committee's approval — number, amount,
 * lines, due date and the bank account once MCCI has confirmed it — with "Print voucher". Vouchers are read with the
 * member's session (RLS: own company, payments access); the bank details come from api.voucher_view.
 * Receipt upload and Accounts verification are the next release (docs/05 M6).
 */
export default async function PaymentsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.pay.${k}`, v);
  const supabase = await createClient();
  const { data: vouchers } = await supabase
    .from('payment_vouchers')
    .select('id, voucher_no, company_id, ref_type, amount, lines, status, due_at, paid_at, created_at, reject_reason')
    .order('created_at', { ascending: false });
  const all = vouchers ?? [];
  const due = all.filter((v) => v.status === 'Unpaid' || v.status === 'Receipt uploaded' || v.status === 'Rejected');
  const paid = all.filter((v) => v.status === 'Paid');
  const { data: view } = due[0]
    ? await supabase.schema('api').rpc('voucher_view', { p_voucher: due[0].voucher_no })
    : { data: null };
  const bank = bankDetails((view?.[0]?.bank ?? null) as Record<string, unknown> | null);
  const { data: receipts } = due.length
    ? await supabase.from('payment_receipts').select('voucher_id, uploaded_at, status').in('voucher_id', due.map((v) => v.id)).order('uploaded_at', { ascending: false })
    : { data: [] as { voucher_id: string; uploaded_at: string; status: string }[] };
  // Owner, Manager and Accounts users (company area pay ≥ 2) upload receipts
  const canPay = (company: string) => (session.access.companies.find((c) => c.id === company)?.levels.pay ?? 0) >= 2;
  const stepsDone = (status: string) => (status === 'Receipt uploaded' ? 3 : 1);
  const steps: [string, string][] = [
    ['file', 'committee.pay.steps.voucher'],
    ['landmark', 'committee.pay.steps.bank'],
    ['upload', 'committee.pay.steps.upload'],
    ['check', 'committee.pay.steps.verify'],
  ];

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('committee.pay.title')} />
          </h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      {due.length ? (
        due.map((v) => {
          const lines = (Array.isArray(v.lines) ? v.lines : []) as unknown as VoucherLine[];
          return (
            <section className="card psid" key={v.voucher_no} aria-labelledby={`v-${v.voucher_no}`} style={{ marginBottom: 18 }}>
              <div className="ch">
                <h3 id={`v-${v.voucher_no}`}>{m(`purpose.${v.ref_type}`)}</h3>
                <span className="bd orange">{m(`status.${v.status}`)}</span>
              </div>
              <div className="psn">{v.voucher_no}</div>
              <KV
                pairs={[
                  [m('amount'), pkr(v.amount)],
                  [m('payBefore'), voucherDate(v.due_at, locale)],
                  [m('bank'), bank ? bank.bank : m('bankPending')],
                  [m('accountTitle'), bank ? bank.title : '—'],
                  [m('iban'), bank ? bank.iban : '—'],
                  [m('branch'), bank ? bank.branch : '—'],
                ]}
              />
              <div className="tw" style={{ marginTop: 14 }}>
                <table>
                  <caption className="sr-only">{m('linesCaption')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{m('item')}</th>
                      <th scope="col">{m('amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => {
                      const k = lineKey(l);
                      return (
                        <tr className="st" key={i}>
                          <td>{k ? m(`lines.${k}`, { n: String(l.qty ?? '') }) : l.label}</td>
                          <td>{pkr(l.amount)}</td>
                        </tr>
                      );
                    })}
                    <tr className="st">
                      <td>
                        <b>{m('total')}</b>
                      </td>
                      <td>
                        <b>{pkr(v.amount)}</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {v.status === 'Rejected' && (
                <p className="note-i" role="alert" style={{ marginTop: 12, color: '#b91c1c' }}>
                  <b>{m('rejectedNote')}</b> {v.reject_reason}
                </p>
              )}
              {v.status === 'Receipt uploaded' && (
                <p className="note-i" role="status" style={{ marginTop: 12 }}>
                  <Ic name="clock" size={14} color="#f59e0b" />{' '}
                  {m('uploadedNote', {
                    when: voucherDate(receipts?.find((r) => r.voucher_id === v.id)?.uploaded_at ?? v.created_at, locale),
                  })}
                </p>
              )}
              {!bank && (
                <p className="note-i" role="note" style={{ marginTop: 12 }}>
                  <Ic name="clock" size={14} color="#f59e0b" /> {m('bankPendingHelp')}
                </p>
              )}
              <div className="paysteps">
                {steps.map(([icon, key], i) => (
                  <div key={key} className={i < stepsDone(v.status) ? 'd' : ''}>
                    <i>
                      <Ic name={icon} />
                    </i>
                    <b>{msg('en', key)}</b>
                    <span lang="ur">{msg('ur', key)}</span>
                  </div>
                ))}
              </div>
              <p className="muted" style={{ marginTop: 12 }}>
                {m('after')}
              </p>
              {bank && (v.status === 'Unpaid' || v.status === 'Rejected') && canPay(v.company_id) && (
                <div className="no-print">
                  <ReceiptUpload locale={locale} voucher={v.voucher_no} again={v.status === 'Rejected'} />
                </div>
              )}
              <div className="pb no-print" style={{ marginTop: 14 }}>
                <PrintButton label={m('print')} />
              </div>
            </section>
          );
        })
      ) : (
        <div className="card">
          <p className="em">
            <Ic name="check" color="#1fa34a" /> {m('nothing')}
          </p>
        </div>
      )}
      <div className="card">
        <div className="ch">
          <h3>{m('history')}</h3>
        </div>
        {paid.length ? (
          <div className="tw" tabIndex={0} role="region" aria-label={m('history')}>
            <table>
              <thead>
                <tr>
                  {(['voucher', 'for', 'amount', 'paidOn'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paid.map((v) => (
                  <tr className="st" key={v.voucher_no}>
                    <td>{v.voucher_no}</td>
                    <td>{m(`purpose.${v.ref_type}`)}</td>
                    <td>{pkr(v.amount)}</td>
                    <td>{v.paid_at ? voucherDate(v.paid_at, locale) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="em">{m('noHistory')}</p>
        )}
      </div>
    </div>
  );
}
