import { describe, expect, it } from 'vitest';
import { classifyIdentifier, normalizeMobile, safeNext } from '@/lib/auth/identifier';

describe('login identifier (prototype: "Mobile, email or member ID")', () => {
  it('recognises email addresses (lower-cased)', () => {
    expect(classifyIdentifier(' Owner.A@Example.PK ')).toEqual({ kind: 'email', value: 'owner.a@example.pk' });
  });

  it('recognises membership numbers in the MCCI-C / MCCI-A format', () => {
    expect(classifyIdentifier('mcci-c-1134')).toEqual({ kind: 'member', value: 'MCCI-C-1134' });
    expect(classifyIdentifier('MCCI-A-2205')).toEqual({ kind: 'member', value: 'MCCI-A-2205' });
    expect(classifyIdentifier('MCCI-X-1')).toEqual({ kind: 'invalid' });
  });

  it('normalises Pakistani mobile numbers to 03XXXXXXXXX', () => {
    for (const raw of [
      '0300-1234567',
      '0300 1234567',
      '+923001234567',
      '00923001234567',
      '923001234567',
      '(0300) 123-4567',
    ]) {
      expect(normalizeMobile(raw), raw).toBe('03001234567');
    }
    expect(classifyIdentifier('0300-1234567')).toEqual({ kind: 'mobile', value: '03001234567' });
    expect(normalizeMobile('061-4543530')).toBeNull(); // a landline is not a login
    expect(normalizeMobile('0300-12345')).toBeNull();
  });

  it('rejects empty, oversized and unrecognised input', () => {
    expect(classifyIdentifier('')).toEqual({ kind: 'invalid' });
    expect(classifyIdentifier('x'.repeat(300) + '@a.pk')).toEqual({ kind: 'invalid' });
    expect(classifyIdentifier('hello')).toEqual({ kind: 'invalid' });
  });
});

describe('return path after sign-in', () => {
  it('keeps same-site paths only', () => {
    expect(safeNext('/portal/payments', '/portal')).toBe('/portal/payments');
    expect(safeNext('https://evil.example/', '/portal')).toBe('/portal');
    expect(safeNext('//evil.example/x', '/portal')).toBe('/portal');
    expect(safeNext('/\\evil.example', '/portal')).toBe('/portal');
    expect(safeNext(null, '/portal')).toBe('/portal');
  });
});
