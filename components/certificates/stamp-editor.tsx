'use client';

import { Check, Download, Printer, QrCode, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale } from '@/i18n/routing';
import { callAction } from '@/lib/client/call-action';
import { previewStamp, saveStamp, type StampPreview } from '@/lib/certificates/actions';
import { msg } from '@/lib/nav/model';

type Placement = { cx: number; cy: number; mm: number };

/**
 * Places the certificate's signed QR on a copy (owner, 30 Oct 2026; docs/26): the original scan, the proposed copy at
 * the default position (the green stamp's former place, bottom centre) and the large QR side by side; staff adjust the
 * position and size, update the preview and save. Saving again replaces the copy — same record, same reference.
 */
export function StampEditor({
  locale,
  scanId,
  code,
  stamped,
  docStatus,
  canWork,
}: {
  locale: Locale;
  scanId: string;
  code: string;
  stamped: boolean;
  docStatus: string | null;
  canWork: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `certs.stamp.${k}`, v);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [at, setAt] = useState<Placement | null>(null);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  const preview = (p: Placement | null) =>
    start(async () => {
      const r = (await callAction(locale, () => previewStamp(locale, scanId, p))) as StampPreview;
      if (!r.ok) return setNote({ ok: false, message: r.message ?? '' });
      setNote(null);
      setImage(r.image ?? null);
      if (r.placement) setAt(r.placement);
    });
  const save = () =>
    at &&
    start(async () => {
      const r = await callAction(locale, () => saveStamp(locale, scanId, at));
      setNote({ ok: r.ok, message: r.message ?? '' });
      if (r.ok) router.refresh();
    });
  const field = (k: keyof Placement, label: string, min: number, max: number, step: number, scale: number) => (
    <label className="form-field">
      {label}
      <input
        type="number"
        data-field={k}
        min={min}
        max={max}
        step={step}
        value={at ? Math.round(at[k] * scale * 10) / 10 : ''}
        disabled={!at || pending}
        onChange={(e) => at && setAt({ ...at, [k]: Number(e.target.value) / scale })}
      />
    </label>
  );

  return (
    <div className="stamp-ed" data-stamp={stamped ? 'saved' : 'missing'}>
      <div className="pb" style={{ alignItems: 'center' }}>
        <span className={`bd ${stamped ? 'green' : 'orange'}`} data-copy-state>
          {m(stamped ? 'isSaved' : 'notSaved')}
        </span>
        <small>
          {m('reference')}: <b>{code}</b> · {m('verification')}: <b>{docStatus ?? '—'}</b>
        </small>
        {canWork && (
          <button
            type="button"
            className="btn btn-w btn-primary"
            data-action="cert.stamp.open"
            aria-expanded={open}
            onClick={() => {
              const next = !open;
              setOpen(next);
              if (next && !image) preview(null);
            }}
          >
            <QrCode size={16} aria-hidden /> {open ? m('close') : m(stamped ? 'adjust' : 'open')}
          </button>
        )}
      </div>
      <div className="pb">
        {canWork && (
          <a className="btn btn-w" href={`/api/certificates/scan/${scanId}?download=1`} data-action="cert.dl.original">
            <Download size={15} aria-hidden /> {m('dlOriginal')}
          </a>
        )}
        {stamped && (
          <>
            <a
              className="btn btn-w"
              href={`/api/certificates/scan/${scanId}?v=stamped&download=1`}
              data-action="cert.dl.stamped"
            >
              <Download size={15} aria-hidden /> {m('dlStamped')}
            </a>
            <a
              className="btn btn-w"
              href={`/api/certificates/scan/${scanId}?v=stamped`}
              target="_blank"
              rel="noreferrer"
              data-action="cert.print"
            >
              <Printer size={15} aria-hidden /> {m('print')}
            </a>
          </>
        )}
        <a className="btn btn-w" href={`/api/certificates/${code}/qr?format=png&download=1`} data-action="cert.dl.png">
          <Download size={15} aria-hidden /> {m('dlPng')}
        </a>
        <a className="btn btn-w" href={`/api/certificates/${code}/qr?format=svg&download=1`} data-action="cert.dl.svg">
          <Download size={15} aria-hidden /> {m('dlSvg')}
        </a>
      </div>
      {open && (
        <>
          <p className="muted">{m('placeHelp')}</p>
          <div className="stamp-ctl">
            {field('cx', m('across'), 4, 96, 0.5, 100)}
            {field('cy', m('down'), 4, 96, 0.5, 100)}
            {field('mm', m('size'), 15, 45, 0.5, 1)}
          </div>
          <small className="muted">{m('sizeHelp')}</small>
          <div className="pb">
            <button
              type="button"
              className="btn btn-w"
              data-action="cert.stamp.preview"
              disabled={!at || pending}
              title={at ? undefined : m('working')}
              onClick={() => preview(at)}
            >
              <RefreshCw size={15} aria-hidden /> {pending ? m('working') : m('preview')}
            </button>
            <button
              type="button"
              className="btn btn-w btn-primary"
              data-action="cert.stamp.save"
              disabled={!at || !image || pending}
              title={at && image ? undefined : m('working')}
              onClick={save}
            >
              <Check size={15} aria-hidden /> {m(stamped ? 'saveAgain' : 'save')}
            </button>
          </div>
          <div className="stamp-grid">
            <figure>
              <figcaption>{m('original')}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element -- private file through the permission-checked route */}
              <img src={`/api/certificates/scan/${scanId}`} alt={m('originalAlt')} />
            </figure>
            <figure data-preview={image ? 'ready' : 'loading'}>
              <figcaption>{m('proposed')}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated on the server, not stored */}
              {image ? <img src={image} alt={m('previewAlt')} /> : <p className="muted">{m('working')}</p>}
            </figure>
            <figure>
              <figcaption>{m('qr')}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element -- same signed URL as the certificate's QR */}
              <img src={`/api/certificates/${code}/qr?format=svg`} alt={m('qrAlt', { code })} />
            </figure>
          </div>
        </>
      )}
      {note && (
        <p role={note.ok ? 'status' : 'alert'} className={note.ok ? 'ai-ok' : 'ai-err'}>
          {note.message}
        </p>
      )}
    </div>
  );
}
