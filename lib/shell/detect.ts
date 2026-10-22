/**
 * The Android shell appends ` MCCIApp/<version>` to the WebView user agent (docs/15-mobile-app.md §4).
 * The root layout reads the UA on the server and sets data-shell="app" on <html>.
 */
const APP_UA = /(?:^|\s)MCCIApp\/(\d+(?:\.\d+){0,3})(?:\s|$)/;

export type Shell = 'app' | 'web';

export function detectShell(userAgent: string | null | undefined): Shell {
  return userAgent && APP_UA.test(userAgent) ? 'app' : 'web';
}

export function appVersion(userAgent: string | null | undefined): string | null {
  return userAgent?.match(APP_UA)?.[1] ?? null;
}
