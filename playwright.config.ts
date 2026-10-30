import { defineConfig, devices } from '@playwright/test';
import { qrTestKey } from './tests/e2e/qr-key';

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
  webServer: [
    {
      // stand-in for the OpenAI Responses API ("Read with AI" without a key or cost)
      command: 'node tests/e2e/fake-openai.mjs',
      url: 'http://127.0.0.1:3998/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      // stand-in for the IQPigeon WhatsApp API (nothing is ever really sent)
      command: 'node tests/e2e/fake-iqpigeon.mjs',
      url: 'http://127.0.0.1:3997/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `pnpm build && pnpm start --port ${PORT}`,
      url: `http://${HOST}:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: 'ignore',
      stderr: 'pipe',
      // MCCI_E2E: app email (invitations) may reach the local mail catcher in this production build
      // (lib/email/send.ts); OPENAI_*: AI reading goes to tests/e2e/fake-openai.mjs
      env: {
        MCCI_E2E: '1',
        // as behind nginx in production: tests that need their own rate-limit bucket send X-Real-IP (site.spec contact)
        TRUST_PROXY_CLIENT_IP: '1',
        // the suite signs staff in many times from one address (lib/auth/admin/staff-throttle.ts)
        STAFF_LOGIN_ATTEMPTS: '500',
        AI_EXTRACTION: 'on',
        AI_ASSISTANT: 'on',
        OPENAI_API_KEY: 'sk-e2e-fake-key-not-a-real-one-000000000000',
        OPENAI_BASE_URL: 'http://127.0.0.1:3998/v1',
        // signed QR links with a test-only key (tests/e2e/qr-key.ts; verify.spec checks valid and altered signatures)
        QR_SIGNING_KEY: qrTestKey(),
        // WhatsApp goes to tests/e2e/fake-iqpigeon.mjs
        IQPIGEON_API_URL: 'http://127.0.0.1:3997',
        IQPIGEON_API_KEY: 'test-iqpigeon-key',
        IQPIGEON_CONNECTION_ID: '11111111-2222-4333-8444-555555555555',
        IQPIGEON_PHONE_NUMBER_ID: '100200300',
        IQPIGEON_WEBHOOK_SECRET: 'test-webhook-secret-not-a-real-one',
        APP_URL: `http://${HOST}:${PORT}`,
        CRON_SECRET: 'test-cron-secret-not-a-real-one-0000000000',
      },
    },
  ],
});
