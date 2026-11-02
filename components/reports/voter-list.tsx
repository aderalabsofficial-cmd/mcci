import { Download } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { filterVoters, VOTER_RESULTS, type VoterResult, type VoterRow } from '@/lib/voter/load';

/** The voter list from a cutoff date: filter tabs, a count, the reason beside anyone not eligible, and a logged export. */
export function VoterList({
  locale,
  rows,
  cutoff,
  cls,
  result,
  basePath,
  extra,
  canExport,
}: {
  locale: Locale;
  rows: VoterRow[];
  cutoff: string;
  cls: string | null;
  result: VoterResult;
  basePath: string;
  extra?: Record<string, string>;
  canExport: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `voter.${k}`, v);
  const date = (d: string | null) =>
    d
      ? new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          timeZone: 'UTC',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—';
  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams({ ...extra, cutoff, ...(cls ? { class: cls } : {}), result, ...over });
    if (over.class === '') p.delete('class');
    return `${basePath}?${p}`;
  };
  const visible = filterVoters(rows, result);
  const eligible = rows.filter((r) => r.reason === null).length;
  const base = locale === 'ur' ? '/ur' : '';
  return (
    <section className="card" data-section="voter-list" aria-labelledby="voter-h">
      <div className="ch">
        <h3 id="voter-h">{m('title')}</h3>
        {canExport && (
          <a
            className="btn"
            href={`/api/reports/voters?cutoff=${cutoff}${cls ? `&class=${cls}` : ''}&result=${result}`}
            download
            data-action="voter.export"
          >
            <Download size={15} aria-hidden /> {m('export')}
          </a>
        )}
      </div>
      <p className="muted">{m('help')}</p>
      <form method="get" action={`${base}${basePath}`} className="rep-filter">
        {Object.entries(extra ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {cls && <input type="hidden" name="class" value={cls} />}
        <input type="hidden" name="result" value={result} />
        <label className="form-field">
          {m('cutoff')}
          <input type="date" name="cutoff" defaultValue={cutoff} required data-field="voter-cutoff" />
        </label>
        <button type="submit" className="btn p" data-action="voter.apply">
          {m('apply')}
        </button>
      </form>
      <nav className="pills" aria-label={m('classLabel')}>
        {(['', 'Corporate', 'Associate'] as const).map((c) => (
          <Link key={c || 'all'} href={href({ class: c })} className={`pill ${(cls ?? '') === c ? 'on' : ''}`} aria-current={(cls ?? '') === c ? 'true' : undefined} data-action="voter.class" data-class={c || 'all'}>
            {c ? msg(locale, `membership.classes.${c}`) : m('allClasses')}
          </Link>
        ))}
      </nav>
      <nav className="pills" aria-label={m('resultLabel')}>
        {VOTER_RESULTS.map((r) => (
          <Link key={r} href={href({ result: r })} className={`pill ${result === r ? 'on' : ''}`} aria-current={result === r ? 'true' : undefined} data-action="voter.result" data-result={r}>
            {m(`results.${r}`)}
          </Link>
        ))}
      </nav>
      <p data-voter-count={eligible}>
        <b>{m('count', { n: String(eligible), total: String(rows.length), d: date(cutoff) })}</b>
      </p>
      {visible.length ? (
        <div className="tw" tabIndex={0} role="region" aria-label={m('title')}>
          <table>
            <thead>
              <tr>
                {(['no', 'company', 'rep', 'cls', 'since', 'valid', 'result'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`cols.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr className="st" key={r.member_id} data-voter={r.member_no} data-reason={r.reason ?? 'eligible'}>
                  <td>
                    <Link href={`/admin/member?id=${r.member_id}`} className="rowlink" data-action="member.open">
                      <b>{r.member_no}</b>
                    </Link>
                  </td>
                  <td>{r.company}</td>
                  <td>{r.rep_name}</td>
                  <td>{msg(locale, `membership.classes.${r.class}`)}</td>
                  <td>{date(r.since)}</td>
                  <td>{date(r.valid_to)}</td>
                  <td>
                    <span className={`bd ${r.reason ? 'orange' : 'green'}`}>{r.reason ? m(`reasons.${r.reason}`) : m('eligible')}</span>
                    {r.blacklisted && <span className="bd red">{msg(locale, 'register.life.mustWhitelist')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="em">{m('none')}</p>
      )}
    </section>
  );
}
