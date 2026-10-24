import { test } from '@playwright/test';
import { open } from './helpers';

/**
 * Milestone review shots: the shells and the M1 screens per project (desktop 1440 px, mobile-360, app-shell),
 * saved to test-results/shells/. Run alone with `pnpm shots`.
 */
const SHELLS = {
  public: '/',
  portal: '/portal',
  admin: '/admin',
  // M1 screens
  'admin-staff': '/admin/staff',
  'portal-profile': '/portal/profile',
  'ur-portal-profile': '/ur/portal/profile',
} as const;

for (const [name, route] of Object.entries(SHELLS))
  test(`screenshot ${name}`, async ({ page }, info) => {
    await open(page, route);
    await page.waitForTimeout(400); // let entrance transitions settle
    await page.screenshot({ path: `test-results/shells/${name}-${info.project.name}.png`, fullPage: false });
  });
