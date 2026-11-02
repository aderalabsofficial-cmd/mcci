import { Download, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EntryActions, EntryForm, PrintButton, SetupForms } from '@/components/finance/forms';
import { Kpi } from '@/components/review/kpi';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { staffFileUrl } from '@/lib/files/urls';
import {
  loadBankLines,
  loadBreakdown,
  loadChart,
  loadClosedMonths,
  loadEntries,
  loadStatement,
  loadTrialBalance,
} from '@/lib/finance/load';
import {
  financialYearLabel,
  formatPaisa,
  PRESETS,
  presetRange,
  type Preset,
  type StatementSection,
} from '@/lib/finance/statement';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; preset?: string; from?: string; to?: string; verified?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.finance') };
}

export const dynamic = 'force-dynamic';

const TABS = ['statement', 'entries', 'trial', 'setup'] as const;
type Tab = (typeof TABS)[number];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const STATUS: Record<string, string> = { Recorded: 'orange', Verified: 'green', Voided: 'gray' };

/**
 * Accounts (owner's list of 1 Nov 2026 and MCCI's own statement; docs/31): the Profit & Loss statement for any period on
 * one click, the Trial Balance, receipts and expenses entered and verified by a second person, bank balances and month
 * closing. Membership and service fees come from vouchers Accounts have verified, so they are never typed twice.
 */
export default async function FinancePage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'fin', 'screens.admin.finance');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `fin.${k}`, v);
  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? '') ? (sp.tab as Tab) : 'statement';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const chart = await loadChart();
  const preset: Preset = (PRESETS as readonly string[]).includes(sp.preset ?? '') ? (sp.preset as Preset) : 'month';
  const auto = presetRange(preset === 'custom' ? 'month' : preset, today, chart.settings.yearStartMonth);
  const from = preset === 'custom' && DAY.test(sp.from ?? '') ? sp.from! : auto.from;
  const to = preset === 'custom' && DAY.test(sp.to ?? '') && sp.to! >= from ? sp.to! : auto.to;
  const verifiedOnly = sp.verified === '1';
  const q = (over: Record<string, string>) => {
    const p = new URLSearchParams({ tab, preset, ...(preset === 'custom' ? { from, to } : {}), ...(verifiedOnly ? { verified: '1' } : {}), ...over });
    return `/admin/finance?${p}`;
  };
  const statement = await loadStatement(chart, from, to, verifiedOnly);
  const banks = await loadBankLines(chart, to);
  const name = (x: { name_en: string; name_ur: string | null }) => (locale === 'ur' && x.name_ur ? x.name_ur : x.name_en);
  const monthLabel = (mo: string) =>
    new Date(`${mo}T00:00:00Z`).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const date = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const base = locale === 'ur' ? '/ur' : '';
  const exportHref = (report: 'pl' | 'tb') => `/api/finance/export?report=${report}&from=${from}&to=${to}${verifiedOnly ? '&verified=1' : ''}`;
  const showTotal = statement.months.length > 1;
  const cols = statement.months.length + (showTotal ? 1 : 0);

  const lines = (s: StatementSection, bracket: boolean, heading: boolean) => (
    <tbody key={s.code} data-group={s.code}>
      {heading && (
        <tr className="fin-group">
          <th scope="colgroup" colSpan={cols + 2}>
            ({s.code}) {name(s)}
          </th>
        </tr>
      )}
      {s.rows.map((r, i) => (
        <tr key={r.id} data-account={r.name_en}>
          <td className="fin-no">{i + 1}</td>
          <td>
            {name(r)}
            {r.auto && <small className="muted"> · {m('autoTag')}</small>}
          </td>
          {r.cells.map((c, x) => (
            <td key={x} className="fin-num">
              {formatPaisa(c, bracket && c !== 0)}
            </td>
          ))}
          {showTotal && <td className="fin-num">{formatPaisa(r.total, bracket && r.total !== 0)}</td>}
        </tr>
      ))}
    </tbody>
  );
  const head = (
    <thead>
      <tr>
        <th scope="col" className="fin-no">
          {m('st.no')}
        </th>
        <th scope="col">{m('st.description')}</th>
        {statement.months.map((mo) => (
          <th scope="col" key={mo} className="fin-num">
            {monthLabel(mo)}
          </th>
        ))}
        {showTotal && (
          <th scope="col" className="fin-num">
            {m('st.total')}
          </th>
        )}
      </tr>
    </thead>
  );
  const totalRow = (label: string, cells: number[], total: number, bracket: boolean, key: string) => (
    <tfoot>
      <tr className="fin-total" data-total={key}>
        <th scope="row" colSpan={2}>
          {label}
        </th>
        {cells.map((c, i) => (
          <td key={i} className="fin-num">
            {formatPaisa(c, bracket && c !== 0)}
          </td>
        ))}
        {showTotal && <td className="fin-num">{formatPaisa(total, bracket && total !== 0)}</td>}
      </tr>
    </tfoot>
  );

  let body = null;
  if (tab === 'statement') {
    const breakdown = await loadBreakdown(from, to);
    const cats = ['membership', 'renewal', 'restoration', 'extra_card'];
    const clsTotal = (cat: string, cls: string) => breakdown.filter((b) => b.category === cat && b.class === cls).reduce((s, b) => s + b.paisa, 0);
    body = (
      <div className="fin-sheet" data-sheet="statement">
        <header className="fin-head">
          <h2>{m('st.chamber')}</h2>
          <p>
            {m('st.heading', { year: financialYearLabel(from, chart.settings.yearStartMonth) })}
          </p>
          <p className="muted">
            {date(from)} – {date(to)}
            {verifiedOnly ? ` · ${m('verifiedOnly')}` : ''}
          </p>
        </header>
        <h3 className="fin-title">{m('st.receipts')}</h3>
        <div className="fin-scroll" tabIndex={0} role="region" data-scroll-x aria-label={m('st.receipts')}>
          <table className="fin-table" data-table="receipts">
            {head}
            {statement.receipts.map((s) => lines(s, false, false))}
            {totalRow(m('st.grossReceipts'), statement.receiptCells, statement.grossReceipts, false, 'receipts')}
          </table>
        </div>
        <h3 className="fin-title">{m('st.expense')}</h3>
        <div className="fin-scroll" tabIndex={0} role="region" data-scroll-x aria-label={m('st.expense')}>
          <table className="fin-table" data-table="expenses">
            {head}
            {statement.expenses.map((s) => lines(s, true, true))}
            {totalRow(m('st.grossExpense'), statement.expenseCells, statement.grossExpense, true, 'expense')}
          </table>
        </div>
        <dl className="fin-result" data-result={statement.result < 0 ? 'loss' : 'profit'}>
          <div>
            <dt>{m('st.grossReceipts')}</dt>
            <dd>{formatPaisa(statement.grossReceipts)}</dd>
          </div>
          <div>
            <dt>{m('st.lessExpense')}</dt>
            <dd>{formatPaisa(statement.grossExpense, statement.grossExpense !== 0)}</dd>
          </div>
          <div className="fin-bottom">
            <dt>{statement.result < 0 ? m('st.loss') : m('st.profit')}</dt>
            <dd>{formatPaisa(statement.result)}</dd>
          </div>
        </dl>
        <section className="fin-banks" data-section="fin-banks">
          <h3 className="fin-title">{m('st.banks', { d: date(to) })}</h3>
          <div className="fin-scroll" tabIndex={0} role="region" data-scroll-x aria-label={m('st.banksShort')}>
            <table className="fin-table">
              <thead>
                <tr>
                  <th scope="col">{m('st.bank')}</th>
                  <th scope="col" className="fin-num">
                    {m('st.books')}
                  </th>
                  <th scope="col" className="fin-num">
                    {m('st.bankStatement')}
                  </th>
                  <th scope="col" className="fin-num">
                    {m('st.difference')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {banks.map((b) => (
                  <tr key={b.id ?? 'cash'} data-bank={b.name}>
                    <td>{b.name}</td>
                    <td className="fin-num">{formatPaisa(b.closing)}</td>
                    <td className="fin-num">{b.statement === null ? m('st.notEntered') : formatPaisa(b.statement)}</td>
                    <td className={`fin-num ${b.difference ? 'fin-diff' : ''}`}>
                      {b.difference === null ? '' : formatPaisa(b.difference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="fin-breakdown" data-section="fin-breakdown">
          <h3 className="fin-title">{m('st.membershipBreakdown')}</h3>
          <div className="fin-scroll" tabIndex={0} role="region" data-scroll-x aria-label={m('st.membershipBreakdown')}>
            <table className="fin-table">
              <thead>
                <tr>
                  <th scope="col">{m('st.category')}</th>
                  <th scope="col" className="fin-num">
                    {msg(locale, 'membership.classes.Corporate')}
                  </th>
                  <th scope="col" className="fin-num">
                    {msg(locale, 'membership.classes.Associate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c} data-category={c}>
                    <td>{m(`cat.${c}`)}</td>
                    <td className="fin-num">{formatPaisa(clsTotal(c, 'Corporate'))}</td>
                    <td className="fin-num">{formatPaisa(clsTotal(c, 'Associate'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  } else if (tab === 'trial') {
    const tb = await loadTrialBalance(chart, statement, banks, from);
    const agree = tb.debit === tb.credit;
    body = (
      <div className="fin-sheet" data-sheet="trial">
        <header className="fin-head">
          <h2>{m('st.chamber')}</h2>
          <p>{m('tb.heading')}</p>
          <p className="muted">
            {date(from)} – {date(to)}
          </p>
        </header>
        <p className="muted no-print">{m('tb.note')}</p>
        <div className="fin-scroll" tabIndex={0} role="region" data-scroll-x aria-label={m('tb.heading')}>
          <table className="fin-table" data-table="trial">
            <thead>
              <tr>
                <th scope="col">{m('tb.account')}</th>
                <th scope="col" className="fin-num">
                  {m('tb.debit')}
                </th>
                <th scope="col" className="fin-num">
                  {m('tb.credit')}
                </th>
              </tr>
            </thead>
            <tbody>
              {tb.lines.map((l) => (
                <tr key={l.key} data-line={l.name_en}>
                  <td>{name(l)}</td>
                  <td className="fin-num">{l.debit ? formatPaisa(l.debit) : ''}</td>
                  <td className="fin-num">{l.credit ? formatPaisa(l.credit) : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="fin-total" data-total="trial">
                <th scope="row">{m('tb.total')}</th>
                <td className="fin-num">{formatPaisa(tb.debit)}</td>
                <td className="fin-num">{formatPaisa(tb.credit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className={`banner ${agree ? 'green' : 'red'}`} data-trial-agrees={agree} data-wa-status={agree ? 'ok' : undefined}>
          {agree ? m('tb.agrees') : m('tb.differs', { d: formatPaisa(tb.debit - tb.credit) })}
        </p>
      </div>
    );
  } else if (tab === 'entries') {
    const entries = await loadEntries(from, to);
    const acc = new Map(chart.accounts.map((a) => [a.id, a]));
    const groupOf = new Map(chart.groups.map((x) => [x.code, x]));
    const bankName = new Map(chart.banks.map((b) => [b.id, b.name]));
    body = (
      <>
        {g.level >= 2 && (
          <EntryForm
            locale={locale}
            groups={chart.groups}
            accounts={chart.accounts}
            banks={chart.banks.map((b) => ({ id: b.id, name: b.name, is_default: b.is_default }))}
            today={today}
          />
        )}
        <section className="card" data-section="fin-entries">
          <div className="ch">
            <h3>{m('entry.list')}</h3>
          </div>
          {entries.length ? (
            <div className="tw" tabIndex={0} role="region" aria-label={m('entry.list')}>
              <table>
                <thead>
                  <tr>
                    {(['no', 'date', 'account', 'party', 'bank', 'amount', 'status'] as const).map((c) => (
                      <th key={c} scope="col" className={c === 'amount' ? 'fin-num' : undefined}>
                        {m(`entry.cols.${c}`)}
                      </th>
                    ))}
                    {g.level >= 3 && <th scope="col">{m('entry.cols.actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const a = acc.get(e.account_id);
                    const expense = a ? groupOf.get(a.group_code)?.kind === 'expense' : false;
                    const own = e.created_by === session.userId;
                    return (
                      <tr className="st" key={e.id} data-entry={e.entry_no} data-status={e.status}>
                        <td>
                          <b>{e.entry_no}</b>
                          {e.attachment_path && (
                            <a
                              className="fin-file"
                              href={staffFileUrl('finance-docs', e.attachment_path)}
                              target="_blank"
                              rel="noreferrer"
                              data-action="fin.entry.file"
                              aria-label={m('entry.viewFile', { no: e.entry_no })}
                            >
                              <ExternalLink size={14} aria-hidden />
                            </a>
                          )}
                        </td>
                        <td>{date(e.on_date)}</td>
                        <td>
                          {a ? name(a) : '—'}
                          {e.note && <small className="muted block">{e.note}</small>}
                          {e.void_reason && <small className="muted block">{m('entry.voidedBecause', { r: e.void_reason })}</small>}
                        </td>
                        <td>
                          {e.party ?? '—'}
                          {e.reference && <small className="muted block">{e.reference}</small>}
                        </td>
                        <td>{e.bank_id ? (bankName.get(e.bank_id) ?? '—') : m('entry.cash')}</td>
                        <td className="fin-num">{formatPaisa(e.amount_paisa, expense)}</td>
                        <td>
                          <span className={`bd ${STATUS[e.status] ?? 'gray'}`}>{m(`entry.status.${e.status}`)}</span>
                        </td>
                        {g.level >= 3 && (
                          <td>
                            {e.status !== 'Voided' && (
                              <EntryActions
                                locale={locale}
                                id={e.id}
                                no={e.entry_no}
                                canVerify={e.status === 'Recorded' && !own}
                                canVoid
                              />
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="em">{m('entry.none')}</p>
          )}
        </section>
      </>
    );
  } else {
    body =
      g.level >= 2 ? (
        <SetupForms
          locale={locale}
          groups={chart.groups}
          banks={chart.banks.map((b) => ({ id: b.id, name: b.name }))}
          openingOn={chart.settings.openingOn}
          thisMonth={today.slice(0, 7)}
          closed={await loadClosedMonths()}
          level={g.level}
        />
      ) : (
        <p className="em">{m('setup.viewOnly')}</p>
      );
  }

  return (
    <div className="proto">
      <div className="ph no-print">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        {(tab === 'statement' || tab === 'trial') && (
          <div className="pb">
            <PrintButton label={m('print')} />
            <a className="btn" href={exportHref(tab === 'trial' ? 'tb' : 'pl')} download data-action="fin.export">
              <Download size={15} aria-hidden /> {m('export')}
            </a>
          </div>
        )}
      </div>
      <div className="kg no-print">
        <Kpi label={m('st.grossReceipts')} value={formatPaisa(statement.grossReceipts)} icon="card" color="#1fa34a" />
        <Kpi label={m('st.grossExpense')} value={formatPaisa(statement.grossExpense, statement.grossExpense !== 0)} icon="list" color="#ef4444" />
        <Kpi label={statement.result < 0 ? m('st.loss') : m('st.profit')} value={formatPaisa(statement.result)} icon="chart" color="#3b82f6" />
      </div>
      <nav className="pills no-print" aria-label={m('tabsLabel')}>
        {TABS.map((t) => (
          <Link key={t} href={q({ tab: t })} className={`pill ${tab === t ? 'on' : ''}`} aria-current={tab === t ? 'page' : undefined} data-action="fin.tab" data-tab={t}>
            {m(`tabs.${t}`)}
          </Link>
        ))}
      </nav>
      {tab !== 'setup' && (
        <div className="card fin-range no-print">
          <nav className="pills" aria-label={m('rangeLabel')}>
            {PRESETS.filter((p) => p !== 'custom').map((p) => (
              <Link key={p} href={q({ preset: p })} className={`pill ${preset === p ? 'on' : ''}`} aria-current={preset === p ? 'true' : undefined} data-action="fin.preset" data-preset={p}>
                {m(`presets.${p}`)}
              </Link>
            ))}
          </nav>
          <form method="get" action={`${base}/admin/finance`} className="rep-filter">
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="preset" value="custom" />
            <label className="form-field">
              {m('from')}
              <input type="date" name="from" defaultValue={from} data-field="fin-from" />
            </label>
            <label className="form-field">
              {m('to')}
              <input type="date" name="to" defaultValue={to} data-field="fin-to" />
            </label>
            <label className="biz-check">
              <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} data-field="fin-verified" />
              {m('verifiedOnly')}
            </label>
            <button type="submit" className="btn p" data-action="fin.range.apply">
              {m('apply')}
            </button>
          </form>
        </div>
      )}
      {body}
    </div>
  );
}
