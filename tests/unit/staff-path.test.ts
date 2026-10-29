import { describe, expect, it } from 'vitest';
import { STAFF_LOGIN_PAGE, staffLoginPath } from '@/lib/auth/staff-path';

describe('staff sign-in address (lib/auth/staff-path.ts)', () => {
  it('is /staff/login unless MCCI sets a private one', () => {
    expect(staffLoginPath(undefined)).toBe(STAFF_LOGIN_PAGE);
    expect(staffLoginPath('')).toBe(STAFF_LOGIN_PAGE);
    expect(staffLoginPath('/mcci-desk-k7q2')).toBe('/mcci-desk-k7q2');
    expect(staffLoginPath(' /mcci_desk_2026 ')).toBe('/mcci_desk_2026');
  });

  it('ignores addresses that are too short, nested, or not a plain path', () => {
    for (const bad of ['/short', 'mcci-desk-k7q2', '/a/b-c-d-e-f-g', '//evil.example', '/desk?x=1', '/staff/login']) {
      expect(staffLoginPath(bad), bad).toBe(STAFF_LOGIN_PAGE);
    }
  });
});
