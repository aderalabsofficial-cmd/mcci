import 'server-only';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { rosette } from '@/lib/qr/rosette';

/**
 * Prints the certificate's signed QR on a COPY of its scan (docs/21 point 30; owner, 30 Oct 2026). The original scan is
 * never changed — it stays stored as the source (`scans/<id>/original.*`); this makes `scans/<id>/stamped.png`.
 *
 * Placement (MCCI's physical arrangement): before scanning, the green MCCI stamp is put in the round seal area at the
 * bottom-left, so its former place near the bottom-centre is free — the QR goes there. Nothing on the certificate is
 * moved or redrawn. The position is the QR's centre as a share of the page, its size in millimetres on paper
 * (25–30 mm; confirm by print-and-scan), converted with the scan's own resolution (DPI from the file, else the page
 * width setting). Staff see a preview and can adjust both before saving (lib/certificates/actions.ts).
 *
 * The QR is pure black on white with a white quiet zone of 4 modules, never stretched or cropped; around it a narrow
 * band carries the certificate's own security engraving (lib/qr/rosette.ts) and the reference is printed below.
 */
export interface QrPlacement {
  /** centre of the QR as a share of the page width (0.5 = middle) */
  cx: number;
  /** centre of the QR as a share of the page height (0.83 = lower part) */
  cy: number;
  /** QR side on paper, millimetres */
  mm: number;
}

/** the former green-stamp position, bottom-centre; MCCI can change it in settings (membership.certificateQr) */
export const DEFAULT_PLACEMENT: QrPlacement = { cx: 0.5, cy: 0.83, mm: 27 };
/** certificate width on paper when the scan carries no resolution (settings.membership.certificatePageWidthMm) */
export const DEFAULT_PAGE_WIDTH_MM = 280;

/** keeps a placement inside sane limits (the QR stays on the page and readable) */
export function normalPlacement(p: Partial<QrPlacement> | null | undefined): QrPlacement {
  const n = (v: unknown, d: number, lo: number, hi: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
  return {
    cx: n(p?.cx, DEFAULT_PLACEMENT.cx, 0.04, 0.96),
    cy: n(p?.cy, DEFAULT_PLACEMENT.cy, 0.04, 0.96),
    mm: n(p?.mm, DEFAULT_PLACEMENT.mm, 15, 45),
  };
}

/** pixels per millimetre of a scan: from its DPI when the file says, else from the page width */
export function pxPerMm(width: number, density: number | undefined, pageWidthMm = DEFAULT_PAGE_WIDTH_MM): number {
  if (density && density >= 100 && density <= 1200) return density / 25.4;
  return width / pageWidthMm;
}

/** where the tile goes and how big its parts are, in pixels of this scan (shared with the tests) */
export function qrTile(
  width: number,
  height: number,
  at: QrPlacement = DEFAULT_PLACEMENT,
  perMm: number = width / DEFAULT_PAGE_WIDTH_MM,
  modules = 41,
) {
  const p = normalPlacement(at);
  const size = Math.max(96, Math.round(p.mm * perMm));
  const quiet = Math.max(6, Math.ceil((4 * size) / modules)); // 4-module white quiet zone (ISO/IEC 18004)
  const band = Math.max(8, Math.round(size * 0.2)); // the engraving shows in this band around the white square
  const caption = Math.max(10, Math.round(size / 9));
  const tileW = size + 2 * (quiet + band);
  const tileH = tileW + caption;
  const left = Math.min(width - tileW, Math.max(0, Math.round(width * p.cx - tileW / 2)));
  const top = Math.min(height - tileH, Math.max(0, Math.round(height * p.cy - tileW / 2)));
  return { size, quiet, band, caption, tileW, tileH, left, top, placement: p };
}

export async function stampQr(
  scan: Uint8Array,
  code: string,
  url: string,
  at: QrPlacement = DEFAULT_PLACEMENT,
  pageWidthMm = DEFAULT_PAGE_WIDTH_MM,
): Promise<Buffer> {
  const first = await sharp(Buffer.from(scan)).metadata();
  // a phone or scanner may store the page turned, with a flag: work on the upright page (no other change to it)
  const upright = (first.orientation ?? 1) > 1 ? await sharp(Buffer.from(scan)).rotate().toBuffer() : Buffer.from(scan);
  const img = sharp(upright);
  const meta = await img.metadata();
  const width = meta.width ?? 1600;
  const height = meta.height ?? 1480;
  const density = first.density && first.density >= 100 ? first.density : undefined;
  const modules = QRCode.create(url, { errorCorrectionLevel: 'M' }).modules.size;
  const t = qrTile(width, height, at, pxPerMm(width, density, pageWidthMm), modules);
  const qr = await QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 0,
    width: t.size,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const pattern = rosette(code, t.tileW, 2.2); // heavier lines so the engraving survives printing
  const label = code.replace(/^MCCI-QR-/, '').replace(/[^A-Z0-9-]/g, '');
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${t.tileW}" height="${t.tileH}">` +
      `<rect width="100%" height="100%" rx="${t.quiet}" fill="#ffffff"/>` +
      pattern.svg.replace('<svg ', '<svg x="0" y="0" ') +
      `<rect x="${t.band}" y="${t.band}" width="${t.size + 2 * t.quiet}" height="${t.size + 2 * t.quiet}" fill="#ffffff"/>` +
      `<text x="50%" y="${t.tileW + t.caption * 0.72}" font-family="Arial, sans-serif" font-size="${Math.round(t.caption * 0.82)}" ` +
      `text-anchor="middle" fill="#000000">${label}</text></svg>`,
  );
  const out = img.composite([
    { input: tile, left: t.left, top: t.top },
    { input: qr, left: t.left + t.band + t.quiet, top: t.top + t.band + t.quiet },
  ]);
  // keeps the scan's resolution so the copy prints at the certificate's real size
  return (density ? out.withMetadata({ density }) : out).png().toBuffer();
}

/** the standalone QR for the staff portal: the SAME signed URL as on the certificate, large, black on white */
export async function standaloneQr(url: string, format: 'png' | 'svg', px = 1200): Promise<Buffer | string> {
  const opts = { errorCorrectionLevel: 'M' as const, margin: 4, color: { dark: '#000000', light: '#ffffff' } };
  if (format === 'svg') return QRCode.toString(url, { ...opts, type: 'svg' });
  return QRCode.toBuffer(url, { ...opts, type: 'png', width: px });
}
