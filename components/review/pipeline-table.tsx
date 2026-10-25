'use client';

import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

export interface PipelineTableRow {
  token: string;
  company: string;
  type: string;
  cls: string;
  submitted: string;
  stage: string;
  stageLabel: string;
  tone: 'green' | 'red' | 'orange' | 'blue' | 'gray';
}

/** "All membership applications" (prototype M.table: search, stage filter, row opens the review) */
export function PipelineTable({ locale, rows }: { locale: Locale; rows: PipelineTableRow[] }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `review.pipeline.${k}`, v);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('');
  const stages = useMemo(() => [...new Map(rows.map((r) => [r.stage, r.stageLabel]))], [rows]);
  const shown = rows.filter(
    (r) =>
      (!stage || r.stage === stage) &&
      `${r.token} ${r.company} ${r.type} ${r.cls} ${r.stageLabel}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <div className="card">
      <div className="ch">
        <h3>{m('table')}</h3>
      </div>
      <div className="tbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={m('search')} aria-label={m('search')} />
        {stages.length > 1 && (
          <select className="sel" value={stage} onChange={(e) => setStage(e.target.value)} aria-label={m('allStages')}>
            <option value="">{m('allStages')}</option>
            {stages.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              {(['token', 'company', 'type', 'cls', 'submitted', 'stage'] as const).map((c) => (
                <th key={c} scope="col">
                  {m(`cols.${c}`)}
                </th>
              ))}
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.token}>
                <td>
                  <Link className="rowlink" href={`/admin/mreview?t=${r.token}`} data-action="adm.app.open">
                    {r.token}
                  </Link>
                </td>
                <td>{r.company || '—'}</td>
                <td>{r.type}</td>
                <td>{r.cls}</td>
                <td>{r.submitted}</td>
                <td>
                  <span className={`bd ${r.tone}`}>{r.stageLabel}</span>
                </td>
                <td className="ar" aria-hidden="true">
                  <ChevronRight size={16} color="#94a3b8" />
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr className="st">
                <td colSpan={7} className="em">
                  {rows.length ? m('noMatch') : m('none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="cnt">{m('showing', { n: String(shown.length), total: String(rows.length) })}</div>
    </div>
  );
}
