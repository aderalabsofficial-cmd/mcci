import { describe, expect, it } from 'vitest';
import { qrSvg, verifyUrl } from '@/lib/qr/svg';
import { CODE, normalizeCode } from '@/lib/verify/admin';

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe('QR verification link (docs/08 "QR & verification")', () => {
  it('points at VERIFY_BASE_URL, else APP_URL/verify, with the code as the last segment', () => {
    expect(verifyUrl('MCCI-QR-ABCDE-23456', env({ APP_URL: 'https://app.example.test/' }))).toBe(
      'https://app.example.test/verify/MCCI-QR-ABCDE-23456',
    );
    expect(verifyUrl('MCCI-QR-ABCDE-23456', env({ APP_URL: 'https://x.test', VERIFY_BASE_URL: 'https://mcci.org.pk/verify/' }))).toBe(
      'https://mcci.org.pk/verify/MCCI-QR-ABCDE-23456',
    );
  });

  it('renders an SVG QR on the server', async () => {
    const svg = await qrSvg('https://app.example.test/verify/MCCI-QR-ABCDE-23456');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('#0b2a5b');
  });
});

describe('verification codes', () => {
  it('accepts exactly the database format (private.new_qr_code: no I, O, 0, 1)', () => {
    expect(CODE.test('MCCI-QR-ABCDE-23456')).toBe(true);
    expect(CODE.test('MCCI-QR-ABCDE-2345')).toBe(false);
    expect(CODE.test('MCCI-QR-ABCDO-23456')).toBe(false);
    expect(CODE.test('MCCI-QR-ABCDE-23451')).toBe(false);
    expect(CODE.test("MCCI-QR-ABCDE-23456' or 1=1")).toBe(false);
  });

  it('normalises what people type or scan', () => {
    expect(normalizeCode('  mcci-qr-abcde-23456 ')).toBe('MCCI-QR-ABCDE-23456');
    expect(normalizeCode('MCCI-QR- ABCDE -23456')).toBe('MCCI-QR-ABCDE-23456');
  });
});
