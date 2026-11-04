'use client';

import { Camera, Check, FileText, IdCard, QrCode, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import type { Locale } from '@/i18n/routing';
import { removeDocument, savePhoto, uploadDocument } from '@/lib/membership/actions';
import { msg } from '@/lib/nav/model';
import { cropTextFor, PhotoCrop, toUploadable } from './photo-crop';
import { callAction } from '@/lib/client/call-action';

/**
 * Document slots of the application (prototype slot(): one row per required document, in the form's order) with
 * upload / phone camera / drag-and-drop, preview, replace and remove (actions wiz.doc.upload, wiz.doc.view,
 * wiz.doc.remove, app.fix.upload, wiz.photo → photo.save). Files are checked again on the server (type, size).
 *
 * Paper only, no soft copy (owner, 4 Nov 2026): on a phone every slot also offers "Take photo", which opens the back
 * camera (wiz.doc.camera); on a computer a QR code opens this same page on the applicant's phone (wiz.doc.phone),
 * where they sign in and photograph the papers. Uploading a file stays on both. A required slot left empty when Next
 * is pressed is marked red (`needed`).
 */

export interface SlotDoc {
  id: string;
  key: string;
  file_name: string | null;
  status: 'pending' | 'ok' | 'rejected';
  reject_reason: string | null;
  url: string | null;
}

export interface SlotRequirement {
  key: string;
  label_en: string;
  required: boolean;
}

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/heic,image/heif,.heic,.heif';

export function DocSlots({
  locale,
  appId,
  requirements,
  docs,
  photoUrl,
  editable,
  onlyRejected = false,
  onMessage,
  needed = [],
}: {
  locale: Locale;
  appId: string;
  requirements: SlotRequirement[];
  docs: SlotDoc[];
  photoUrl: string | null;
  editable: boolean;
  onlyRejected?: boolean;
  onMessage: (m: { ok: boolean; text: string }) => void;
  /** required slots still empty when Next was pressed: shown red */
  needed?: string[];
}) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `membership.wiz.docs.${k}`, v);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<string>('');
  const [busy, setBusy] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [crop, setCrop] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  // a phone or tablet (touch first): the camera is offered on every slot; a computer gets the QR code instead
  const [phone, setPhone] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setPhone(mq.matches);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    if (!qrOpen || qr) return;
    let live = true;
    void import('qrcode').then((QRCode) =>
      QRCode.toString(window.location.href, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }).then((svg) => {
        if (live) setQr(svg);
      }),
    );
    return () => {
      live = false;
    };
  }, [qrOpen, qr]);
  const [, start] = useTransition();
  const byKey = new Map(docs.map((d) => [d.key, d]));
  const rows = onlyRejected ? requirements.filter((r) => byKey.get(r.key)?.status === 'rejected') : requirements;

  const pick = (key: string, camera = false) => {
    target.current = key;
    if (input.current) {
      input.current.value = '';
      input.current.accept = camera ? 'image/*' : key === 'photo' ? 'image/jpeg,image/png,image/heic,.heic' : ACCEPT;
      // the back camera for papers, the front one for the applicant's own photo
      if (camera) input.current.setAttribute('capture', key === 'photo' ? 'user' : 'environment');
      else input.current.removeAttribute('capture');
      input.current.click();
    }
  };

  const send = async (key: string, raw: File) => {
    setBusy(key);
    try {
      const file = await toUploadable(raw);
      if (key === 'photo') {
        setCrop(file);
        return;
      }
      const fd = new FormData();
      fd.set('locale', locale);
      fd.set('app', appId);
      fd.set('key', key);
      fd.set('file', file);
      const r = await callAction(locale, () => uploadDocument(fd));
      onMessage({ ok: r.ok, text: r.message ?? '' });
      if (r.ok) start(() => router.refresh());
    } catch {
      onMessage({ ok: false, text: msg(locale, 'membership.errors.generic') });
    } finally {
      if (key !== 'photo') setBusy(null);
    }
  };

  const savePhotoBlob = async (jpeg: Blob) => {
    setSaving(true);
    const fd = new FormData();
    fd.set('locale', locale);
    fd.set('app', appId);
    fd.set('file', new File([jpeg], 'photo.jpg', { type: 'image/jpeg' }));
    const r = await callAction(locale, () => savePhoto(fd)).finally(() => setSaving(false));
    onMessage({ ok: r.ok, text: r.message ?? '' });
    if (r.ok) {
      setCrop(null);
      setBusy(null);
      start(() => router.refresh());
    }
  };

  const remove = async (doc: SlotDoc) => {
    setBusy(doc.key);
    const r = await callAction(locale, () => removeDocument(locale, doc.id));
    setBusy(null);
    if (!r.ok) onMessage({ ok: false, text: r.message ?? '' });
    else start(() => router.refresh());
  };

  const cropText = cropTextFor(locale);

  return (
    <>
      <input
        ref={input}
        type="file"
        hidden
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void send(target.current, f);
        }}
      />
      {editable && !onlyRejected && !phone && (
        <div className="slot-phone" data-testid="phone-camera">
          <button
            type="button"
            className="btn btn-w"
            aria-expanded={qrOpen}
            data-action="wiz.doc.phone"
            onClick={() => setQrOpen((o) => !o)}
          >
            <QrCode size={16} aria-hidden /> {t('phoneCamera')}
          </button>
          {qrOpen && (
            <div className="slot-qr">
              {qr ? (
                <span className="qr" role="img" aria-label={t('phoneQr')} dangerouslySetInnerHTML={{ __html: qr }} />
              ) : (
                <span className="qr" aria-hidden />
              )}
              <p>{t('phoneHow')}</p>
            </div>
          )}
        </div>
      )}
      <div className="slots">
        {rows.map((r) => {
          const doc = byKey.get(r.key);
          const isPhoto = r.key === 'photo';
          const has = Boolean(doc);
          const rej = doc?.status === 'rejected';
          const short = msg(locale, `membership.docs.${r.key}`);
          const need = !has && needed.includes(r.key);
          return (
            <div
              key={r.key}
              className={`slot ${has ? (rej ? 'bad' : 'ok') : ''} ${drag === r.key ? 'drag' : ''}`}
              data-doc={r.key}
              data-problem={`doc:${r.key}`}
              data-need={need || undefined}
              onDragOver={(e) => {
                if (!editable) return;
                e.preventDefault();
                setDrag(r.key);
              }}
              onDragLeave={() => setDrag(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(null);
                const f = e.dataTransfer.files?.[0];
                if (editable && f) void send(r.key, f);
              }}
            >
              <div className="slot-i">
                {isPhoto && photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file
                  <img src={photoUrl} alt="" />
                ) : has ? (
                  rej ? (
                    <X size={22} color="#fff" aria-hidden />
                  ) : (
                    <Check size={22} color="#fff" aria-hidden />
                  )
                ) : isPhoto ? (
                  <Camera size={22} color="#94a3b8" aria-hidden />
                ) : r.key === 'cnic' ? (
                  <IdCard size={22} color="#94a3b8" aria-hidden />
                ) : (
                  <FileText size={22} color="#94a3b8" aria-hidden />
                )}
              </div>
              <div className="slot-b">
                <b>
                  {short}
                  {!r.required && <small className="opt"> {t('optional')}</small>}
                </b>
                <small>{r.label_en}</small>
                {need && <em className="need-msg">{t('neededNow')}</em>}
                {doc && (
                  <em>
                    {isPhoto ? t('photoName') : doc.file_name}
                    {rej ? ` — ${doc.reject_reason || t('rejected')}` : ''}
                  </em>
                )}
              </div>
              <div className="slot-a">
                {doc ? (
                  <>
                    {doc.url && (
                      <a
                        className="btn btn-w"
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        data-action="wiz.doc.view"
                      >
                        {t('view')}
                      </a>
                    )}
                    {editable && (
                      <button
                        type="button"
                        className={`btn btn-w ${rej ? 'btn-danger' : ''}`}
                        onClick={() => pick(r.key)}
                        disabled={busy === r.key}
                        data-action={rej ? 'app.fix.upload' : 'wiz.doc.upload'}
                        aria-label={`${rej ? t('reupload') : t('change')}: ${short}`}
                      >
                        {busy === r.key ? t('uploading') : rej ? t('reupload') : t('change')}
                      </button>
                    )}
                    {editable && !onlyRejected && (
                      <button
                        type="button"
                        className="btn btn-w"
                        onClick={() => void remove(doc)}
                        disabled={busy === r.key}
                        data-action="wiz.doc.remove"
                        aria-label={`${t('remove')}: ${short}`}
                      >
                        {t('remove')}
                      </button>
                    )}
                  </>
                ) : (
                  editable && (
                    <>
                      {phone && !isPhoto && (
                        <button
                          type="button"
                          className="btn btn-primary btn-w"
                          onClick={() => pick(r.key, true)}
                          disabled={busy === r.key}
                          data-action="wiz.doc.camera"
                          aria-label={`${t('takePhoto')}: ${short}`}
                        >
                          <Camera size={16} aria-hidden /> {t('takePhoto')}
                        </button>
                      )}
                      <button
                        type="button"
                        className={`btn ${phone && !isPhoto ? '' : 'btn-primary'} btn-w`}
                        onClick={() => pick(r.key)}
                        disabled={busy === r.key}
                        data-action={isPhoto ? 'wiz.photo' : 'wiz.doc.upload'}
                        aria-label={`${isPhoto ? t('addPhoto') : t('upload')}: ${short}`}
                      >
                        {isPhoto ? <Camera size={16} aria-hidden /> : <Upload size={16} aria-hidden />}{' '}
                        {busy === r.key ? t('uploading') : isPhoto ? t('addPhoto') : t('upload')}
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <PhotoCrop
        file={crop}
        text={cropText}
        busy={saving}
        onCancel={() => {
          setCrop(null);
          setBusy(null);
        }}
        onRetake={() => {
          setCrop(null);
          setBusy(null);
          pick('photo');
        }}
        onSave={(b) => void savePhotoBlob(b)}
      />
    </>
  );
}
