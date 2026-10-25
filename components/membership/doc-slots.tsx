'use client';

import { Camera, Check, FileText, IdCard, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import type { Locale } from '@/i18n/routing';
import { removeDocument, savePhoto, uploadDocument } from '@/lib/membership/actions';
import { msg } from '@/lib/nav/model';
import { type CropText, PhotoCrop } from './photo-crop';

/**
 * Document slots of the application (prototype slot(): one row per required document, in the form's order) with
 * upload / phone camera / drag-and-drop, preview, replace and remove (actions wiz.doc.upload, wiz.doc.view,
 * wiz.doc.remove, app.fix.upload, wiz.photo → photo.save). Files are checked again on the server (type, size).
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

async function toUploadable(file: File): Promise<File> {
  const heic = /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
  if (!heic) return file;
  const { default: heic2any } = await import('heic2any');
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob = Array.isArray(out) ? out[0]! : out;
  return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
}

export function DocSlots({
  locale,
  appId,
  requirements,
  docs,
  photoUrl,
  editable,
  onlyRejected = false,
  onMessage,
}: {
  locale: Locale;
  appId: string;
  requirements: SlotRequirement[];
  docs: SlotDoc[];
  photoUrl: string | null;
  editable: boolean;
  onlyRejected?: boolean;
  onMessage: (m: { ok: boolean; text: string }) => void;
}) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `membership.wiz.docs.${k}`, v);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<string>('');
  const [busy, setBusy] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [crop, setCrop] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [, start] = useTransition();
  const byKey = new Map(docs.map((d) => [d.key, d]));
  const rows = onlyRejected ? requirements.filter((r) => byKey.get(r.key)?.status === 'rejected') : requirements;

  const pick = (key: string) => {
    target.current = key;
    if (input.current) {
      input.current.value = '';
      input.current.accept = key === 'photo' ? 'image/jpeg,image/png,image/heic,.heic' : ACCEPT;
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
      const r = await uploadDocument(fd);
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
    const r = await savePhoto(fd).finally(() => setSaving(false));
    onMessage({ ok: r.ok, text: r.message ?? '' });
    if (r.ok) {
      setCrop(null);
      setBusy(null);
      start(() => router.refresh());
    }
  };

  const remove = async (doc: SlotDoc) => {
    setBusy(doc.key);
    const r = await removeDocument(locale, doc.id);
    setBusy(null);
    if (!r.ok) onMessage({ ok: false, text: r.message ?? '' });
    else start(() => router.refresh());
  };

  const cropText: CropText = {
    title: msg(locale, 'membership.wiz.photo.title'),
    intro: msg(locale, 'membership.wiz.photo.help'),
    zoom: msg(locale, 'membership.wiz.photo.zoom'),
    brightness: msg(locale, 'membership.wiz.photo.brightness'),
    retake: msg(locale, 'membership.wiz.photo.retake'),
    save: msg(locale, 'membership.wiz.photo.save'),
    close: msg(locale, 'common.close'),
    resolutionOk: msg(locale, 'membership.wiz.photo.resolutionOk'),
    resolutionLow: msg(locale, 'membership.wiz.photo.resolutionLow'),
    brightFixed: msg(locale, 'membership.wiz.photo.brightFixed'),
    brightOk: msg(locale, 'membership.wiz.photo.brightOk'),
    face: msg(locale, 'membership.wiz.photo.face'),
    working: msg(locale, 'membership.wiz.working'),
  };

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
      <div className="slots">
        {rows.map((r) => {
          const doc = byKey.get(r.key);
          const isPhoto = r.key === 'photo';
          const has = Boolean(doc);
          const rej = doc?.status === 'rejected';
          const short = msg(locale, `membership.docs.${r.key}`);
          return (
            <div
              key={r.key}
              className={`slot ${has ? (rej ? 'bad' : 'ok') : ''} ${drag === r.key ? 'drag' : ''}`}
              data-doc={r.key}
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
                    <button
                      type="button"
                      className="btn btn-primary btn-w"
                      onClick={() => pick(r.key)}
                      disabled={busy === r.key}
                      data-action={isPhoto ? 'wiz.photo' : 'wiz.doc.upload'}
                      aria-label={`${isPhoto ? t('addPhoto') : t('upload')}: ${short}`}
                    >
                      {isPhoto ? <Camera size={16} aria-hidden /> : <Upload size={16} aria-hidden />}{' '}
                      {busy === r.key ? t('uploading') : isPhoto ? t('addPhoto') : t('upload')}
                    </button>
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
