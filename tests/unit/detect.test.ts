import { describe, expect, it } from 'vitest';
import { appVersion, detectShell } from '@/lib/shell/detect';

const PIXEL7 =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

describe('detectShell (docs/15-mobile-app.md §4)', () => {
  it('detects the Android shell from the MCCIApp/<version> suffix', () => {
    expect(detectShell(`${PIXEL7} MCCIApp/1.0`)).toBe('app');
    expect(detectShell(`${PIXEL7} MCCIApp/2.3.14`)).toBe('app');
    expect(detectShell(`MCCIApp/1.0 ${PIXEL7}`)).toBe('app');
  });

  it('treats ordinary browsers and look-alikes as web', () => {
    expect(detectShell(PIXEL7)).toBe('web');
    expect(detectShell(`${PIXEL7} NotMCCIApp/1.0`)).toBe('web');
    expect(detectShell(`${PIXEL7} mccIapp/1.0`)).toBe('web');
    expect(detectShell(`${PIXEL7} MCCIApp/`)).toBe('web');
    expect(detectShell('')).toBe('web');
    expect(detectShell(null)).toBe('web');
    expect(detectShell(undefined)).toBe('web');
  });

  it('reads the app version', () => {
    expect(appVersion(`${PIXEL7} MCCIApp/1.4.2`)).toBe('1.4.2');
    expect(appVersion(PIXEL7)).toBeNull();
  });
});
