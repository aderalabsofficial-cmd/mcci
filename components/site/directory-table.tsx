'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '@/components/shared/modal';

export interface DirRow {
  member_no: string;
  company: string;
  cls: string;
  clsLabel: string;
  sector: string;
  status: string;
  statusLabel: string;
  valid_to: string;
}

export interface DirText {
  table: string;
  search: string;
  allClasses: string;
  cols: { company: string; sector: string; cls: string; no: string; status: string };
  none: string;
  noMatch: string;
  view: string;
  validTo: string;
  publicOnly: string;
  close: string;
  classes: { Corporate: string; Associate: string };
}

/** the public directory (prototype site/directory): search, class filter, and dir.view (public fields only) */
export function DirectoryTable({ rows, t }: { rows: DirRow[]; t: DirText }) {
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('');
  const [open, setOpen] = useState<DirRow | null>(null);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (!cls || r.cls === cls) && (!s || `${r.company} ${r.sector} ${r.member_no}`.toLowerCase().includes(s)));
  }, [rows, q, cls]);
  if (!rows.length) return <p className="em" style={{ textAlign: 'center' }}>{t.none}</p>;
  return (
    <section className="card" aria-label={t.table}>
      <div className="flex flex-wrap items-end gap-3" style={{ marginBottom: 12 }}>
        <label className="form-field min-w-[220px] flex-1">
          {t.search}
          <span className="relative block">
            <input value={q} onChange={(e) => setQ(e.currentTarget.value)} data-action="dir.search" type="search" />
            <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-50 ltr:right-3 rtl:left-3" />
          </span>
        </label>
        <label className="form-field">
          {t.cols.cls}
          <select value={cls} onChange={(e) => setCls(e.currentTarget.value)} data-action="dir.filter">
            <option value="">{t.allClasses}</option>
            <option value="Corporate">{t.classes.Corporate}</option>
            <option value="Associate">{t.classes.Associate}</option>
          </select>
        </label>
      </div>
      {shown.length ? (
        <div className="tw" tabIndex={0} role="region" aria-label={t.table}>
          <table>
            <thead>
              <tr>
                <th scope="col">{t.cols.company}</th>
                <th scope="col">{t.cols.sector}</th>
                <th scope="col">{t.cols.cls}</th>
                <th scope="col">{t.cols.no}</th>
                <th scope="col">{t.cols.status}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr className="st" key={r.member_no} data-member={r.member_no}>
                  <td>
                    <button type="button" className="rowlink-btn" data-action="dir.view" aria-label={t.view.replace('{company}', r.company)} onClick={() => setOpen(r)}>
                      {r.company}
                    </button>
                  </td>
                  <td>{r.sector || '—'}</td>
                  <td>{r.clsLabel}</td>
                  <td>{r.member_no}</td>
                  <td>
                    <span className={`bd ${r.status === 'Temporary' ? 'blue' : 'green'}`}>{r.statusLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="em">{t.noMatch}</p>
      )}
      <Modal open={open !== null} onOpenChange={(o) => !o && setOpen(null)} title={open?.company ?? ''} intro={t.publicOnly} closeLabel={t.close}>
        {open && (
          <div className="kv">
            {(
              [
                [t.cols.no, open.member_no],
                [t.cols.cls, open.clsLabel],
                [t.cols.sector, open.sector || '—'],
                [t.cols.status, open.statusLabel],
                [t.validTo, open.valid_to],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <small className="muted" style={{ display: 'block' }}>
                  {k}
                </small>
                <b>{v}</b>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </section>
  );
}
