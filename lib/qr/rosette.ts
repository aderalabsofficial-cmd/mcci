import { createHash } from 'node:crypto';

/**
 * The certificate's security pattern (owner, 30 Oct 2026): a guilloche rosette — fine interlaced lines like those on
 * banknotes — drawn from the certificate's own reference, so every certificate has its own pattern and the same
 * certificate always gets exactly the same one (deterministic: no randomness, no time). It sits behind the QR on the
 * verification panel and on the public verification result, where anyone can compare it with the paper.
 *
 * It is a visual anti-counterfeiting and tamper-evidence layer only. Authenticity comes from the signed QR and the
 * database check (lib/qr/sign.ts), never from the picture. The "fingerprint" printed under it is the first 8 hex digits
 * of the same hash the pattern is drawn from.
 */
export interface Rosette {
  svg: string;
  fingerprint: string;
}

const NAVY = '#0b2a5b';
const GOLD = '#b8862f';
const TEAL = '#1f8a83';

/** hypotrochoid path: a circle of radius r rolling inside one of radius R, pen at distance d */
function curve(
  cx: number,
  cy: number,
  R: number,
  r: number,
  d: number,
  turns: number,
  phase: number,
  steps: number,
): string {
  const k = (R - r) / r;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI * turns + phase;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t);
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** weight scales the line widths only (thicker for print); the geometry and fingerprint depend on the reference alone */
export function rosette(reference: string, size = 320, weight = 1): Rosette {
  const h = createHash('sha256').update(`MCCI-ROSETTE:v1:${reference}`).digest();
  const byte = (i: number) => h[i % h.length]!;
  const c = size / 2;
  // rolling circles with whole-number ratios close neatly; the hash picks the ratios, pen distances and phases
  const layers = [0, 1, 2].map((j) => {
    const R = c * (0.92 - j * 0.2);
    const n = 7 + (byte(j * 3) % 9); // 7–15 petals
    const r = R / n;
    const d = r * (0.6 + (byte(j * 3 + 1) % 60) / 100);
    const phase = (byte(j * 3 + 2) / 255) * Math.PI;
    return {
      path: curve(c, c, R, r, d, 1, phase, 720),
      color: [NAVY, TEAL, GOLD][j]!,
      w: (j === 0 ? 0.55 : 0.45) * weight,
    };
  });
  const rings = [0.96, 0.62, 0.3].map(
    (f, j) =>
      `<circle cx="${c}" cy="${c}" r="${(c * f).toFixed(1)}" fill="none" stroke="${[GOLD, NAVY, TEAL][j]}" stroke-width="${(0.6 * weight).toFixed(2)}" stroke-dasharray="${2 + (byte(10 + j) % 4)} ${1 + (byte(13 + j) % 3)}"/>`,
  );
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="MCCI security pattern">` +
    rings.join('') +
    layers
      .map((l) => `<path d="${l.path}" fill="none" stroke="${l.color}" stroke-width="${l.w}" stroke-opacity="0.85"/>`)
      .join('') +
    `</svg>`;
  return { svg, fingerprint: h.subarray(0, 4).toString('hex').toUpperCase() };
}
