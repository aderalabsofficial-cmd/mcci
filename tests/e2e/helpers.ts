import { readFileSync } from 'node:fs';
import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { isBuilt, SCREENS } from '../../lib/nav/registry';
import { NO_BACKEND, readAccounts, STATE } from './accounts';

export const LOCALES = ['en', 'ur'] as const;

/** Every catalogue screen that exists so far (grows with each milestone). */
export const BUILT_ROUTES = SCREENS.filter((s) => isBuilt(s.milestone)).map((s) => s.href);

/** URL of a route in a locale: English has no prefix (localePrefix: 'as-needed'). */
export const localized = (route: string, locale: (typeof LOCALES)[number]) =>
  locale === 'en' ? route : `/ur${route === '/' ? '' : route}`;

const PROTECTED = /^\/(?:ur\/)?(portal|admin)(?:\/|$)/;

/**
 * Gives the page the session auth.setup.ts saved for a synthetic member or (TOTP-verified) staff member — a real
 * session from the login page, not a bypass. Without a backend the test is skipped and says why.
 */
export async function signInAs(page: Page, who: 'member' | 'staff' | 'sg') {
  test.skip(!readAccounts().backend, NO_BACKEND);
  const state = JSON.parse(readFileSync(STATE[who], 'utf8')) as {
    cookies: Parameters<BrowserContext['addCookies']>[0];
  };
  // the idle clock (mcci_seen, lib/session/idle.ts) starts with this test, as in a fresh browser: the saved sessions
  // are reused for the whole run, which takes longer than the 15-minute limit
  await page.context().addCookies(state.cookies.filter((c) => c.name !== 'mcci_seen'));
}

/**
 * Signs in as the right person for protected routes (/portal → member, /admin → staff). Staff & Roles is opened by
 * the Secretary General, so the audits see the full screen rather than the "outside your limits" card.
 */
export async function authFor(page: Page, url: string) {
  const area = PROTECTED.exec(url)?.[1];
  if (area) await signInAs(page, area === 'portal' ? 'member' : /\/admin\/staff/.test(url) ? 'sg' : 'staff');
}

/** Go to a page and wait until web fonts (incl. Jameel Noori) are in, so text widths are final. */
export async function open(page: Page, url: string) {
  await authFor(page, url);
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/**
 * Orphan audit (docs/10-testing.md): every button, link and tab must do something — a real href, a data-action,
 * a form, or aria-controls; a disabled control must say why (title).
 */
export async function expectNoOrphans(page: Page) {
  const bad = await page.evaluate(() =>
    [...document.querySelectorAll('button,a,[role=tab]')]
      .filter((el) =>
        el.matches('a')
          ? !el.getAttribute('href') || el.getAttribute('href') === '#'
          : el.matches('button:disabled')
            ? !el.getAttribute('title')
            : !el.hasAttribute('data-action') && !el.closest('form') && !el.getAttribute('aria-controls'),
      )
      .map((el) => el.outerHTML.slice(0, 160)),
  );
  expect(bad).toEqual([]);
}

/**
 * docs/15-mobile-app.md §8: no horizontal scroll. Compared with clientWidth: on an emulated phone the layout viewport
 * (innerWidth) grows with too-wide content, so innerWidth alone would hide the overflow.
 */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${clientWidth}px viewport`).toBeLessThanOrEqual(clientWidth);
}
