import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ExternalLink, Receipt } from 'lucide-react';
import { ActionButton } from '@/components/admin/action-button';
import { FlashProvider } from '@/components/admin/flash';
import { NoAccess } from '@/components/admin/no-access';
import { BankCard } from '@/components/payments/bank-card';
import { VoucherTable } from '@/components/payments/voucher-table';
import { Kpi } from '@/components/review/kpi';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { pkr, voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { loadBank, loadVouchers } from '@/lib/payments/load';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ class?: string; category?: string }> };

const CLASSES = ['all', 'Corporate', 'Associate'] as const;
const CATEGORIES = ['all', 'membership', 'renewal', 'restoration', 'service', 'extra_card'] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'pay.admin.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Payments (prototype admin/payments): receipts to verify, collections, MCCI's bank account and all vouchers.
 * Staff with module 'pay' ≥ 1 read; Accounts (pay ≥ 2) verify, reject and record counter payments (docs/06).
 */
export default async function PaymentsAdminPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'pay');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `pay.admin.${k}`, v);
  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'pay.admin.title'), ur: msg('ur', 'pay.admin.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="pay" />
      </>
    );
  }
  const sp = await searchParams;
  const cls = (CLASSES as readonly string[]).includes(sp.class ?? '') ? (sp.class as (typeof CLASSES)[number]) : 'all';
  const category = (CATEGORIES as readonly string[]).includes(sp.category ?? '') ? (sp.category as (typeof CATEGORIES)[number]) : 'all';
  const [allRows, bank] = await Promise.all([loadVouchers(), loadBank()]);
  const rows = allRows.filter((v) => (cls === 'all' || v.member_class === cls) && (category === 'all' || v.ref_type === category));
  const href = (over: { class?: string; category?: string }) =>
    `/admin/payments?${new URLSearchParams({ class: over.class ?? cls, category: over.category ?? category })}`;
  const paidOf = (r: (typeof allRows)[number]) => r.status === 'Paid' && (cls === 'all' || r.member_class === cls);
  const paid = rows.filter((v) => v.status === 'Paid');
  const waiting = rows.filter((v) => v.status === 'Receipt uploaded');
  const sum = (list: typeof rows) => list.reduce((s, v) => s + v.amount, 0);

  return (
    <div className="proto">
      <FlashProvider>
        <div className="ph">
          <div>
            <h1>{m('title')}</h1>
            <p>{m('sub')}</p>
          </div>
          <div className="pb">
            <Link className="btn" href="/admin/psid" data-action="nav">
              <Receipt size={16} aria-hidden /> {m('vouchersLink')}
            </Link>
          </div>
        </div>
        <div className="kg">
          <Kpi label={m('kReceipts')} value={waiting.length} sub={m('kReceiptsSub')} icon="upload" color="#f59e0b" />
          <Kpi label={m('kCollected')} value={pkr(sum(paid))} sub={m('kCollectedSub', { n: String(paid.length) })} icon="card" color="#1fa34a" />
          <Kpi label={m('kUnpaid')} value={rows.filter((v) => v.status === 'Unpaid').length} icon="clock" color="#3b82f6" />
          <Kpi label={m('kMembership')} value={pkr(sum(paid.filter((v) => v.ref_type === 'membership')))} icon="award" color="#0e7490" />
        </div>
        <section className="card" data-section="pay-filters" aria-label={m('filtersLabel')}>
          <nav className="pills" aria-label={m('classLabel')}>
            {CLASSES.map((c) => (
              <Link key={c} href={href({ class: c })} className={`pill ${cls === c ? 'on' : ''}`} aria-current={cls === c ? 'true' : undefined} data-action="pay.class" data-class={c}>
                {c === 'all' ? m('allClasses') : msg(locale, `membership.classes.${c}`)}
              </Link>
            ))}
          </nav>
          <nav className="pills" aria-label={m('categoryLabel')}>
            {CATEGORIES.map((c) => (
              <Link key={c} href={href({ category: c })} className={`pill ${category === c ? 'on' : ''}`} aria-current={category === c ? 'true' : undefined} data-action="pay.category" data-category={c}>
                {m(`categories.${c}`)}
                {c !== 'all' && ` · ${pkr(sum(allRows.filter((v) => paidOf(v) && v.ref_type === c)))}`}
              </Link>
            ))}
          </nav>
        </section>
        <div style={{ marginBottom: 18 }}>
          <BankCard locale={locale} bank={bank} canEdit={staffLevel(session.access, 'plat') >= 2} />
        </div>
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="ch">
            <h3>{m('queue')}</h3>
          </div>
          {waiting.length ? (
            waiting.map((v) => {
              const r = v.receipts.find((x) => x.status === 'Submitted');
              return (
                <div className="agenda" key={v.no} data-voucher={v.no}>
                  <div>
                    <b>
                      {v.company} · {pkr(v.amount)}
                    </b>
                    <small>
                      {v.no} · {msg(locale, `committee.pay.purpose.${v.ref_type}`)}
                      {r ? ` · ${m('uploaded', { when: voucherDate(r.uploaded_at, locale) })}` : ''}
                      {r?.bank_ref ? ` · ${m('bankRef', { ref: r.bank_ref })}` : ''}
                    </small>
                  </div>
                  <div className="pb">
                    {r?.url && (
                      <a className="btn btn-w" href={r.url} target="_blank" rel="noopener noreferrer" data-action="psid.view">
                        <ExternalLink size={16} aria-hidden /> {m('viewReceipt')}
                      </a>
                    )}
                    {level >= 2 && (
                      <>
                        <ActionButton locale={locale} action="pay.verify" target={v.no} subject={`${v.no} · ${v.company}`} className="btn btn-w btn-primary" />
                        <ActionButton locale={locale} action="pay.reject" target={v.no} subject={`${v.no} · ${v.company}`} />
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="em">{m('queueEmpty')}</p>
          )}
        </div>
        <VoucherTable locale={locale} rows={rows} title={m('all')} canAct={false} dateCol="paid" />
      </FlashProvider>
    </div>
  );
}
