# 15 · Android app and compact mobile UI

Added 21 Oct 2026. This **changes `00-scope.md`**: "Mobile apps — not in this phase" is replaced by
"Android app (wrapper of the same web app) — in this phase". `TODO(MCCI)`: confirm the scope change against the MoU.

There is **one codebase**. The Android app loads the production web app inside a native shell and adds the native
features listed below. Every screen, rule, permission and audit requirement in docs 00–14 applies unchanged.

---

## 1. Why a Capacitor shell (and not a plain WebView or TWA)

| Option | Verdict |
|---|---|
| Plain WebView wrapper | ✗ Google Play rejects "webview apps" that add nothing to the website (Spam & minimum functionality policy). |
| Trusted Web Activity (Bubblewrap) | ✗ Runs in Chrome: no native document scanner, biometric lock, or control of downloads, back button or offline screen. |
| React Native / Flutter rewrite | ✗ A second UI to build and keep in sync with 59 screens. Not possible in this phase. |
| **Capacitor 7 shell loading the live site** | ✓ Same Next.js app. Native plugins add push, camera scan, QR scan, biometrics, downloads/share, deep links and an offline screen. Enough native value for Play review. iOS can follow later from the same project. |

The web app uses Server Components and Server Actions, so it cannot be bundled as static files. The shell loads
`APP_URL` (`server.url` in `capacitor.config.ts`). Only the offline screen and splash are bundled.

## 2. App identity

| Item | Value |
|---|---|
| Name | **MCCI Digital** · ایم سی سی آئی ڈیجیٹل |
| Package id | `pk.org.mcci.digital` (cannot change after first upload) |
| minSdk / targetSdk | 24 (Android 7) / the level Google Play requires at upload (API 36 for new apps from Aug 2026; check Play Console) |
| Devices | Phones and tablets, portrait and landscape; 16 KB memory-page compatible (Play requirement for API 35+) |
| Publisher | **MCCI's own Google Play organisation account** (see §9). Never a personal or vendor account. |
| Repo folder | `mobile/` (Capacitor project, `android/`, `offline/`, store assets, `capacitor.config.ts`) |

## 3. Native features (all must work; no orphan controls)

| # | Feature | Plugin / API | Where it is used |
|---|---|---|---|
| N1 | Splash, status bar, edge-to-edge insets | `@capacitor/splash-screen`, `status-bar`; CSS `env(safe-area-inset-*)` | Every screen. Android 15+ forces edge-to-edge. |
| N2 | Hardware back button | `@capacitor/app` `backButton` | Close sheet → close modal → history back → on a home tab, "Press back again to exit" |
| N3 | Offline / server-down screen | bundled `mobile/offline/index.html` (EN + UR, Retry button) | Any load failure. Never show the Android "Webpage not available" page. |
| N4 | Push notifications | `@capacitor/push-notifications` + FCM HTTP v1 | Same triggers as the email templates in `07-notifications-jobs.md`. Tapping one opens the linked screen. |
| N5 | Document scanner | Google ML Kit Document Scanner (Play services) | Every upload slot gets **Scan with camera · Take photo · Choose file**. Auto edge detection, crop and perspective fix, multi-page → one PDF. |
| N6 | Passport photo capture | camera + existing crop UI (`08-documents-ai.md`) | Join step 2 |
| N7 | QR scanner | ML Kit barcode scanning | Verify tab (public); staff event check-in (§6) |
| N8 | Downloads & share | native download handler + `@capacitor/share` + Android print | Vouchers, certificates, letters, official form, receipts. WebView ignores downloads and `blob:` URLs by default, so this must be built. |
| N9 | Biometric app lock (optional, member sets it) | `BiometricPrompt` | After 5 min in background. Never stores the password. |
| N10 | App Links (verified deep links) | `/.well-known/assetlinks.json` served by Next.js | Email links, invitation links and QR codes (`VERIFY_BASE_URL`) open inside the app when installed |
| N11 | External links | Custom Tabs | Any domain not in the allow-list (bank sites, maps, social) |
| N12 | Update prompt | Play In-App Updates + `settings.app.minVersion` | Flexible update by default; forced update below `minVersion` |
| N13 | Pull to refresh, top loading bar | web side | Every list screen |
| N14 | System font size | WebView `textZoom` = system font scale, capped at 130 % | Every screen; layouts must not break at 130 % |

**Navigation allow-list:** `APP_URL` host, `VERIFY_BASE_URL` host, Supabase Storage signed-URL host. Everything else → Custom Tab.
**Release builds:** WebView debugging off, cleartext traffic off, `FLAG_SECURE` on the endorsement signing sheet and the CNIC fields.

## 4. How the web app knows it is inside the app

The shell appends ` MCCIApp/<version>` to the user agent and sets `window.MCCIApp`. The root layout reads the UA on
the server and puts `data-shell="app"` on `<html>`. This changes only chrome, not features:

| | Mobile browser (≤ 640 px) | Android app |
|---|---|---|
| Compact density (§5) | yes | yes |
| Bottom tab bar (portal, staff) | yes | yes |
| Public site header / footer | yes | replaced by app bar + bottom tabs |
| Hero motion (ken-burns, particles, tilt, glow) | reduced | off (battery, low-end phones) |
| "Get the app" banner | yes (dismissible) | no |
| Upload source sheet | Camera / Files | Scan / Camera / Files (native) |
| Push permission prompt | — | after the first meaningful event (e.g. after Submit), never at first launch |

## 5. Compact mobile design system (≤ 640 px, web and app)

The goal is a modern Play Store app: more fits on one screen, lists replace tables, and there is one clear action per
screen. The desktop design in `12-design-i18n.md` stays as it is.

### 5.1 Tokens

| Token | Desktop (today) | Compact mobile |
|---|---|---|
| Page gutter | 24–32 px | 16 px (12 px at ≤ 360 px) |
| Card padding / radius | 20–28 px / 18–24 px | 12–14 px / 14 px |
| Gap between cards | 16–24 px | 8–12 px |
| Body / meta / label text | 15–16 px | 14 px / 12 px / 12 px (600 weight) |
| Screen title / section title | 32–44 px | 20 px / 16 px |
| Urdu text | — | never below 14 px; line-height 1.9 (Nastaleeq) |
| Icon in tile | 56–64 px | 40 px (24 px glyph) |
| Tap target | — | ≥ 48 × 48 px hit area even when the visual is smaller |
| App bar / bottom nav | — | 56 px / 64 px + safe area |
| Shadows | large | one soft level; borders do the separation |

### 5.2 Layout patterns

| Pattern | Rule |
|---|---|
| **Quick-action grid** | 4 columns (icon + 2-line label) on home screens instead of 2 big tiles; 3 columns at ≤ 360 px |
| **KPI / stat cards** | 2 columns, number + label + delta in about 72 px of height (admin KPIs are 1 per row today) |
| **Tables → card lists** | No table is wider than the screen. Each row is a list item: line 1 title + status pill, line 2 two key fields, chevron → detail. Each table declares column priority (`data-priority=1..3`). A **Columns** sheet shows more fields. Tablet and landscape (≥ 768 px) show the real table with a sticky first column. |
| **Filters** | Horizontal scrolling chips + a **Filter** bottom sheet; search sits at the top of the list, not in the app bar |
| **Detail screens** | Summary header (title, status, 3 key facts) → segmented tabs → sections in collapsible cards |
| **Primary action** | Sticky bottom action bar (gold button, full width) above the bottom nav |
| **Modals** | Bottom sheets (sign & approve, decline, upload source, filters, confirm) with a drag handle |
| **Wizard (join, apply)** | "Step 2 of 6" + thin progress bar instead of 6 large circles; bottom nav hidden; sticky Back / Continue |
| **Bilingual labels** | EN + UR together on tiles, headings and buttons, as in the prototype. Long lists and meta lines show the active locale only. `TODO(MCCI)` confirm. |
| **Empty, loading, error** | Skeleton rows while loading; compact empty state (icon + one line + one action) |
| **Toasts** | At the bottom, above the nav; live updates as a small banner, not a full card |
| **"What to do now" card** | Kept on every member page, at most 120 px tall, with one action button |
| **App bar (top)** | Added 21 Oct 2026 at the owner's request ("like the Binance app"). Slim: logo + area name (or back + screen title on inner screens) only. Every top-bar tool of the prototype (search, language, theme, Ask AI, notifications, account menu) moves to the **bottom bar**: a tab of its own where §5.3 gives one (staff Search, Notifications) or the tools row at the top of the **More** sheet. Never a crowded top bar on a phone. |
| **More sheet** | Tools row (language, theme, account) at the top, then the remaining pages as a 4-column icon grid (3 at ≤ 360 px), active language only, 2-line labels |
| **Precision** | Tight, consistent rhythm on every page: section title 16 px, 8–12 px between blocks, cards 12–14 px padding with a 1 px border instead of big shadows, page tabs as a scrolling chip row, English · Urdu side by side on titles to save height. Readability first: body 14 px, never below 12 px for labels or 14 px for Urdu. |

### 5.3 Information architecture (bottom tabs)

| Audience | Tab 1 | Tab 2 | Tab 3 | Tab 4 | Tab 5 |
|---|---|---|---|---|---|
| Visitor (signed out) | Home | Services | **Verify** (scan) | Directory | More (Membership, Track, News & Events, Resources, About, Contact, Ask AI, Language, Sign in) |
| Member | Home | Services (apply + my requests) | Documents (incl. digital card) | Messages (badge) | More (Membership, Track, Payments, Endorsements, Events, Opportunities, Profile & users, Help, Ask AI, Settings, Sign out) |
| Staff | **My queue** | Search | Notifications | Members | More (every admin page they are allowed to open) |

Badges: Messages (unread), and on More: Payments (voucher due), Endorsements (waiting). A badge is never the only
signal: the home "what to do now" card shows the same item.

**Visitor app home** (≤ 3 screens tall; the prototype home is 16 screens at 375 px): compact hero (220 px, logo,
one line, **Apply for membership** + **Verify a certificate**) → 8-item quick grid (Apply, Verify, Track, Services,
Directory, Events, Contact, Ask AI) → live counters strip → latest 3 news (horizontal cards) → upcoming events.

### 5.4 Staff on mobile

Staff use the full admin on a computer. The app gives each designation a **My queue** screen with what can be done on
a phone, filtered by `staff_level` (server-checked like everything else):

| Designation | Mobile tasks |
|---|---|
| President / signatory | Signing queue: open letter preview → **Sign** (one) / **Sign all** with confirmation |
| Accounts Officer | Receipts to verify: receipt image full screen → **Verify** / **Reject with reason** |
| Committee Secretary / SG | Committee agenda: approve / defer / reject; approve all |
| Membership Officer | Applications to review (read, accept/reject a document, remind endorser, return with note) |
| Services Officer | Service requests near SLA: start / return / approve |
| SG | Temporary memberships expiring (extend / remind), SLA breaches, anything above |
| Front desk / events | Event check-in by QR scan (§6) |

Screens that need a big screen (Excel import, print batches, serial register, staff limits matrix, settings,
notification template editor, reports builder) open in compact read mode with a note "Easier on a computer" and an
**Email me the link** button. They are not hidden, because hiding them would break the role matrix.

## 6. Additions to the web app needed by the app

| Item | Detail |
|---|---|
| Table `device_tokens` | `user_id, token (unique), platform 'android', app_version, lang, created_at, last_seen_at`; RLS: own rows only; staff cannot read tokens |
| Notification preferences | `profiles.prefs jsonb` per category: applications & endorsements, payments, services, events & news, staff work queue. Email/push per category; security emails cannot be switched off |
| `notify()` | Adds the push channel next to email + portal; sends in `profiles.lang`; push body ≤ 120 chars; never contains CNIC, amounts or document contents, only "You have a new …" and the deep link |
| Android notification channels | Same 5 categories, so members can mute one in Android settings |
| Digital member card | `/portal/card`: member no., class, company, rep name, valid to, live QR (`documents` code). Last-loaded copy stays visible offline with "Last checked <time>". Shown under Documents. |
| Event check-in | `event_registrations` gets `ticket_code` + `checked_in_at, checked_in_by`; member sees ticket QR; staff scan → check in (action `ev.checkin`, eng ≥ 2, audited) |
| `/.well-known/assetlinks.json` | Route handler returning the app's SHA-256 signing fingerprints from env |
| Settings key | `app { minVersion, latestVersion, playUrl, iosUrl: null }` |
| Account deletion | Required by Google Play for apps with sign-up: in-app **Delete my account** (More → Settings) and a public web page `/account/delete`. Creates a deletion request; staff action `acc.delete` (reg ≥ 3). Login access and personal data are removed; membership, payment and audit records are kept for the retention period and the screen says so. `TODO(MCCI)` legal wording. |
| Privacy policy & terms pages | `/privacy`, `/terms` (EN + UR). Needed for the Play listing, registration consent and the data safety form. |
| Env vars | `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON` (server only), `ANDROID_CERT_SHA256` (comma-separated) |

## 7. Performance budget (low-end Android is the target)

Test device class: 2–3 GB RAM, Android 10, slow 4G. On that class:
- First screen after splash < 3 s on 4G; later navigations < 1 s (RSC streaming + prefetch of bottom-tab routes).
- JS per route ≤ 170 KB gzipped; no motion libraries on portal or admin routes.
- Images in AVIF/WebP with `sizes`; hero ≤ 120 KB on mobile.
- Uploads are compressed on the device before sending (longest side 2000 px, JPEG 0.82, target ≤ 1.5 MB); PDFs untouched.
- Long lists are paginated (25) with "Load more". No infinite queries on admin lists.

## 8. Testing

| Layer | What |
|---|---|
| Playwright projects | add `mobile-360` (360 × 640, slow-3G throttle) and `app-shell` (Pixel 7 + UA `MCCIApp/1.0`). Orphan audit and axe run in both. |
| Overflow test | Every route in `catalogue/screens.md`: `document.documentElement.scrollWidth <= innerWidth` at 360, 390 and 412 px, in EN and UR. (The prototype fails this today: portal 591 px and admin 556 px on a 375 px screen, from the top bar.) |
| Tap-target test | No visible control with a hit area < 44 px in the `app-shell` project |
| Unit (Vitest) | back-button stack, deep-link router, push payload builder (no PII), UA detection |
| Device matrix (manual, each release) | Android 8, 10, 13, 15/16; one 2 GB device; Urdu; font scale 130 %; dark mode; airplane mode → offline screen |
| Firebase Test Lab | Robo test on the release AAB (optional, free tier) |
| Play pre-launch report | Must have no crashes and no accessibility errors before promoting a release |

## 9. Google Play release (MCCI-owned)

1. **Organisation developer account in MCCI's name.** Needs a D-U-N-S number for MCCI (free; can take up to 30
   days), so apply on day 1. A *personal* account created after Nov 2023 must run a 14-day closed test with 12+ testers
   before production. An organisation account avoids that and is the correct publisher for an official chamber
   app (Play's impersonation policy).
2. Play App Signing on; the **upload key** is created by MCCI and stored in the CI secret store and MCCI's vault,
   never in the repo.
3. Store listing in English and Urdu: icon 512 px, feature graphic 1024 × 500, phone + 7" tablet screenshots
   (Home, Apply, Verify, Documents, Digital card, Staff queue), short and full description, contact email, privacy
   policy URL.
4. Data safety form: name, email, phone, CNIC, business documents, photos (collected, encrypted in transit, not
   sold, not shared except as described), account deletion link.
5. Content rating questionnaire; target audience 18+; no ads.
6. Permissions declared: `INTERNET`, `CAMERA`, `POST_NOTIFICATIONS`, `USE_BIOMETRIC`. No storage permission
   (photo picker + MediaStore), no location, no contacts, no SMS.
7. Tracks: internal (team) → closed (MCCI staff + 20 pilot members) → production, staged rollout 20 % → 100 %.

## 10. Build & CI

- `mobile/` uses pnpm. `pnpm mobile:sync` runs `cap sync android`. Release builds run in GitHub Actions (JDK 21 +
  Android SDK), on tag `mobile-v*` → signed AAB uploaded as an artifact (and to the internal track when
  `PLAY_SERVICE_ACCOUNT_JSON` is set).
- `versionName` = tag; `versionCode` = CI run number.
- `capacitor.config.ts` reads `APP_URL` at build time: staging builds point at staging, production at production.
  Two flavours: `staging` (package suffix `.staging`, orange icon badge) and `production`.
- Local builds need Android Studio (JDK + SDK). Not required for web development.

## 11. Acceptance criteria (Android)

- Fresh install → splash → visitor home in < 3 s on 4G; no horizontal scroll on any screen at 360 px (EN and UR).
- Apply for membership end to end in the app, using **Scan** for at least two documents and the camera for the photo.
- An endorser receives a push within 10 s of the request; tapping it opens `/portal/endorse` and they can sign.
- President signs a letter from the push → letter appears in the member's Documents, and the member gets a push.
- Voucher PDF downloads, opens in a PDF viewer and can be shared to WhatsApp/email by the member using Android's share
  sheet (the app does not send WhatsApp messages itself).
- Scanning a certificate QR with the phone camera opens the app's Verify screen; inside the app, Verify → Scan works.
- Airplane mode shows the bilingual offline screen; Retry recovers without restarting the app.
- Back button never exits the app from a sheet or inner screen.
- Delete my account works from inside the app and from the web page.
- Play pre-launch report: 0 crashes, 0 accessibility errors; target API accepted.
