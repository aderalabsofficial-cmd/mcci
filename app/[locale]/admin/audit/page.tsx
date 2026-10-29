import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; days?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'audit.title') };
}

export const dynamic = 'force-dynamic';

const PERIODS = ['1', '7', '30', '365'] as const;
const RESULT_TONE: Record<string, string> = { Success: 'green', Failed: 'red', Denied: 'red' };

/** the changed fields of an UPDATE (old → new), or the stored row of an INSERT / DELETE, as short lines */
function changes(oldV: unknown, newV: unknown): string[] {
  const o = (oldV ?? {}) as Record<string, unknown>;
  const n = (newV ?? {}) as Record<string, unknown>;
  const show = (v: unknown) => {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s === undefined ? '—' : s.length > 80 ? `${s.slice(0, 77)}…` : s;
  };
  const keys = [...new Set([...Object.keys(o), ...Object.keys(n)])].filter(
    (k) => JSON.stringify(o[k]) !== JSON.stringify(n[k]) && !['updated_at', 'created_at'].includes(k),
  );
  if (oldV && newV) return keys.map((k) => `${k}: ${show(o[k])} → ${show(n[k])}`);
  return keys.map((k) => `${k}: ${show(oldV ? o[k] : n[k])}`);
}

/**
 * Audit Trail (prototype admin/audit; tab of Staff & Audit): every change made by a person or a job — who, what, when,
 * old → new and why (audit_log). Reading needs Staff & Audit ≥ 1 (the audit_log_select policy); the newest 200 entries
 * of the chosen period, searchable. Export (CSV) is the IT Convener's only (migration 0500).
 */
export default async function AuditPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  // Staff & Audit ≥ 1, or the IT Convener (security of the platform; the only one who exports it — 0500)
  const itConvener = session.access.staff?.designation === 'IT Convener';
  const g = guardStaff(session, locale, 'staff', 'audit.title');
  if (g.denied && !itConvener) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `audit.${k}`, v);
  const sp = await searchParams;
  const days = (PERIODS as readonly string[]).includes(sp.days ?? '') ? sp.days! : '7';
  // letters, digits and a few separators only: the search goes into a PostgREST filter
  const q = (sp.q ?? '')
    .replace(/[^\p{L}\p{N} @._-]/gu, '')
    .trim()
    .slice(0, 60);
  const supabase = await createClient();
  let query = supabase
    .from('audit_log')
    .select('id, at, user_name, action, object, object_id, reason, result, old_value, new_value')
    .gte('at', new Date(Date.now() - Number(days) * 86_400_000).toISOString())
    .order('at', { ascending: false })
    .limit(200);
  if (q)
    query = query.or(
      ['user_name', 'action', 'object', 'object_id', 'reason'].map((c) => `${c}.ilike.*${q}*`).join(','),
    );
  const { data, error } = await query;
  if (error) throw new Error(`audit log: ${error.message}`);
  const rows = data ?? [];
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  const exportHref = `/api/audit/export?${new URLSearchParams({ days, ...(q ? { q } : {}) })}`;
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        {itConvener && (
          // the IT Convener's only (0500); every download is logged
          <a className="btn btn-primary" href={exportHref} download data-action="audit.export">
            {m('export')}
          </a>
        )}
      </div>
      <section className="card" aria-labelledby="au-h">
        <div className="ch">
          <h3 id="au-h">{m('log')}</h3>
        </div>
        <form className="tbar" role="search" aria-label={m('search')}>
          <input name="q" defaultValue={q} placeholder={m('search')} aria-label={m('search')} maxLength={60} />
          <select name="days" defaultValue={days} aria-label={m('period')}>
            {PERIODS.map((d) => (
              <option key={d} value={d}>
                {m(`periods.${d}`)}
              </option>
            ))}
          </select>
          <button className="btn" data-action="audit.filter">
            {m('show')}
          </button>
        </form>
        {rows.length ? (
          <div className="tw" tabIndex={0} role="region" aria-label={m('log')}>
            <table>
              <thead>
                <tr>
                  {(['time', 'user', 'action', 'object', 'detail', 'result'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const lines = changes(r.old_value, r.new_value);
                  return (
                    <tr key={r.id} data-audit={r.id}>
                      <td>{when(r.at)}</td>
                      <td>{r.user_name ?? m('system')}</td>
                      <td>{r.action}</td>
                      <td>
                        {r.object ?? '—'}
                        {r.object_id ? <small className="muted block">{r.object_id}</small> : null}
                      </td>
                      <td>
                        {r.reason ? <div>{r.reason}</div> : null}
                        {lines.length ? (
                          <details>
                            <summary>{m('changed', { n: String(lines.length) })}</summary>
                            <ul className="audit-ch">
                              {lines.map((l, i) => (
                                <li key={i}>{l}</li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                      </td>
                      <td>
                        <span className={`bd ${RESULT_TONE[r.result] ?? 'gray'}`}>{r.result}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="em">{m('none')}</p>
        )}
        <p className="muted" style={{ marginTop: 10 }}>
          {m('showing', { n: String(rows.length) })}
        </p>
      </section>
    </div>
  );
}
