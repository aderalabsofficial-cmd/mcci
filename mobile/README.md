# MCCI Digital — Android app (Capacitor 7)

A thin native shell around the live web app (docs/15-mobile-app.md): it opens `APP_URL`
(`https://app.mcci.aderalabs.tech`), adds ` MCCIApp/<version>` to the user agent so the web app shows its app layout,
keeps navigation on the app's own host, and shows a bundled bilingual offline screen (`www/offline.html`).
Staff see **My queue** (`/admin/queue`, JSON at `/api/queue`) from the bottom bar.

Build: `.github/workflows/android.yml` (tag `mobile-v*`, or run it by hand and pick production / staging).
The `android/` folder is generated in CI (`npx cap add android`) and is not committed.

## Before the first Play upload (external — MCCI / owner)

| Needed | Where |
|---|---|
| Google Play developer account for MCCI | Play Console |
| Upload signing key (keystore) — created once, kept safe by MCCI | GitHub secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` |
| Target SDK the Play Console requires at upload time (template: 35) | `android/variables.gradle` step in the workflow |
| Push notifications (FCM project + `google-services.json`) | not part of this build yet |
| `/.well-known/assetlinks.json` for app links (needs the signing key's SHA-256) | web app, after the key exists |
| Store listing: icon, screenshots, privacy policy URL, data-safety form | Play Console |

Not on this PC: JDK and Android SDK, so the `.aab` is built only in CI.
