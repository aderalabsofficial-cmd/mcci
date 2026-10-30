'use client';

import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { directoryQuery, SELECTION_LIMIT, type Filter, type Selection } from '@/lib/business/filters';
import type { DirectoryRow } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';

const STORE = 'mcci.biz.selection';

export function readSelection(key: string): Selection {
  const none: Selection = { mode: 'none', ids: [], excluded: [], key };
  try {
    const raw = sessionStorage.getItem(STORE);
    const s = raw ? (JSON.parse(raw) as Selection) : none;
    // "everything matching" belongs to one filter; chosen rows stay chosen when the filter changes
    return s.mode === 'matching' && s.key !== key ? none : { ...s, key };
  } catch {
    return none;
  }
}
function writeSelection(s: Selection) {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    // a blocked browser store only means the selection lasts until the page changes
  }
}

const SORTABLE = [
  'business_name',
  'member_no',
  'member_class',
  'member_status',
  'business_category',
  'nature',
  'city',
  'valid_to',
  'consent',
] as const;

/** The directory table: sorting and paging keep the filter; the selection survives moving between pages. */
export function DirectoryTable({
  locale,
  rows,
  total,
  page,
  pages,
  sort,
  dir,
  filter,
  q,
  segment,
  canExport,
}: {
  locale: Locale;
  rows: DirectoryRow[];
  total: number;
  page: number;
  pages: number;
  sort: string;
  dir: string;
  filter: Filter;
  q: string;
  segment?: string;
  canExport: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `biz.table.${k}`, v);
  const key = directoryQuery({ f: filter, q });
  const [sel, setSel] = useState<Selection>({ mode: 'none', ids: [], excluded: [], key });
  useEffect(() => setSel(readSelection(key)), [key]);
  const update = (s: Selection) => {
    setSel(s);
    writeSelection(s);
  };
  const isOn = (id: string) => (sel.mode === 'matching' ? !sel.excluded.includes(id) : sel.ids.includes(id));
  const toggle = (id: string, on: boolean) => {
    if (sel.mode === 'matching') {
      update({
        ...sel,
        excluded: on ? sel.excluded.filter((x) => x !== id) : [...sel.excluded, id].slice(0, SELECTION_LIMIT),
      });
    } else {
      const ids = on ? [...sel.ids, id] : sel.ids.filter((x) => x !== id);
      update({ ...sel, mode: ids.length ? 'ids' : 'none', ids: ids.slice(0, SELECTION_LIMIT) });
    }
  };
  const pageAll = rows.length > 0 && rows.every((r) => isOn(r.member_id));
  const togglePage = (on: boolean) => {
    if (sel.mode === 'matching') {
      const here = rows.map((r) => r.member_id);
      update({
        ...sel,
        excluded: on
          ? sel.excluded.filter((x) => !here.includes(x))
          : [...new Set([...sel.excluded, ...here])].slice(0, SELECTION_LIMIT),
      });
    } else {
      const here = rows.map((r) => r.member_id);
      const ids = on ? [...new Set([...sel.ids, ...here])] : sel.ids.filter((x) => !here.includes(x));
      update({ ...sel, mode: ids.length ? 'ids' : 'none', ids: ids.slice(0, SELECTION_LIMIT) });
    }
  };
  const chosen = sel.mode === 'matching' ? Math.max(0, total - sel.excluded.length) : sel.ids.length;
  const link = (p: { sort?: string; dir?: string; page?: number }) =>
    `/admin/business-directory${directoryQuery({ f: filter, q, segment, sort: p.sort ?? sort, dir: p.dir ?? dir, page: p.page ?? 1 })}`;
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="card" data-directory>
      <div className="ch">
        <h3>{m('title')}</h3>
        <small data-total={total}>{m('total', { n: String(total) })}</small>
      </div>
      <div className="biz-selbar" data-selection={sel.mode} role="status">
        <span>{m('selected', { n: String(chosen) })}</span>
        {total > 0 && (
          <button
            type="button"
            className="btn btn-w"
            data-action="biz.select.matching"
            onClick={() => update({ mode: 'matching', ids: [], excluded: [], key })}
          >
            {m('selectMatching', { n: String(total) })}
          </button>
        )}
        {chosen > 0 && (
          <button
            type="button"
            className="btn btn-w"
            data-action="biz.select.clear"
            onClick={() => update({ mode: 'none', ids: [], excluded: [], key })}
          >
            {m('clearSelection')}
          </button>
        )}
        {canExport && (
          <Link
            className="btn btn-w"
            href={`/admin/business-directory/exports${directoryQuery({ f: filter, q })}`}
            data-action="biz.export.open"
          >
            <Download size={15} aria-hidden /> {m('export')}
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="muted biz-empty" data-empty>
          {m('empty')}
        </p>
      ) : (
        <div className="tw" tabIndex={0} role="region" aria-label={m('title')}>
          <table>
            <thead>
              <tr>
                <th scope="col" className="biz-pick">
                  <input
                    type="checkbox"
                    aria-label={m('selectPage')}
                    checked={pageAll}
                    data-action="biz.select.page"
                    onChange={(e) => togglePage(e.target.checked)}
                  />
                </th>
                {SORTABLE.map((c) => {
                  const on = sort === c;
                  return (
                    <th key={c} scope="col" aria-sort={on ? (dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
                      <Link
                        href={link({ sort: c, dir: on && dir === 'asc' ? 'desc' : 'asc' })}
                        data-action="biz.sort"
                        data-sort={c}
                        className="biz-sort"
                      >
                        {msg(locale, `biz.columns.${c}`)}
                        {on &&
                          (dir === 'desc' ? <ArrowDown size={13} aria-hidden /> : <ArrowUp size={13} aria-hidden />)}
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="st" key={r.member_id} data-row={r.member_no}>
                  <td className="biz-pick">
                    <input
                      type="checkbox"
                      aria-label={m('selectRow', { name: r.business_name })}
                      checked={isOn(r.member_id)}
                      data-action="biz.select.row"
                      onChange={(e) => toggle(r.member_id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <Link
                      href={`/admin/business-directory/profile?id=${r.member_id}`}
                      data-action="biz.profile.open"
                      className="rowlink"
                    >
                      <b>{r.business_name}</b>
                    </Link>
                    {r.tag_names.length > 0 && <small className="biz-tags">{r.tag_names.join(', ')}</small>}
                    {r.incomplete && <span className="bd orange">{m('incomplete')}</span>}
                  </td>
                  <td>{r.member_no}</td>
                  <td>{msg(locale, `biz.values.member_class.${r.member_class}`)}</td>
                  <td>
                    <span
                      className={`bd ${r.member_status === 'Active' ? 'green' : r.member_status === 'Temporary' ? 'blue' : 'red'}`}
                    >
                      {msg(locale, `biz.values.member_status.${r.member_status}`)}
                    </span>
                  </td>
                  <td>{msg(locale, `biz.values.business_category.${r.business_category}`)}</td>
                  <td>{r.nature ?? '—'}</td>
                  <td>{r.city ?? '—'}</td>
                  <td>{date(r.valid_to)}</td>
                  <td>
                    {r.opted_out ? (
                      <span className="bd red">{m('optedOut')}</span>
                    ) : (
                      <span className={`bd ${r.consent === 'granted' ? 'green' : 'orange'}`}>
                        {msg(locale, `biz.values.consent.${r.consent}`)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav className="pb biz-pages" aria-label={m('pages')}>
          {page > 1 && (
            <Link className="btn btn-w" href={link({ page: page - 1 })} data-action="biz.page.prev" rel="prev">
              {m('prev')}
            </Link>
          )}
          <span data-page={page}>{m('pageOf', { p: String(page), n: String(pages) })}</span>
          {page < pages && (
            <Link className="btn btn-w" href={link({ page: page + 1 })} data-action="biz.page.next" rel="next">
              {m('next')}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
