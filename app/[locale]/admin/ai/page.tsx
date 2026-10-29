import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Kpi } from '@/components/review/kpi';
import { guardStaff } from '@/components/services/staff-page';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'aiInsights.title') };
}

export const dynamic = 'force-dynamic';

const docLabel = (locale: 'en' | 'ur', key: string) => {
  try {
    return msg(locale, `membership.docs.${key}`);
  } catch {
    return key;
  }
};

/**
 * AI Insights (prototype admin/ai; Reports & AI): how the AI document reading performs over the last 30 days —
 * readings, how many finished, which documents — and the certificate-scan readings, with the guardrails that always
 * apply. Reports ≥ 1 (ai_extractions are readable with Reports or Membership ≥ 1; certificate scans with
 * Certificates ≥ 1 — a part the person may not read is simply left out). Counts only: no applicant's data is shown.
 */
export default async function AiInsightsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'rep', 'aiInsights.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `aiInsights.${k}`, v);
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const supabase = await createClient();
  const [{ data: reads }, scans] = await Promise.all([
    supabase.from('ai_extractions').select('doc_key, status, model, fields').gte('created_at', since).limit(5000),
    staffLevel(session.access, 'temp') >= 1
      ? supabase.from('certificate_scans').select('status, conflicts').gte('created_at', since).limit(5000)
      : Promise.resolve({ data: null }),
  ]);
  const rows = reads ?? [];
  const done = rows.filter((r) => r.status === 'done');
  const failed = rows.filter((r) => r.status === 'failed').length;
  const fieldsRead = done.reduce((n, r) => n + Object.keys((r.fields ?? {}) as object).length, 0);
  const byDoc = [
    ...rows.reduce((acc, r) => acc.set(r.doc_key, (acc.get(r.doc_key) ?? 0) + 1), new Map<string, number>()),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const models = [...new Set(rows.map((r) => r.model).filter(Boolean))];
  const scanRows = scans.data;
  const withConflicts = (scanRows ?? []).filter((s) => Array.isArray(s.conflicts) && s.conflicts.length > 0).length;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <div className="kg">
        <Kpi label={m('kReads')} value={rows.length} sub={m('last30')} icon="sparkles" color="#c8963e" />
        <Kpi
          label={m('kDone')}
          value={pct(done.length, rows.length)}
          sub={m('kDoneSub', { n: String(failed) })}
          icon="check"
          color="#1fa34a"
        />
        <Kpi
          label={m('kFields')}
          value={done.length ? Math.round(fieldsRead / done.length) : 0}
          sub={m('kFieldsSub')}
          icon="list"
          color="#3b82f6"
        />
        {scanRows && (
          <Kpi
            label={m('kScans')}
            value={scanRows.length}
            sub={m('kScansSub', { n: String(withConflicts) })}
            icon="scan"
            color="#7c3aed"
          />
        )}
      </div>
      <div className="gr" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
        <section className="card" aria-labelledby="ai-docs">
          <div className="ch">
            <h3 id="ai-docs">{m('byDoc')}</h3>
          </div>
          {byDoc.length ? (
            byDoc.map(([key, n]) => (
              <div className="li st" key={key} data-doc-key={key}>
                <div style={{ flex: 1 }}>
                  <b>{docLabel(locale, key)}</b>
                </div>
                <span className="bd gray">{n}</span>
              </div>
            ))
          ) : (
            <p className="em">{m('none')}</p>
          )}
          {models.length > 0 && (
            <p className="muted" style={{ marginTop: 10 }}>
              {m('model', { m: models.join(', ') })}
            </p>
          )}
        </section>
        <section className="card" aria-labelledby="ai-guard">
          <div className="ch">
            <h3 id="ai-guard">{m('guardrails')}</h3>
          </div>
          <ul className="ai-guard">
            {(['g1', 'g2', 'g3', 'g4', 'g5'] as const).map((k) => (
              <li key={k}>{m(k)}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
