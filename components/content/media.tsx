'use client';

import { File as FileIcon, ImagePlus, Trash2, Video } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import type { Locale } from '@/i18n/routing';
import { removeContentMedia } from '@/lib/content/actions';
import { CONTENT_ACCEPT, CONTENT_MAX, contentMediaUrl, type ContentMediaRow } from '@/lib/content/media';
import { msg } from '@/lib/nav/model';

export interface MediaFieldHandle {
  /** uploads what was chosen, once the post or event has its id; returns the failures to show */
  upload: (id: string) => Promise<string[]>;
}

/**
 * Photos, videos and files on a post or an event: choose several, see them at once with their previews, remove any.
 * New files go up right after the post is saved, so a new post can carry them too.
 */
export const MediaField = forwardRef<
  MediaFieldHandle,
  { locale: Locale; owner: 'post' | 'event'; existing?: ContentMediaRow[] }
>(function MediaField({ locale, owner, existing = [] }, ref) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.media.${k}`, v);
  const [files, setFiles] = useState<File[]>([]);
  const [saved, setSaved] = useState(existing);
  const [problem, setProblem] = useState<string | null>(null);
  useImperativeHandle(ref, () => ({
    upload: async (id: string) => {
      const failed: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.set('file', file);
        body.set(owner, id);
        try {
          const res = await fetch('/api/content/media', { method: 'POST', body });
          if (!res.ok) failed.push(file.name);
        } catch {
          failed.push(file.name);
        }
      }
      setFiles([]);
      return failed;
    },
  }));
  return (
    <fieldset className="media-field" data-media-field>
      <legend>{m('title')}</legend>
      <label className="media-drop">
        <ImagePlus size={22} aria-hidden />
        <span>
          <b>{m('add')}</b>
          <small>{m('help')}</small>
        </span>
        <input
          type="file"
          multiple
          accept={CONTENT_ACCEPT}
          data-field="media-files"
          aria-label={m('add')}
          onChange={(e) => {
            const chosen = [...(e.target.files ?? [])];
            e.target.value = '';
            const big = chosen.filter((f) => f.size > CONTENT_MAX);
            setProblem(big.length ? m('tooBig', { names: big.map((f) => f.name).join(', ') }) : null);
            setFiles((x) => [...x, ...chosen.filter((f) => f.size <= CONTENT_MAX)]);
          }}
        />
      </label>
      {problem && (
        <p className="banner red" role="alert">
          {problem}
        </p>
      )}
      {(saved.length > 0 || files.length > 0) && (
        <ul className="media-list">
          {saved.map((s) => (
            <li key={s.id} data-media={s.file_name}>
              {s.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- a published file in the public media bucket
                <img src={contentMediaUrl(s.path)} alt={s.caption ?? s.file_name} />
              ) : s.kind === 'video' ? (
                <Video size={28} aria-hidden />
              ) : (
                <FileIcon size={28} aria-hidden />
              )}
              <small>{s.file_name}</small>
              <button
                type="button"
                className="btn btn-w"
                data-action="media.remove"
                aria-label={m('remove', { name: s.file_name })}
                onClick={async () => {
                  const r = await removeContentMedia(locale, s.id);
                  if (r.ok) setSaved((x) => x.filter((y) => y.id !== s.id));
                  else setProblem(r.message);
                }}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </li>
          ))}
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} data-media-new={f.name}>
              {f.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local preview before upload
                <img src={URL.createObjectURL(f)} alt={f.name} />
              ) : f.type.startsWith('video/') ? (
                <Video size={28} aria-hidden />
              ) : (
                <FileIcon size={28} aria-hidden />
              )}
              <small>
                {f.name} · {m('waiting')}
              </small>
              <button
                type="button"
                className="btn btn-w"
                data-action="media.drop"
                aria-label={m('remove', { name: f.name })}
                onClick={() => setFiles((x) => x.filter((_, n) => n !== i))}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
});

/** a post's or event's published media on the public site */
export function MediaGallery({ locale, media }: { locale: Locale; media: ContentMediaRow[] }) {
  if (!media.length) return null;
  const images = media.filter((x) => x.kind === 'image');
  const videos = media.filter((x) => x.kind === 'video');
  const files = media.filter((x) => x.kind === 'file');
  return (
    <div className="media-gallery" data-gallery>
      {images.length > 0 && (
        <div className={`media-photos n${Math.min(images.length, 3)}`}>
          {images.map((x) => (
            <a key={x.id} href={contentMediaUrl(x.path)} target="_blank" rel="noreferrer" data-action="media.open">
              {/* eslint-disable-next-line @next/next/no-img-element -- a published file in the public media bucket */}
              <img src={contentMediaUrl(x.path)} alt={x.caption ?? x.file_name} loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {videos.map((x) => (
        <video key={x.id} controls preload="metadata" src={contentMediaUrl(x.path)} aria-label={x.caption ?? x.file_name} />
      ))}
      {files.length > 0 && (
        <p className="pb">
          {files.map((x) => (
            <a key={x.id} className="btn" href={contentMediaUrl(x.path)} target="_blank" rel="noreferrer" data-action="media.file">
              <FileIcon size={15} aria-hidden /> {msg(locale, 'eng.media.download', { name: x.file_name })}
            </a>
          ))}
        </p>
      )}
    </div>
  );
}
