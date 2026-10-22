# MCCI Digital Platform — master plan for Claude Code

This folder is the starting point of the real project. Put it in your local workspace and let Claude Code build
the platform from it, milestone by milestone.

## What's inside
| Path | What |
|---|---|
| `CLAUDE.md` | Project memory Claude Code reads every session: rules, stack, layout, commands, definition of done |
| `docs/00…16` | Scope, architecture, data model, state machines, endorsement, modules, roles, notifications, documents & AI, security, testing, milestones with prompts, design & Urdu, seed & import, MCCI dependencies, Android app & compact mobile UI, gap review |
| `docs/sql/` | Ready Supabase migrations: schema (`0001_init.sql`) and row-level security (`0002_rls.sql`) |
| `docs/catalogue/` | Generated from the prototype: every screen, every action (211), reference data (documents per business type, form fields, services, settings) |
| `reference/prototype/` | The v10 prototype — the visual and behavioural specification |
| `.claude/commands/` | Slash commands: `/milestone`, `/check`, `/parity` |

## How to start (on your computer)
1. Install Node 20+, pnpm, Docker (for Supabase local) and the Supabase CLI; install Claude Code.
2. Copy this folder to e.g. `~/Projects/mcci-digital`, then `cd` into it and run `git init`.
3. Open the prototype once to see it: `npx serve reference/prototype` → open the printed address.
4. Run `claude` in the folder. First message:
   > Read CLAUDE.md and docs/11-milestones.md. Start milestone M0 in plan mode.
5. After each milestone: `/check`, then show the result to MCCI, then `/milestone M<next>`.

## Ground rules (also in CLAUDE.md)
This phase only — no WhatsApp, no bank or courier APIs (manual receipts and manual tracking until MCCI's partners
provide integrations). Every button must work. Every change is permission-checked on the server and audited.
