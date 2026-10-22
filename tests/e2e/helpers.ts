import { expect, type Page } from '@playwright/test';
import { isBuilt, SCREENS } from '../../lib/nav/registry';

export const LOCALES = ['en', 'ur'] as const;

/** Every catalogue screen that exists so far (grows with each milestone). */
export const BUILT_ROUTES = SCREENS.filter((s) => isBuilt(s.milestone)).map((s) => s.href);

/** URL of a route in a locale: English has no prefix (localePrefix: 'as-needed'). */
export const localized = (route: string, locale: (typeof LOCALES)[number]) =>
  locale === 'en' ? route : `/ur${route === '/' ? '' : route}`;

/** Go to a page and wait until web fonts (incl. Jameel Noori) are in, so text widths are final. */
export async function open(page: Page, url: string) {
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

/** docs/15-mobile-app.md §8: no horizontal scroll. */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${innerWidth}px viewport`).toBeLessThanOrEqual(innerWidth);
}
