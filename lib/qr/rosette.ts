import { createHash } from 'node:crypto';

/**
 * MCCI Digital Security Engraving v2 (owner, 30 Oct 2026; docs/26): a certificate-specific guilloche drawn from the
 * certificate's own reference, so every certificate has its own engraving and the same certificate always gets
 * exactly the same one (deterministic: no randomness, no time). Layers, outside in:
 *   1. a microtext ring — "MCCI · MULTAN CHAMBER OF COMMERCE & INDUSTRY · <fingerprint>" repeated (photocopies blur it);
 *   2. an interlaced guilloche rope band (phase-shifted sine bands, banknote style);
 *   3. two fine epitrochoid / hypotrochoid rosettes whose petal counts, pen distances and phases come from the hash;
 *   4. a geometric centre: an eight-point star (two interlaced squares) with a sixteen-point inner star and a dotted
 *      ring — generic Islamic geometry; the official MCCI logo is not used or changed.
 * Line widths scale with `weight` (1 on screen, ~2.2 on the stamped certificate so it survives printing).
 *
 * It is a visual anti-counterfeiting and comparison aid only. Authenticity comes from the signed QR and the database
 * check (lib/qr/sign.ts). The fingerprint is the first 8 hex digits of the same hash, shown under the engraving on the
 * public verification page.
 */
export interface Rosette {
  svg: string;
  fingerprint: string;
}

const NAVY = '#0b2a5b';
const GOLD = '#b8862f';
const TEAL = '#1f8a83';
const f2 = (n: number) => n.toFixed(2);

function polyline(points: [number, number][]): string {
  return `M${points.map(([x, y]) => `${f2(x)} ${f2(y)}`).join('L')}Z`;
}

/** epitrochoid (outside = true) or hypotrochoid, closed after one turn for whole-number ratios */
function trochoid(c: number, R: number, r: number, d: number, outside: boolean, phase: number, steps: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI + phase;
    if (outside) {
      const k = (R + r) / r;
      pts.push([c + (R + r) * Math.cos(t) - d * Math.cos(k * t), c + (R + r) * Math.sin(t) - d * Math.sin(k * t)]);
    } else {
      const k = (R - r) / r;
      pts.push([c + (R - r) * Math.cos(t) + d * Math.cos(k * t), c + (R - r) * Math.sin(t) - d * Math.sin(k * t)]);
    }
  }
  return polyline(pts);
}

/** one strand of the rope band: a circle of radius mid whose radius waves n times around */
function wave(c: number, mid: number, amp: number, n: number, phase: number, steps: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const r = mid + amp * Math.sin(n * t + phase);
    pts.push([c + r * Math.cos(t), c + r * Math.sin(t)]);
  }
  return polyline(pts);
}

/** a star polygon {points/step} on radius r */
function star(c: number, r: number, points: number, step: number, rot: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const t = rot + (i * step * 2 * Math.PI) / points;
    pts.push([c + r * Math.cos(t), c + r * Math.sin(t)]);
  }
  return polyline(pts);
}

/** weight scales the line widths only (thicker for print); the geometry and fingerprint depend on the reference alone */
export function rosette(reference: string, size = 320, weight = 1): Rosette {
  const h = createHash('sha256').update(`MCCI-ENGRAVING:v2:${reference}`).digest();
  const byte = (i: number) => h[i % h.length]!;
  const fingerprint = h.subarray(0, 4).toString('hex').toUpperCase();
  const c = size / 2;
  const w = (x: number) => f2(x * weight * (size / 320));
  const parts: string[] = [];
  const path = (d: string, color: string, width: number, opacity = 0.9, dash?: string) =>
    parts.push(
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w(width)}" stroke-opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linejoin="round"/>`,
    );

  // 1. microtext ring
  const ringR = c * 0.935;
  const text = `MCCI · MULTAN CHAMBER OF COMMERCE &amp; INDUSTRY · ${fingerprint} · `; // XML-escaped
  parts.push(
    `<defs><path id="mt-${fingerprint}" d="M ${f2(c - ringR)} ${f2(c)} a ${f2(ringR)} ${f2(ringR)} 0 1 1 ${f2(2 * ringR)} 0 a ${f2(ringR)} ${f2(ringR)} 0 1 1 ${f2(-2 * ringR)} 0"/></defs>`,
    `<text font-family="Arial, Helvetica, sans-serif" font-size="${f2(size * 0.026)}" letter-spacing="${f2(size * 0.002)}" fill="${NAVY}" fill-opacity="0.75"><textPath href="#mt-${fingerprint}" xlink:href="#mt-${fingerprint}">${text.repeat(3)}</textPath></text>`,
  );
  parts.push(
    `<circle cx="${c}" cy="${c}" r="${f2(c * 0.975)}" fill="none" stroke="${GOLD}" stroke-width="${w(0.7)}"/>`,
  );
  parts.push(
    `<circle cx="${c}" cy="${c}" r="${f2(c * 0.895)}" fill="none" stroke="${GOLD}" stroke-width="${w(0.5)}"/>`,
  );

  // 2. interlaced rope band
  const n = 18 + (byte(0) % 10); // 18–27 waves around
  const strands = 6 + (byte(1) % 4); // 6–9 strands
  for (let k = 0; k < strands; k++) {
    path(
      wave(c, c * 0.8, c * 0.07, n, (k * 2 * Math.PI) / strands + byte(2) / 40, 900),
      k % 2 ? TEAL : NAVY,
      0.45,
      0.85,
    );
  }

  // 3. two fine trochoid rosettes
  const p1 = 9 + (byte(3) % 8); // 9–16 petals
  const R1 = c * 0.42;
  path(trochoid(c, R1, R1 / p1, (R1 / p1) * (2.2 + (byte(4) % 40) / 20), true, byte(5) / 50, 1400), NAVY, 0.4, 0.8);
  const p2 = 7 + (byte(6) % 7); // 7–13 petals
  const R2 = c * 0.58;
  path(trochoid(c, R2, R2 / p2, (R2 / p2) * (0.7 + (byte(7) % 30) / 100), false, byte(8) / 50, 1200), GOLD, 0.45, 0.9);

  // 4. geometric centre
  const rot = (byte(9) / 255) * (Math.PI / 8);
  path(star(c, c * 0.24, 8, 3, rot), NAVY, 0.6, 0.95);
  path(star(c, c * 0.24, 4, 1, rot), TEAL, 0.5, 0.9);
  path(star(c, c * 0.24, 4, 1, rot + Math.PI / 4), TEAL, 0.5, 0.9);
  path(star(c, c * 0.14, 16, 5, rot), GOLD, 0.35, 0.9);
  parts.push(
    `<circle cx="${c}" cy="${c}" r="${f2(c * 0.3)}" fill="none" stroke="${NAVY}" stroke-width="${w(0.5)}" stroke-dasharray="${w(1)} ${w(1.6)}"/>`,
    `<circle cx="${c}" cy="${c}" r="${f2(c * 0.035)}" fill="${GOLD}"/>`,
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="MCCI security engraving ${fingerprint}">` +
    parts.join('') +
    `</svg>`;
  return { svg, fingerprint };
}
