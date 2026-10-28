# 23 · Release checklist — R0–R5 and the mobile pass (28 Oct 2026)

Production today: release `f766054` (migrations through 0405). This release takes production to the final commit
below. Local results are local results — production verification is in §5 once deployed.

## 1. Commits (branch `db/schema-proposal`)

| Commit | What |
|---|---|
| `e319a86` | R0 — invitations emailed to every member of a committed import (0406); checkbox sizing fix |
| `f25d034` | docs/21 — final decisions and replan |
| `8c79d33` | R1 — application form of 28 Oct 2026 (0420–0421) |
| `3d46237` | R2 — hierarchy and approval (0430) |
| `9c90ba1` | test fix (pgTAP 240) |
| `3f47574` | R3 — no temporary membership; activation, tenure, renewal, restoration, blacklist / whitelist (0440); docs/22 |
| `9edf9b1` | R4 — security-press certificate intake with QR (0450); docs/24 |
| `7da0ad7` | R5 — confidential files and the register for the IT Convener only (0460) |
| `4a0d094` | Mobile pass (no sideways scrolling) and wording without temporary membership |
| `281dc99`, `2e5a576` | database test updates for R3 / R5 rules; this checklist |
| `d16c408` | fix: "Reset to defaults" keeps the three new designations' limits (0465) — found by the full browser run |
| `02f38ea` | test fixture uses a fictional company name (the sample certificate's company name remains in the history of `9edf9b1`) |

The parked M8 engagement work (0410 and its pages) and `deploy/web/mcci-jobs.*` are **not** in any commit; the
release diff `f766054..4a0d094` (113 files) contains none of them.

## 2. Migrations to apply on production (in order, one transaction each)

| Migration | sha256 (first 16) |
|---|---|
| 20261030000406_import_invitations | `d1bc3747bd12126f` |
| 20261101000420_biz_llp | `ddf92a134d18882c` |
| 20261101000421_application_form_v2 | `b0bd3b708d7cd6b3` |
| 20261102000430_hierarchy_approval | `fbbe6dff97b85c5d` |
| 20261103000440_activation_no_temp | `0a8d61251a0dded4` |
| 20261104000450_certificate_intake | `5460233fa626c4ec` |
| 20261105000460_confidential_files | `136de3f7d16c332c` |
| 20261105000465_role_defaults_new_designations | `2036674b593ac168` |

## 3. Tests on the exact final commit (local)

| Suite | Result |
|---|---|
| Migrations + seed + every pgTAP file, fresh throwaway database (`scripts/db/dry-run.sh`) | see §6 |
| Unit (vitest) | 276 / 276 |
| Typecheck, lint | clean |
| Browser suite, all projects, from a clean checkout of `4a0d094` | see §6 |

Browser tests that walk the owner's workflow with real sign-ins (no shortcut): application form (EN, Urdu guide),
proposer / seconder consent, SG assigns the committee → **President approves on screen** → officer types the number
and forwards → **Convener approves** (SG cannot) → voucher → **Accounts verify** → active member (31 March);
blacklist blocks **renewal** → whitelist → renewal paid → next 31 March; **restoration** by hand; **certificate scan**
upload → AI reading → conflicts → confirm → **QR stamped** → public **QR verification** → member sees it; **restricted
downloads** (officer / SG refused, IT Convener allowed, all logged); phone layout at 360 / 390 / 412 px in EN and UR.

## 4. Known limitations and open MCCI decisions
- Viewing a document on screen cannot stop a photograph of the screen; views are watermarked and logged.
- The President / Convener / IT Convener accounts on production must be invited by the SG and tested through the
  screens by those people before the workflow is accepted (docs/24 §2 step 8). The browser tests use test accounts.
- AI reading of certificate scans was tested with a stand-in model; the first real scans should be checked by a person
  (they always are: nothing is saved without confirmation). JPG / PNG scans only (no PDF).
- Awaiting MCCI (defaults in settings): number re-use after a decline (default: no), number format (C-201), late-year
  approvals / renewal grace (nothing invented), fee schedule, bank details, certificate QR position (measured on the
  sample).
- Renewal is staff-started (the member's own online renewal is a later phase).

## 5. Production steps
1. Tooling clone at the final commit; compare each migration's sha256 with §2.
2. Backup (`scripts/selfhost/backup.sh`) → restore drill (`restore-drill.sh`) → row-count snapshot.
3. `migrate.sh --dry-run`, then `--apply-next` seven times (each in its own transaction); grants check.
4. `scripts/deploy/release.sh <commit>` (atomic switch; the previous release stays for rollback).
5. Smoke tests: public pages, verify, login, admin and portal pages, file route refusals, nginx config hash unchanged,
   AI_EXTRACTION on, no jobs unit; row counts compared.

## 6. Results

**Local (not production):**
- Fresh throwaway database, final migrations (`d16c408`): **859 ok, 0 not ok**; every test file leaves no rows.
- Unit 276 / 276; typecheck and lint clean.
- Full browser suite on a clean checkout of `2e5a576` (desktop, mobile-360, app-shell): **874 passed, 3 failed** —
  two from the "Reset to defaults" bug (fixed in `d16c408`), one service submission under load; rerun on `d16c408`
  of those specs plus the reset spec: **15 / 15 passed**; certificate spec on `02f38ea`: **4 / 4**.
- Phone layout: 102 routes × 360 / 390 / 412 px × EN / UR without page or section sideways scroll; tap targets in the
  app shell ≥ 44 px.

**Production:** (below, after deployment)

