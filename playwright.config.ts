import { defineConfig, devices } from '@playwright/test';

// E2E_HOST / E2E_PORT: run on Auth's site_url origin (local: 127.0.0.1:3000) so emailed links may redirect back here
const PORT = Number(process.env.E2E_PORT ?? 3100);
const HOST = process.env.E2E_HOST ?? 'localhost';
export const APP_UA_SUFFIX = ' MCCIApp/1.0';

/**
 * Projects (docs/10-testing.md, docs/15-mobile-app.md §8):
 *  - desktop     1440 × 900 Chromium
 *  - mobile-360  360 × 640 touch phone; perf.spec adds slow-3G throttling
 *  - app-shell   Pixel 7 with the Android shell's user agent (data-shell="app")
 * The app runs as a production build so tests see what users get.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // synthetic member + staff accounts, signed in through the login page (auth.setup.ts); removed afterwards
    { name: 'setup', testMatch: /auth\.setup\.ts/, teardown: 'cleanup', use: { ...devices['Desktop Chrome'] } },
    { name: 'cleanup', testMatch: /auth\.teardown\.ts/ },
    {
      name: 'desktop',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-360',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'app-shell',
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 7'],
        userAgent: devices['Pixel 7'].userAgent + APP_UA_SUFFIX,
      },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://${HOST}:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
    // lets app email (invitations) reach the local mail catcher in this production build (lib/email/send.ts)
    env: { MCCI_E2E: '1' },
  },
});
