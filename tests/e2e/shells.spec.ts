import { expect, type Page, test } from '@playwright/test';
import { open } from './helpers';

const bottomNav = (page: Page) => page.getByRole('navigation', { name: 'Quick navigation' });

test.describe('desktop shells', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

  test('portal: sidebar with Home current, disabled items explain why, no bottom tabs', async ({ page }) => {
    await open(page, '/portal');
    const menu = page.getByRole('complementary', { name: 'Main menu' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    await expect(menu.getByRole('button', { name: /My Membership/ })).toHaveAttribute('title', /milestone M3/);
    await expect(bottomNav(page)).toBeHidden();
  });

  test('admin: sidebar groups in prototype order, theme switch only (as in the prototype)', async ({ page }) => {
    await open(page, '/admin');
    const menu = page.getByRole('complementary', { name: 'Main menu' });
    await expect(menu.getByRole('heading')).toHaveText([
      'MEMBERSHIP',
      'SERVICES DESK',
      'FINANCE',
      'ENGAGEMENT',
      'INSIGHTS & PLATFORM',
    ]);
    await expect(page.locator('[data-action="theme.toggle"]:visible')).toHaveCount(1);
    await expect(page.locator('[data-action="lang.toggle"]:visible')).toHaveCount(0);
  });

  test('public: header is transparent over the hero and turns solid after scrolling', async ({ page }) => {
    await open(page, '/');
    const header = page.locator('header').first();
    await expect(header).not.toHaveAttribute('data-solid');
    await page.mouse.wheel(0, 600);
    await expect(header).toHaveAttribute('data-solid', 'true');
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Staff portal' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });

  test('language switch moves to Urdu (RTL) and back', async ({ page }) => {
    await open(page, '/portal');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await page.locator('[data-action="lang.toggle"]:visible').click();
    await expect(page).toHaveURL(/\/ur\/portal$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ur');
    await page.locator('[data-action="lang.toggle"]:visible').click();
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('public site: language switch moves to Urdu (RTL) and back (no sign-in needed)', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await page.locator('[data-action="lang.toggle"]:visible').first().click();
    await expect(page).toHaveURL(/\/ur$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ur');
    await page.locator('[data-action="lang.toggle"]:visible').first().click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('theme switch is remembered after reload', async ({ page }) => {
    await open(page, '/portal');
    const html = page.locator('html');
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));
    await page.locator('[data-action="theme.toggle"]:visible').click();
    await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/);
    await page.reload();
    await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/);
  });
});

test.describe('compact shells (≤ 640 px)', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone projects only');

  for (const area of ['portal', 'admin'] as const)
    test(`${area}: slim app bar, bottom tabs, More sheet holds the tools`, async ({ page }) => {
      await open(page, `/${area}`);
      await expect(page.getByRole('complementary', { name: 'Main menu' })).toBeHidden();
      await expect(bottomNav(page)).toBeVisible();
      await expect(bottomNav(page).getByRole('listitem')).toHaveCount(5);
      // Binance-style: no tools in the top bar on phones
      await expect(page.locator('header [data-action]:visible')).toHaveCount(0);

      await bottomNav(page).getByRole('button', { name: 'More' }).click();
      const sheet = page.getByRole('dialog', { name: 'More' });
      await expect(sheet).toBeVisible();
      await expect(sheet.locator('[data-action="theme.toggle"]')).toBeVisible();
      await expect(sheet.locator('[data-action="lang.toggle"]')).toHaveCount(area === 'portal' ? 1 : 0);
      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
    });

  test('portal: Home tab is current', async ({ page }) => {
    await open(page, '/portal');
    await expect(bottomNav(page).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  test('admin: dashboard is reachable from the More sheet', async ({ page }) => {
    await open(page, '/admin');
    await bottomNav(page).getByRole('button', { name: 'More' }).click();
    await expect(page.getByRole('dialog').getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin');
  });
});

test.describe('public site on a phone browser', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile-360', 'mobile-360 project only'));

  test('menu sheet opens and closes; footer stays', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('html')).toHaveAttribute('data-shell', 'web');
    await page.getByRole('button', { name: 'Menu' }).click();
    const sheet = page.getByRole('dialog', { name: 'Menu' });
    await expect(sheet.getByRole('link', { name: 'Home' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('contentinfo')).toBeAttached();
    await expect(bottomNav(page)).toHaveCount(0);
  });
});

test.describe('inside the Android app (MCCIApp/ user agent)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'app-shell', 'app-shell project only'));

  test('public site uses the app bar + visitor tabs, no footer', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('html')).toHaveAttribute('data-shell', 'app');
    await expect(bottomNav(page)).toBeVisible();
    await expect(bottomNav(page).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveCount(0);
  });

  test('Urdu app is right-to-left', async ({ page }) => {
    await open(page, '/ur/portal');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const nav = page.getByRole('navigation', { name: 'فوری رسائی' });
    await expect(nav.getByRole('link', { name: 'ہوم' })).toHaveAttribute('aria-current', 'page');
  });
});
