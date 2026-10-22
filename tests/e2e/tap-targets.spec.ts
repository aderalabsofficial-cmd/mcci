import { expect, test } from '@playwright/test';
import { BUILT_ROUTES, localized, LOCALES, open } from './helpers';

// docs/15-mobile-app.md §8: no visible control with a hit area under 44 px in the app.
test.describe('tap targets in the app shell', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'app-shell', 'app-shell project only'));

  for (const route of BUILT_ROUTES)
    for (const locale of LOCALES)
      test(`${localized(route, locale)}`, async ({ page }) => {
        await open(page, localized(route, locale));
        const small = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('button,a,[role=tab],input,select,textarea')]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              const inView = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
              return r.width > 0 && r.height > 0 && inView && getComputedStyle(el).visibility !== 'hidden';
            })
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            })
            .map((el) => {
              const r = el.getBoundingClientRect();
              return `${Math.round(r.width)}×${Math.round(r.height)} ${el.outerHTML.slice(0, 100)}`;
            }),
        );
        expect(small).toEqual([]);
      });
});
