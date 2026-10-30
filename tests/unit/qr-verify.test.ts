import { generateKeyPairSync } from 'node:crypto';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PLACEMENT, normalPlacement, pxPerMm, qrTile, stampQr, standaloneQr } from '@/lib/certificates/stamp';
import { rosette } from '@/lib/qr/rosette';
import { checkSignature, signingConfigured, signReference } from '@/lib/qr/sign';
import { verifyBase, verifyUrl } from '@/lib/qr/svg';

/** Signed QR links, the security rosette and the stamped certificate (docs/26). */
const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;
const pem = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const other = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const REF = 'MCCI-QR-ABCDE-23456';

describe('QR signature (lib/qr/sign.ts)', () => {
  const k = env({ QR_SIGNING_KEY: pem });

  it('signs a reference and accepts its own signature, also with the key base64-encoded on one line', () => {
    const sig = signReference(REF, k)!;
    expect(sig).toMatch(/^[A-Za-z0-9_-]{86}$/);
    expect(checkSignature(REF, sig, k)).toBe('valid');
    expect(checkSignature(REF, sig, env({ QR_SIGNING_KEY: Buffer.from(pem).toString('base64') }))).toBe('valid');
  });

  it('refuses a tampered signature, a signature for another reference, another key and malformed input', () => {
    const sig = signReference(REF, k)!;
    const flipped = (sig[10] === 'A' ? 'B' : 'A') + '';
    expect(checkSignature(REF, sig.slice(0, 10) + flipped + sig.slice(11), k)).toBe('invalid');
    expect(checkSignature('MCCI-QR-ABCDE-23457', sig, k)).toBe('invalid');
    expect(checkSignature(REF, sig, env({ QR_SIGNING_KEY: other }))).toBe('invalid');
    expect(checkSignature(REF, 'not-a-signature', k)).toBe('invalid');
    expect(checkSignature(REF, sig + 'A', k)).toBe('invalid');
  });

  it('without a key: no signature is made, a link without one is "absent", one with one cannot be checked', () => {
    expect(signReference(REF, env({}))).toBeNull();
    expect(checkSignature(REF, null, k)).toBe('absent');
    expect(checkSignature(REF, signReference(REF, k), env({}))).toBe('unconfigured');
    expect(signReference(REF, env({ QR_SIGNING_KEY: 'garbage' }))).toBeNull();
    // certificate stamping refuses to issue when this is false (lib/certificates/actions.ts confirmScan)
    expect(signingConfigured(env({}))).toBe(false);
    expect(signingConfigured(env({ QR_SIGNING_KEY: 'garbage' }))).toBe(false);
    expect(signingConfigured(k)).toBe(true);
  });
});

describe('verification links (lib/qr/svg.ts)', () => {
  it('a bare site address gets /verify (production had VERIFY_BASE_URL without it: links were 404)', () => {
    expect(verifyBase(env({ VERIFY_BASE_URL: 'https://app.mcci.aderalabs.tech' }))).toBe(
      'https://app.mcci.aderalabs.tech/verify',
    );
    expect(verifyBase(env({ VERIFY_BASE_URL: 'https://app.mcci.aderalabs.tech/' }))).toBe(
      'https://app.mcci.aderalabs.tech/verify',
    );
    expect(verifyBase(env({ VERIFY_BASE_URL: 'https://app.mcci.aderalabs.tech/verify/' }))).toBe(
      'https://app.mcci.aderalabs.tech/verify',
    );
    expect(verifyBase(env({ APP_URL: 'https://app.mcci.aderalabs.tech/' }))).toBe(
      'https://app.mcci.aderalabs.tech/verify',
    );
  });

  it('carries the reference and, with a key, its signature', () => {
    const base = { APP_URL: 'https://app.mcci.aderalabs.tech' };
    expect(verifyUrl(REF, env(base))).toBe(`https://app.mcci.aderalabs.tech/verify/${REF}`);
    const signed = new URL(verifyUrl(REF, env({ ...base, QR_SIGNING_KEY: pem })));
    expect(signed.pathname).toBe(`/verify/${REF}`);
    expect(checkSignature(REF, signed.searchParams.get('s'), env({ QR_SIGNING_KEY: pem }))).toBe('valid');
  });
});

describe('security rosette (lib/qr/rosette.ts)', () => {
  it('is the same for the same reference and different for another', () => {
    const a = rosette(REF, 220);
    expect(rosette(REF, 220)).toEqual(a);
    expect(a.fingerprint).toMatch(/^[0-9A-F]{8}$/);
    const b = rosette('MCCI-QR-ABCDE-23457', 220);
    expect(b.fingerprint).not.toBe(a.fingerprint);
    expect(b.svg).not.toBe(a.svg);
    expect(a.svg).toMatch(/^<svg [^>]*viewBox="0 0 220 220"/);
  });
});

describe('stamped certificate (lib/certificates/stamp.ts)', () => {
  it('keeps the QR exactly as scannable (same pixels, white quiet zone) with the rosette around it, the rest untouched', async () => {
    const width = 1600;
    const height = 1480;
    const grey = { r: 221, g: 221, b: 221 };
    const scan = await sharp({ create: { width, height, channels: 3, background: grey } })
      .png()
      .toBuffer();
    const url = `https://app.mcci.aderalabs.tech/verify/${REF}`;
    const out = await stampQr(scan, REF, url);
    const modules = QRCode.create(url, { errorCorrectionLevel: 'M' }).modules.size;
    const t = qrTile(width, height, DEFAULT_PLACEMENT, pxPerMm(width, undefined), modules);
    expect(t.quiet).toBeGreaterThanOrEqual((4 * t.size) / modules); // a full 4-module quiet zone
    const raw = await sharp(out).removeAlpha().raw().toBuffer();
    const px = (x: number, y: number): [number, number, number] => [
      raw[(y * width + x) * 3]!,
      raw[(y * width + x) * 3 + 1]!,
      raw[(y * width + x) * 3 + 2]!,
    ];

    // 1. the QR itself, pixel for pixel
    const qr = await sharp(
      await QRCode.toBuffer(url, { type: 'png', errorCorrectionLevel: 'M', margin: 0, width: t.size }),
    )
      .removeAlpha()
      .raw()
      .toBuffer();
    const x0 = t.left + t.band + t.quiet;
    const y0 = t.top + t.band + t.quiet;
    let diff = 0;
    for (let y = 0; y < t.size; y++)
      for (let x = 0; x < t.size; x++) if (px(x0 + x, y0 + y)[0] !== qr[(y * t.size + x) * 3]) diff++;
    expect(diff).toBe(0);

    // 2. its quiet zone is pure white all round
    for (let i = -t.quiet; i < t.size + t.quiet; i++) {
      for (const [x, y] of [
        [x0 + i, y0 - t.quiet],
        [x0 + i, y0 + t.size + t.quiet - 1],
        [x0 - t.quiet, y0 + i],
        [x0 + t.size + t.quiet - 1, y0 + i],
      ] as const)
        expect(px(x, y)).toEqual([255, 255, 255]);
    }

    // 3. the band around it carries the rosette (coloured lines, not just white)
    let inked = 0;
    for (let y = t.top; y < t.top + t.band; y++)
      for (let x = t.left; x < t.left + t.tileW; x++) {
        const [r, g, b] = px(x, y);
        if (r < 230 || g < 230 || b < 230) inked++;
      }
    expect(inked).toBeGreaterThan(50);

    // 4. outside the tile the scan is unchanged
    for (const [x, y] of [
      [10, 10],
      [width - 10, height - 10],
      [t.left - 2, t.top + 5],
      [t.left + 5, t.top + t.tileH + 2],
    ] as const)
      expect(px(x, y)).toEqual([grey.r, grey.g, grey.b]);
  });
});

describe('QR placement (lib/certificates/stamp.ts)', () => {
  it('defaults to the former green-stamp position, 27 mm, relative to the scan and sized from its resolution', () => {
    expect(DEFAULT_PLACEMENT).toEqual({ cx: 0.5, cy: 0.83, mm: 27 });
    const at300dpi = qrTile(3000, 2800, DEFAULT_PLACEMENT, pxPerMm(3000, 300));
    expect(at300dpi.size).toBe(Math.round((27 * 300) / 25.4));
    const small = qrTile(1600, 1480, { cx: 0.5, cy: 0.83, mm: 27 }, pxPerMm(1600, undefined, 280));
    expect(small.size).toBe(Math.round((27 * 1600) / 280));
    expect(small.left + small.tileW / 2).toBeCloseTo(800, 0);
  });

  it('keeps a placement on the page and within size limits', () => {
    expect(normalPlacement({ cx: 5, cy: -1, mm: 500 })).toEqual({ cx: 0.96, cy: 0.04, mm: 45 });
    expect(normalPlacement(null)).toEqual(DEFAULT_PLACEMENT);
    const corner = qrTile(1000, 1000, { cx: 0.96, cy: 0.96, mm: 45 }, 4);
    expect(corner.left + corner.tileW).toBeLessThanOrEqual(1000);
    expect(corner.top + corner.tileH).toBeLessThanOrEqual(1000);
  });

  it('never stretches: the standalone QR is square, high resolution, and carries the same link', async () => {
    const url = `https://app.mcci.aderalabs.tech/verify/${REF}?s=${'a'.repeat(86)}`;
    const png = await sharp((await standaloneQr(url, 'png')) as Buffer).metadata();
    expect(png.width).toBe(1200);
    expect(png.height).toBe(1200);
    expect(await standaloneQr(url, 'svg')).toContain('<svg');
  });
});
