/** What may be published on a post or an event, within the 10 MB the site's upload route allows. No SVG: it can carry script. */
export const CONTENT_MAX = 10 * 1024 * 1024;
export const CONTENT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf,video/mp4';

export interface ContentMediaRow {
  id: string;
  kind: 'image' | 'video' | 'file';
  path: string;
  file_name: string;
  caption: string | null;
}

export function checkContentMedia(
  name: string,
  b: Uint8Array,
): { ok: true; ext: string; mime: string; kind: ContentMediaRow['kind'] } | { ok: false; reason: 'type' | 'size' } {
  if (b.length === 0) return { ok: false, reason: 'type' };
  if (b.length > CONTENT_MAX) return { ok: false, reason: 'size' };
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if ((ext === 'jpg' || ext === 'jpeg') && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return { ok: true, ext: 'jpg', mime: 'image/jpeg', kind: 'image' };
  if (ext === 'png' && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return { ok: true, ext: 'png', mime: 'image/png', kind: 'image' };
  if (ext === 'webp' && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45)
    return { ok: true, ext: 'webp', mime: 'image/webp', kind: 'image' };
  if (ext === 'pdf' && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46)
    return { ok: true, ext: 'pdf', mime: 'application/pdf', kind: 'file' };
  if (ext === 'mp4' && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70)
    return { ok: true, ext: 'mp4', mime: 'video/mp4', kind: 'video' };
  return { ok: false, reason: 'type' };
}

/** the published address of a file; site-media holds only what MCCI publishes */
export function contentMediaUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/storage/v1/object/public/site-media/${path.split('/').map(encodeURIComponent).join('/')}`;
}
