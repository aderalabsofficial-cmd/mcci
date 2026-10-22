# 10 · Testing and quality gates

## Layers
| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | class rule, fee calc, eligibility, state transitions, date/validity math, token formats, merge of AI fields |
| RLS | SQL tests (pgTAP) or Vitest against local Supabase with JWTs per role | each table × each role: can/can't read/write |
| E2E | Playwright (Chromium + mobile Pixel 7) | the flows below, two contexts for live updates |
| Orphan audit | Playwright helper | every page: every `button`, `a[href]`, `[role=tab]` has a handler/route; no `href="#"`; disabled controls have a reason |
| Accessibility | `@axe-core/playwright` | zero serious/critical violations on every page |
| Visual | Playwright screenshots vs prototype (manual review per milestone) | layout parity |

## E2E flows (mirror the prototype QA scripts `qa10.js` / `e2e10.js`)
1. **Full membership flow:** register → 6 steps with sample docs → AI fill → send proposer & seconder requests →
   submit → (context B: endorser) sign proposer → (context C) sign seconder → (staff) accept docs → verify →
   committee approve → (applicant) upload receipt → (accounts) verify → temporary issued → batch → receive →
   convert → permanent. Assert official form PDF has photo, 3 signatures, stamp, membership no.
2. **Returned & resubmitted** with re-sign rule.
3. **Endorsement decline / expiry / withdraw.**
4. **Each of 7 services** request → issue.
5. **Temporary expiry, extension, revoke**, QR states on verify page.
6. **Roles:** for every designation, every admin page shows only allowed modules; forbidden actions return 403.
7. **Company users:** Accounts user can pay but not apply; Viewer cannot change anything.
8. **Urdu:** switch to UR on 5 key pages; layout RTL; no untranslated keys (`messages` completeness test).

## Orphan audit implementation
```ts
// tests/e2e/orphans.spec.ts — for each route in catalogue/screens.md
const bad = await page.evaluate(() => [...document.querySelectorAll('button,a,[role=tab]')]
  .filter(el => el.matches('a') ? !el.getAttribute('href') || el.getAttribute('href') === '#'
                : el.matches('button:disabled') ? !el.title
                : !el.hasAttribute('data-action') && !el.closest('form') && !el.getAttribute('aria-controls'))
  .map(el => el.outerHTML.slice(0, 120)));
expect(bad).toEqual([]);
```
Convention: interactive client components set `data-action="<catalogue id>"` so the audit and analytics can map
controls to the actions catalogue.

## CI (GitHub Actions)
`pnpm install → typecheck → lint → vitest → supabase start → db reset → playwright (incl. orphans + axe)`.
PRs cannot merge if any step fails.
