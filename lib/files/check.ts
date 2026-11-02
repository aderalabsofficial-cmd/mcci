/**
 * A supporting document (a receipt, a tax return, a deed): PDF, JPEG or PNG up to 10 MB. The first bytes must match the
 * claimed type, so a renamed file is refused. Not virus-scanned: the server has no scanner (docs/30 §9).
 */
export const DOC_MAX = 10 * 1024 * 1024;

export function checkDocument(
  name: string,
  bytes: Uint8Array,
): { ok: true; ext: string; mime: string } | { ok: false; reason: 'type' | 'size' } {
  if (bytes.length === 0) return { ok: false, reason: 'type' };
  if (bytes.length > DOC_MAX) return { ok: false, reason: 'size' };
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const pdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (ext === 'pdf' && pdf) return { ok: true, ext: 'pdf', mime: 'application/pdf' };
  if ((ext === 'jpg' || ext === 'jpeg') && jpg) return { ok: true, ext: 'jpg', mime: 'image/jpeg' };
  if (ext === 'png' && png) return { ok: true, ext: 'png', mime: 'image/png' };
  return { ok: false, reason: 'type' };
}
