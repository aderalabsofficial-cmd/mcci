import type { CapacitorConfig } from '@capacitor/cli';

/**
 * MCCI Digital Android shell (docs/15-mobile-app.md). The app loads the live web app at APP_URL — the same pages,
 * sign-in and permissions as the browser — and bundles only the bilingual offline screen (www/). Two flavours by
 * build-time variables: production (pk.org.mcci.digital) and staging (…staging), both set by the CI workflow.
 * The user agent gets " MCCIApp/<version>" so the web app shows its app layout (lib/shell/detect.ts).
 */
const APP_URL = process.env.APP_URL ?? 'https://app.mcci.aderalabs.tech';
const host = new URL(APP_URL).host;
const staging = process.env.MCCI_FLAVOUR === 'staging';

const config: CapacitorConfig = {
  appId: staging ? 'pk.org.mcci.digital.staging' : 'pk.org.mcci.digital',
  appName: staging ? 'MCCI Digital (staging)' : 'MCCI Digital',
  webDir: 'www',
  appendUserAgent: `MCCIApp/${process.env.MCCI_APP_VERSION ?? '1.0'}`,
  server: {
    url: APP_URL,
    cleartext: false,
    // the app's own host only; every other link opens outside the app (docs/15 navigation allow-list)
    allowNavigation: [host],
    errorPath: 'offline.html',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: staging,
  },
  plugins: {
    SplashScreen: { launchShowDuration: 800, backgroundColor: '#0b2a5b', showSpinner: false },
    StatusBar: { backgroundColor: '#0b2a5b', style: 'DARK' },
  },
};

export default config;
