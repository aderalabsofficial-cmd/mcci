/**
 * What a file really is, from its first bytes (docs/08 upload pipeline step 3): the name and the browser's MIME type
 * are chosen by the client and prove nothing. Only PDF, JPEG, PNG and HEIC are accepted for applications; encrypted
 * PDFs are refused because nobody at MCCI (or the AI reader) could open them.
 */
export type FileKind = 'pdf' | 'jpeg' | 'png' | 'heic';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const MIME: Record<FileKind, string> = {
  pdf: 'application/pdf',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
};
export const EXT: Record<FileKind, string> = { pdf: 'pdf', jpeg: 'jpg', png: 'png', heic: 'heic' };

const starts = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

export function sniff(bytes: Uint8Array): FileKind | null {
  if (starts(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf'; // %PDF-
  if (starts(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (
    bytes.length > 12 &&
    ascii(bytes, 4, 8) === 'ftyp' &&
    /^(heic|heix|heim|heis|mif1|msf1)$/.test(ascii(bytes, 8, 12))
  )
    return 'heic';
  return null;
}

/** an encrypted PDF declares /Encrypt in its trailer or a cross-reference stream dictionary */
export function isEncryptedPdf(bytes: Uint8Array): boolean {
  const text = new TextDecoder('latin1').decode(bytes);
  return /\/Encrypt\s/.test(text) || /\/Encrypt\s*\d+\s+\d+\s+R/.test(text);
}

export type UploadProblem = 'empty' | 'tooBig' | 'type' | 'encrypted';

export function checkUpload(
  bytes: Uint8Array,
  allowed: readonly FileKind[],
): { kind: FileKind } | { problem: UploadProblem } {
  if (bytes.length === 0) return { problem: 'empty' };
  if (bytes.length > MAX_UPLOAD_BYTES) return { problem: 'tooBig' };
  const kind = sniff(bytes);
  if (!kind || !allowed.includes(kind)) return { problem: 'type' };
  if (kind === 'pdf' && isEncryptedPdf(bytes)) return { problem: 'encrypted' };
  return { kind };
}
