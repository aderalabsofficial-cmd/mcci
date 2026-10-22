---
description: Plan and build one milestone from docs/11-milestones.md
argument-hint: M0..M10 or MA (Android)
---

Read CLAUDE.md, docs/11-milestones.md and every doc the milestone $ARGUMENTS references.

1. List the prototype screens (docs/catalogue/screens.md) and actions (docs/catalogue/actions.md, phase Build/UI only) in scope.
2. Propose a task plan (max 12 tasks) with the tests for each. Wait for my approval.
3. Implement task by task. After each: pnpm typecheck && pnpm lint && pnpm test, plus the related Playwright spec. Commit.
4. Finish with /check and a short summary of what MCCI can now see.
