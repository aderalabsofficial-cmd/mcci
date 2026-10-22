# 00 · Scope of this phase

## In scope (build now — 30 days per the MoU)

### Public website
Home (full-width MCCI hero under a transparent header, 80 % brand colour layer, motion), About, Membership
(classes, fees, documents per business type, journey, proposer & seconder explainer, FAQ), Services + service detail,
public member Directory (public fields only, temporary members labelled), Verify (QR / code), Track (token → stage
only), Live board (anonymised), News & Events, Resources (blank official form, checklists), Contact & complaint desk,
Login / register. "Ask MCCI AI" on every page. Urdu launch countdown.

### Member portal
1. **New membership application** on the official MCCI form (6 steps): business type & class rule → documents per
   business type + passport photo (auto-crop 35 × 45 mm) → AI-filled particulars with confidence highlighting →
   **proposer & seconder chosen by the applicant** → signature, stamp, declarations → official 4-page form preview →
   submit (token + email).
2. **Endorsement requests** inbox for existing members: review, approve & sign digitally, or decline.
3. Status, tracker (8 steps), official form, correction screen when returned.
4. Payment voucher (PDF) → pay at bank → upload receipt → wait for Accounts verification.
5. **Temporary membership** (60 days) with QR certificate → permanent when the printed certificate is uploaded.
6. Seven service requests with tokens, 24-hour SLA, signed letters with QR.
7. Documents vault, payments history, messages, events & trade opportunities, company profile & change requests,
   company users (Owner / Manager / Services / Accounts / Viewer) invited by email, Help & AI assistant.

### Admin panel
Dashboard by role, membership pipeline, application review, committee desk & meetings, temporary memberships,
print batches & certificate receiving, serial registry, members register + member profile + Excel import,
service requests, SLA monitor, signing queue, documents & QR registry (revoke), payment vouchers & receipt
verification, events, meetings, complaints, content (news/pages), notification templates & campaigns (email +
portal only), reports, AI insights, staff & roles (invitations, designations, per-module limits), audit log,
services setup, integrations status page (shows what is pending on MCCI's partners), settings.

### Android app (added 21 Oct 2026 — `TODO(MCCI)` confirm against the MoU)
Capacitor shell that loads the same web app, published by MCCI on Google Play: push notifications, document scanner,
QR scanner, downloads & share, digital member card, biometric lock, offline screen, staff "My queue". Compact mobile
UI (≤ 640 px) for web and app. Spec: `15-mobile-app.md`. iOS is not in this phase.

## Out of scope (do not build, do not show)

| Item | Why | What we do instead |
|---|---|---|
| WhatsApp messages | Not in this phase | Email + portal notifications |
| 1Bill PSID / card payment gateway | Depends on MCCI's bank integration | Voucher PDF + receipt upload + Accounts verification. Keep a `payment_provider` setting = `manual`. |
| Courier booking & tracking API | Depends on MCCI providing a courier API | Staff enter courier + tracking number; member sees it |
| iOS app | Not in this phase | Mobile web; the Capacitor project allows iOS later |
| Online elections / voting, e-library, marketplace | Not in this phase | — |

Never add "coming soon / phase 2" badges for these. The integrations page may say *"Bank payment confirmation —
waiting for MCCI's bank"* and *"Courier tracking — waiting for MCCI's courier API"* in neutral words.

## Dependencies on MCCI
See `14-mcci-dependencies.md`. Blocking for go-live: member Excel, staff list, bank account details, domain/DNS,
sender email, security printer & serial format, sign-off on the prototype.
