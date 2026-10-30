'use client';

import { Download, Eye, Lock } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { readSelection } from '@/components/business/directory-table';
import { ActionNotice } from '@/components/shared/action-notice';
import type { Locale } from '@/i18n/routing';
import { previewExport } from '@/lib/business/actions';
import { directoryQuery, EXPORT_DEFAULT, EXPORT_FIELDS, type Filter, type Selection } from '@/lib/business/filters';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';

const PDF_MAX_FIELDS = 8;
type Format = 'csv' | 'xlsx' | 'pdf';

/** Choose the rows and columns, see the count and a sample, then download. The server logs every download. */
export function ExportCentre({
  locale,
  filter,
  q,
  level,
}: {
  locale: Locale;
  filter: Filter;
  q: string;
  level: number;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `biz.exports.${k}`, v);
  const [sel, setSel] = useState<Selection | null>(null);
  const [scope, setScope] = useState<'filter' | 'selected'>('filter');
  const [fields, setFields] = useState<string[]>([...EXPORT_DEFAULT]);
  const [format, setFormat] = useState<Format>('csv');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<{ total: number; rows: Record<string, unknown>[] } | null>(null);
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  const [saving, setSaving] = useState(false);

  useEffect(() => setSel(readSelection(directoryQuery({ f: filter, q }))), [filter, q]);
  const chosen = sel && sel.mode !== 'none' ? sel : null;
  const useSelection = scope === 'selected' && chosen;
  const ids = useSelection && chosen.mode === 'ids' ? chosen.ids : null;
  const excluded = useSelection && chosen.mode === 'matching' ? chosen.excluded : [];
  const sensitive = fields.some((f) => EXPORT_FIELDS.find((x) => x.key === f)?.sensitive);
  const needsReason = sensitive && reason.trim().length < 5;
  const tooManyForPdf = format === 'pdf' && fields.length > PDF_MAX_FIELDS;
  const blocked = pending || saving || fields.length === 0 || needsReason || tooManyForPdf;
  const blockedWhy =
    fields.length === 0
      ? m('pickField')
      : needsReason
        ? m('reasonNeeded')
        : tooManyForPdf
          ? m('pdfFields')
          : pending || saving
            ? m('working')
            : undefined;

  const touch = () => setPreview(null);
  const show = () =>
    start(async () => {
      const r = await callAction(locale, () => previewExport(locale, { filter, q, ids, excluded, fields, reason }));
      if (r.ok && 'rows' in r) {
        setNote(null);
        setPreview({ total: r.total as number, rows: r.rows as Record<string, unknown>[] });
      } else setNote(r);
    });
  const download = async () => {
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch('/api/business-directory/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, filter, q, ids, excluded, fields, format, reason }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        setNote({
          ok: false,
          message: msg(locale, `biz.errors.${e.error === 'not_allowed' ? 'notAllowed' : (e.error ?? 'generic')}`),
        });
        return;
      }
      const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? `export.${format}`;
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      setNote({ ok: true, message: m('done') });
    } catch {
      setNote({ ok: false, message: msg(locale, 'common.actionUnconfirmed') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card biz-export" data-export>
      <div className="ch">
        <h3>{m('title')}</h3>
      </div>
      <fieldset className="biz-values">
        <legend>{m('scope')}</legend>
        <label className="biz-check">
          <input
            type="radio"
            name="scope"
            checked={scope === 'filter'}
            data-field="scope-filter"
            onChange={() => (setScope('filter'), touch())}
          />
          {m('scopeFilter')}
        </label>
        <label className="biz-check">
          <input
            type="radio"
            name="scope"
            checked={scope === 'selected'}
            disabled={!chosen}
            title={chosen ? undefined : m('noSelection')}
            data-field="scope-selected"
            onChange={() => (setScope('selected'), touch())}
          />
          {chosen
            ? m('scopeSelected', { n: String(chosen.mode === 'ids' ? chosen.ids.length : '…') })
            : m('noSelection')}
        </label>
      </fieldset>
      <fieldset className="biz-values" data-columns>
        <legend>{m('columns')}</legend>
        {EXPORT_FIELDS.map((f) => {
          const locked = f.sensitive && level < 3;
          return (
            <label className="biz-check" key={f.key} title={locked ? m('lockedHint') : undefined}>
              <input
                type="checkbox"
                checked={fields.includes(f.key)}
                disabled={locked}
                data-column={f.key}
                onChange={(e) => {
                  setFields((all) => (e.target.checked ? [...all, f.key] : all.filter((x) => x !== f.key)));
                  touch();
                }}
              />
              {msg(locale, `biz.columns.${f.key}`)}
              {f.sensitive && <Lock size={12} aria-label={m('sensitive')} />}
            </label>
          );
        })}
      </fieldset>
      <div className="biz-rule">
        <label className="form-field">
          {m('format')}
          <select value={format} data-field="format" onChange={(e) => setFormat(e.target.value as Format)}>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="pdf">{m('pdf')}</option>
          </select>
        </label>
        <label className="form-field">
          {sensitive ? m('reasonRequired') : m('reason')}
          <input value={reason} maxLength={300} data-field="reason" onChange={(e) => setReason(e.target.value)} />
        </label>
      </div>
      <div className="pb">
        <button
          type="button"
          className="btn btn-w"
          data-action="biz.export.preview"
          disabled={blocked}
          title={blockedWhy}
          onClick={show}
        >
          <Eye size={15} aria-hidden /> {m('preview')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          data-action="biz.export.download"
          disabled={blocked || !preview}
          title={blockedWhy ?? (preview ? undefined : m('previewFirst'))}
          onClick={() => void download()}
        >
          <Download size={15} aria-hidden /> {m('download')}
        </button>
      </div>
      <ActionNotice locale={locale} note={note} />
      {preview && (
        <>
          <p data-preview-total={preview.total}>
            <b>{m('previewTotal', { n: String(preview.total) })}</b> {m('previewSample')}
          </p>
          <div className="tw" tabIndex={0} role="region" aria-label={m('preview')}>
            <table>
              <thead>
                <tr>
                  {fields.map((f) => (
                    <th key={f} scope="col">
                      {msg(locale, `biz.columns.${f}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, i) => (
                  <tr className="st" key={i}>
                    {fields.map((f) => (
                      <td key={f}>{r[f] === null || r[f] === undefined || r[f] === '' ? '—' : String(r[f])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
