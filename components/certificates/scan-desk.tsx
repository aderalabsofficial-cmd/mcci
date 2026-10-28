'use client';

import { Check, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { type CertResult, confirmScan, rejectScan, uploadScans } from '@/lib/certificates/actions';
import { callAction } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';

export interface ScanRow {
  id: string;
  fileName: string;
  status: 'uploaded' | 'extracted' | 'failed' | 'confirmed' | 'rejected';
  uploadedAt: string;
  fields: { key: string; value: string | null; confidence: number }[];
  conflicts: string[];
  matched: { id: string; label: string } | null;
  code: string | null;
  stamped: boolean;
  note: string | null;
  log: string[];
}

/**
 * Certificate scans (docs/21 point 30, migration 0450): upload (one request per file), the AI reading with its
 * certainty, the matched member and every conflict; a person confirms (a conflict needs the approver's override with
 * a reason) or rejects. Buttons follow the level; the database refuses anything not allowed.
 */
export function ScanDesk({
  locale,
  rows,
  members,
  canWork,
  canOverride,
}: {
  locale: Locale;
  rows: ScanRow[];
  members: { id: string; label: string }[];
  canWork: boolean;
  canOverride: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `certs.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [note, setNote] = useState<CertResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ kind: 'confirm' | 'reject'; row: ScanRow } | null>(null);
  const [member, setMember] = useState('');
  const [override, setOverride] = useState(false);
  const [text, setText] = useState('');
  const [inner, setInner] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy('upload');
    setNote(null);
    const messages: string[] = [];
    let ok = false;
    for (const [i, file] of Array.from(files).entries()) {
      setNote({ ok: true, message: m('uploading', { n: String(i + 1), total: String(files.length) }) });
      const fd = new FormData();
      fd.set('locale', locale);
      fd.append('files', file);
      const r = await callAction(locale, () => uploadScans(fd));
      ok = ok || r.ok;
      messages.push(r.message ?? '');
    }
    setBusy(null);
    setNote({ ok, message: messages.join(' ') });
    startTransition(() => router.refresh());
  };

  const open = (kind: 'confirm' | 'reject', row: ScanRow) => {
    setMember(row.matched?.id ?? '');
    setOverride(false);
    setText('');
    setInner(null);
    setDialog({ kind, row });
  };
  const run = async () => {
    if (!dialog) return;
    setBusy('dialog');
    setInner(null);
    const r =
      dialog.kind === 'confirm'
        ? await callAction(locale, () => confirmScan(locale, dialog.row.id, member, override, text))
        : await callAction(locale, () => rejectScan(locale, dialog.row.id, text));
    setBusy(null);
    if (!r.ok) return setInner(r.message ?? '');
    setDialog(null);
    setNote({ ok: true, message: r.message ?? '' });
    startTransition(() => router.refresh());
  };
  const d = dialog;
  const needsOverride = d ? d.row.conflicts.length > 0 || member !== (d.row.matched?.id ?? '') : false;

  return (
    <>
      {canWork && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="ch">
            <h3>{m('uploadTitle')}</h3>
          </div>
          <p className="muted">{m('uploadHelp')}</p>
          <label className="btn btn-primary btn-big" style={{ marginTop: 10 }}>
            <Upload size={18} aria-hidden /> {busy === 'upload' ? msg(locale, 'membership.wiz.working') : m('upload')}
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              hidden
              data-action="cert.upload"
              aria-label={m('upload')}
              disabled={busy === 'upload'}
              onChange={(e) => {
                const f = e.target.files;
                void upload(f).then(() => {
                  e.target.value = '';
                });
              }}
            />
          </label>
        </div>
      )}
      {note && (
        <div className={`banner ${note.ok ? 'green' : 'red'}`} role={note.ok ? 'status' : 'alert'} style={{ marginBottom: 12 }}>
          <span>{note.message}</span>
        </div>
      )}
      <div className="card">
        <div className="ch">
          <h3>{m('scans')}</h3>
        </div>
        {!rows.length && <p className="em">{m('none')}</p>}
        {rows.map((r) => (
          <div className="agenda" key={r.id} data-scan={r.fileName} data-status={r.status}>
            <a className="ofphoto" href={`/api/certificates/scan/${r.id}${r.stamped ? '?v=stamped' : ''}`} target="_blank" rel="noreferrer" data-action="cert.view">
              {/* eslint-disable-next-line @next/next/no-img-element -- private file through the permission-checked route */}
              <img src={`/api/certificates/scan/${r.id}${r.stamped ? '?v=stamped' : ''}`} alt={m('scanOf', { name: r.fileName })} />
            </a>
            <div>
              <b>
                {r.fileName} <span className={`bd ${STATUS_TONE[r.status]}`}>{m(`status.${r.status}`)}</span>
              </b>
              <small>
                {r.matched ? m('matched', { member: r.matched.label }) : m('noMatch')}
                {r.code ? ` · QR ${r.code}` : ''}
              </small>
              {r.fields.length > 0 && (
                <small className="cert-fields">
                  {r.fields.map((f) => (
                    <span key={f.key} className={f.confidence < 70 && f.value ? 'low' : ''} data-field={f.key}>
                      {m(`fields.${f.key}`)}: <b>{f.value ?? '—'}</b> ({f.confidence}%){' '}
                    </span>
                  ))}
                </small>
              )}
              {r.conflicts.length > 0 && (
                <small role="note" data-conflicts>
                  <X size={12} color="#ef4444" aria-hidden />{' '}
                  {r.conflicts.map((c) => m(`conflicts.${c.startsWith('low_confidence:') ? 'low_confidence' : c}`, { field: c.split(':')[1] ? m(`fields.${c.split(':')[1]}`) : '' })).join(' · ')}
                </small>
              )}
              {r.note && <small>{r.note}</small>}
            </div>
            {canWork && ['extracted', 'failed', 'uploaded'].includes(r.status) && (
              <div className="pb">
                <button type="button" className="btn btn-w btn-danger" data-action="cert.reject" onClick={() => open('reject', r)}>
                  <X size={16} aria-hidden /> {m('reject')}
                </button>
                {r.status === 'extracted' && (
                  <button type="button" className="btn btn-w btn-primary" data-action="cert.confirm" onClick={() => open('confirm', r)}>
                    <Check size={16} aria-hidden /> {m('confirm')}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <Modal
        open={Boolean(d)}
        onOpenChange={(o) => !o && setDialog(null)}
        title={d ? m(d.kind === 'confirm' ? 'confirmTitle' : 'rejectTitle', { name: d.row.fileName }) : ''}
        intro={d?.kind === 'confirm' ? m('confirmHelp') : undefined}
        closeLabel={msg(locale, 'common.close')}
        footer={
          d && (
            <>
              <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
                {msg(locale, 'committee.desk.cancel')}
              </button>
              <button
                type="button"
                className={`btn ${d.kind === 'reject' ? 'btn-danger' : 'btn-primary'}`}
                data-action={`cert.${d.kind}.confirm`}
                disabled={busy === 'dialog' || (d.kind === 'confirm' && (!member || (needsOverride && !canOverride)))}
                title={d.kind === 'confirm' && needsOverride && !canOverride ? m('needApprover') : undefined}
                onClick={() => void run()}
              >
                {busy === 'dialog' ? msg(locale, 'membership.wiz.working') : m(d.kind === 'confirm' ? 'confirmOk' : 'reject')}
              </button>
            </>
          )
        }
      >
        {d?.kind === 'confirm' && (
          <>
            <label className="form-field">
              {m('member')}
              <select value={member} onChange={(e) => setMember(e.target.value)}>
                <option value="">{m('pickMember')}</option>
                {members.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            {needsOverride && (
              <div className="banner orange" role="status" style={{ marginBottom: 10 }}>
                <span>{canOverride ? m('overrideHelp') : m('needApprover')}</span>
              </div>
            )}
            {needsOverride && canOverride && (
              <label className="flex min-h-11 items-center gap-2.5">
                <input type="checkbox" className="size-5 shrink-0" checked={override} onChange={(e) => setOverride(e.target.checked)} />
                {m('override')}
              </label>
            )}
          </>
        )}
        {(d?.kind === 'reject' || needsOverride) && (
          <label className="form-field">
            {m(d?.kind === 'reject' ? 'rejectReason' : 'overrideReason')}
            <textarea rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
        )}
        {inner && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
            {inner}
          </p>
        )}
      </Modal>
    </>
  );
}

const STATUS_TONE: Record<ScanRow['status'], string> = {
  uploaded: 'blue',
  extracted: 'orange',
  failed: 'red',
  confirmed: 'green',
  rejected: 'red',
};
