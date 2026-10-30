import type { MediaKind } from './provider/types';

/**
 * What may be attached, within WhatsApp's own size limits. The file's first bytes must match its claimed type, so a
 * renamed file is refused. Uploads are not virus-scanned: the server has no scanner (docs/30 §9).
 */
const RULES: { mime: string; ext: string[]; kind: MediaKind; max: number; magic: (b: Uint8Array) => boolean }[] = [
  {
    mime: 'image/jpeg',
    ext: ['jpg', 'jpeg'],
    kind: 'image',
    max: 5 * 1024 * 1024,
    magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    ext: ['png'],
    kind: 'image',
    max: 5 * 1024 * 1024,
    magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'application/pdf',
    ext: ['pdf'],
    kind: 'document',
    max: 16 * 1024 * 1024,
    magic: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
  {
    mime: 'video/mp4',
    ext: ['mp4'],
    kind: 'video',
    max: 16 * 1024 * 1024,
    magic: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70,
  },
  {
    mime: 'audio/mpeg',
    ext: ['mp3'],
    kind: 'audio',
    max: 16 * 1024 * 1024,
    magic: (b) => (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && ((b[1] ?? 0) & 0xe0) === 0xe0),
  },
  {
    mime: 'audio/ogg',
    ext: ['ogg'],
    kind: 'audio',
    max: 16 * 1024 * 1024,
    magic: (b) => b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53,
  },
];

export type MediaCheck =
  { ok: true; kind: MediaKind; mime: string; ext: string } | { ok: false; reason: 'type' | 'size' };

export function checkMedia(name: string, mime: string, bytes: Uint8Array): MediaCheck {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const rule = RULES.find((r) => r.mime === mime && r.ext.includes(ext));
  if (!rule || !rule.magic(bytes)) return { ok: false, reason: 'type' };
  if (bytes.length > rule.max || bytes.length === 0) return { ok: false, reason: 'size' };
  return { ok: true, kind: rule.kind, mime: rule.mime, ext };
}

export const MEDIA_ACCEPT = RULES.map((r) => r.mime).join(',');

/** the safe personalisation names; anything else in {{...}} is left as typed */
export const VARIABLES = [
  'business_name',
  'membership_number',
  'contact_person',
  'membership_category',
  'business_sector',
  'city',
  'district',
  'renewal_date',
  'language',
] as const;
export const CATEGORIES = ['announcements', 'membership', 'events', 'opportunities'] as const;

export function renderPreview(text: string, values: Record<string, string | null | undefined>): string {
  return VARIABLES.reduce((t, k) => t.split(`{{${k}}}`).join(values[k] ?? ''), text);
}

/** a template's {{1}} placeholders filled through its explicit mapping, for the preview only */
export function renderTemplate(
  body: string,
  map: Record<string, string>,
  values: Record<string, string | null | undefined>,
): string {
  return body.replace(/\{\{([0-9]+)\}\}/g, (all, n: string) => {
    const key = map[n];
    return key ? (values[key] ?? `[${key}?]`) : all;
  });
}

export const placeholders = (body: string | null | undefined): string[] => [
  ...new Set([...(body ?? '').matchAll(/\{\{([0-9]+)\}\}/g)].map((m) => m[1]!)),
];
