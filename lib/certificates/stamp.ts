import 'server-only';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { rosette } from '@/lib/qr/rosette';

/**
 * Prints the certificate's QR code on its scan (docs/21 point 30). MCCI's security-press certificate has a small empty
 * space at the top right, under "Serial No." and beside the "MEMBERSHIP CERTIFICATE" heading: the QR goes there, on a
 * white tile with the code under it, so a phone scan opens the verified record on the MCCI website. The position is a
 * share of the page (settings.certificateQr: right, top, size — MCCI can move it without a deploy); the scan is not
 * changed otherwise. The result is a PNG at the scan's own size.
 *
 * Behind the QR sits the certificate's own security rosette (lib/qr/rosette.ts, drawn from the same reference the
 * public verification page draws it from), in a band around the QR's white quiet zone: the QR keeps exactly the size
 * and clear margin it had, so it scans as before.
 */
export interface QrPlacement {
  /** right edge of the tile, as a share of the page width (0.915 = 91.5 % from the left) */
  right: number;
  /** top of the tile, as a share of the page height */
  top: number;
  /** QR side, as a share of the page width */
  size: number;
}

/** measured on MCCI's certificate (1600 × 1480 scan): the space right of the heading, under the serial number */
export const DEFAULT_PLACEMENT: QrPlacement = { right: 0.915, top: 0.128, size: 0.055 };

/** where the tile goes and how big its parts are, in pixels of a scan of this size (shared with the tests) */
export function qrTile(width: number, height: number, at: QrPlacement = DEFAULT_PLACEMENT) {
  const size = Math.max(72, Math.round(width * at.size));
  const quiet = Math.max(4, Math.round(size / 16)); // white margin the QR needs around it
  const band = Math.max(8, Math.round(size * 0.24)); // the rosette shows in this band around the white square
  const caption = Math.max(9, Math.round(size / 9));
  const tileW = size + 2 * (quiet + band);
  const tileH = tileW + caption;
  const left = Math.min(width - tileW, Math.max(0, Math.round(width * at.right) - tileW));
  const top = Math.min(height - tileH, Math.max(0, Math.round(height * at.top)));
  return { size, quiet, band, caption, tileW, tileH, left, top };
}

export async function stampQr(
  scan: Uint8Array,
  code: string,
  url: string,
  at: QrPlacement = DEFAULT_PLACEMENT,
): Promise<Buffer> {
  const img = sharp(Buffer.from(scan)).rotate();
  const meta = await img.metadata();
  const width = meta.width ?? 1600;
  const height = meta.height ?? 1480;
  const { size, quiet, band, caption, tileW, tileH, left, top } = qrTile(width, height, at);
  const qr = await QRCode.toBuffer(url, { type: 'png', errorCorrectionLevel: 'M', margin: 0, width: size });
  const pattern = rosette(code, tileW, 2.2); // heavier lines so the pattern survives printing
  const label = code.replace(/^MCCI-QR-/, '').replace(/[^A-Z0-9-]/g, '');
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">` +
      `<rect width="100%" height="100%" rx="${quiet}" fill="#ffffff"/>` +
      pattern.svg.replace('<svg ', '<svg x="0" y="0" ') +
      `<rect x="${band}" y="${band}" width="${size + 2 * quiet}" height="${size + 2 * quiet}" fill="#ffffff"/>` +
      `<text x="50%" y="${tileW + caption * 0.72}" font-family="Arial, sans-serif" font-size="${Math.round(caption * 0.82)}" ` +
      `text-anchor="middle" fill="#0b2a5b">${label}</text></svg>`,
  );
  return img
    .composite([
      { input: tile, left, top },
      { input: qr, left: left + band + quiet, top: top + band + quiet },
    ])
    .png()
    .toBuffer();
}
