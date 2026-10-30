import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadReport } from '@/lib/reports/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ from?: string; to?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.reports') };
}

export const dynamic = 'force-dynamic';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Reports (prototype admin/reports): aggregate operational figures for a date range, with an aggregate CSV */
export default async function ReportsPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'rep', 'screens.admin.reports');
  if (g.denied) return g.denied;
  const sp = await searchParams;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const from = sp.from && DAY.test(sp.from) ? sp.from : yearStart;
  const to = sp.to && DAY.test(sp.to) && sp.to >= from ? sp.to : today;
  const r = await loadReport(from, to);
  const m = (k: string) => msg(locale, `reports.${k}`);
  const label = (section: string, l: string) => {
    try {
      return msg(locale, `reports.items.${l}`);
    } catch {
      return l;
    }
  };
  const base = locale === 'ur' ? '/ur' : '';
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        <div className="pb">
          <a className="btn" href={`/api/reports?from=${from}&to=${to}`} data-action="rep.csv" download>
            <Download size={16} aria-hidden /> {m('csv')}
          </a>
        </div>
      </div>
      <form method="get" action={`${base}/admin/reports`} className="card rep-filter">
        <label className="form-field">
          {m('from')}
          <input type="date" name="from" defaultValue={from} max={today} />
        </label>
        <label className="form-field">
          {m('to')}
          <input type="date" name="to" defaultValue={to} max={today} />
        </label>
        <button type="submit" className="btn p" data-action="rep.apply">
          {m('apply')}
        </button>
      </form>
      <p className="muted" style={{ margin: '8px 0 16px' }}>
        {m('note')}
      </p>
      <div className="gr rep-grid">
        {r.sections.map((s) => (
          <section key={s.key} className="card" aria-labelledby={`rep-${s.key}`} data-report={s.key}>
            <div className="ch">
              <h3 id={`rep-${s.key}`}>{m(`sections.${s.key}`)}</h3>
            </div>
            <table className="rep-table">
              <tbody>
                {s.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{label(s.key, row.label)}</th>
                    <td>{row.value.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
