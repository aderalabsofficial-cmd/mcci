---
description: Run all quality gates and report
---

Run: pnpm typecheck, pnpm lint, pnpm test, pnpm test:e2e (including the orphan audit and axe specs).
Report failures grouped by cause and fix them. Then list any screen from docs/catalogue/screens.md that is not
yet built, and any Build-phase action from docs/catalogue/actions.md without a server action and a test.
