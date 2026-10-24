# 01 · Architecture

Updated 23 Oct 2026: the database tier is **self-hosted Supabase (Docker) on an MCCI-controlled server**, PostgreSQL 17.
Schema, security model and verification: `docs/17-database-architecture.md`. **Nothing has been deployed yet**; staging
and production servers do not exist yet. Items marked *(decision)* are open (`docs/17` §12).

## Overview

```
Browser (EN/UR, RTL)          Next.js server (host: decision)          Self-hosted Supabase (Docker, MCCI server)
───────────────────     ─────────────────────────────────────     ─────────────────────────────
Public site  ─────────▶ Server Components (read via RLS)   ─────▶ Postgres 17 + RLS (gateway → Auth, REST, Realtime, Storage)
Member portal ────────▶ Server Actions (zod → api.* functions) ──▶  ├─ tables, grants, policies (docs/17)
Admin panel  ─────────▶ Route handlers: /api/verify, /api/pdf,     ├─ sequences for tokens/numbers
       ▲                 /api/cron/* (secret), /api/ai/*            ├─ pg_cron → /api/cron/*
       │                                                           Storage (private buckets)
       └──── Realtime (postgres_changes on notifications,         Auth (email+password, email OTP,
             applications, endorsements, service_requests)           TOTP for staff)
                          │
                          ├──▶ OpenAI (structured outputs) — document extraction, Ask MCCI AI
                          └──▶ Email provider (SMTP/API) — React Email templates
```

## Supabase clients
- `lib/supabase/server.ts` — server client bound to the user's cookie session (RLS applies). Default everywhere.
- `lib/supabase/admin.ts` — service-role (secret key) client. **Only** in cron handlers, PDF generation, the public verify
  endpoint (fixed, minimal projection) and import commit. Never import it in a component. User actions do not use it:
  they call narrow `api.*` database functions as the signed-in user (`docs/17` §1, decision 4).
- `lib/supabase/client.ts` — browser client for Realtime subscriptions only.

## Live updates
Subscribe with Realtime to rows the user can read (RLS applies to Realtime):
- member: `notifications` where `user_id = me`, own `applications`, `endorsements` where `endorser_member_id = mine`
  or `application_id` in mine, own `service_requests`, `payments`.
- staff: queues they can see. On change → `router.refresh()` and a toast ("Live update: …"), exactly like the
  prototype's cross-tab behaviour.

## Storage buckets (all private except `cms`; policies in `docs/17` §5 / migration 0230)
| bucket | content | who reads |
|---|---|---|
| `application-docs` | applicant documents, photo, signature, stamp | owner company, staff with `mem ≥ view` |
| `receipts` | bank receipts | owner company, staff with `pay ≥ view` |
| `certificates` | temporary + permanent certificate PDFs, scans of printed certificates | owner company, staff `temp ≥ view` |
| `service-docs` | service request uploads and issued letters | owner company, staff `svc ≥ view` |
| `form-snapshots` | official form PDFs at submit/resubmit (hash signed by endorsers) | owner company, staff `mem ≥ view` |
| `imports` | member Excel files | staff `reg ≥ edit` |
| `cms` | public images for news/pages | public read via signed/public URL |

Path convention: `{company_id}/{entity}/{entity_id}/{uuid}.{ext}`. Max 10 MB, types: pdf, jpg, png, heic (converted).

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # sb_publishable_… (renamed from the anon key in M1)
SUPABASE_SECRET_KEY=                # sb_secret_…, server only, never in a client (lib/supabase/admin.ts)
SUPABASE_INTERNAL_URL=              # optional: server-to-Supabase URL behind the proxy (e.g. loopback gateway)
TRUST_PROXY_CLIENT_IP=1             # only behind a proxy that OVERWRITES X-Real-IP (Auth per-IP limits, docs/18 F1)
CLIENT_IP_HEADER=x-real-ip
OPENAI_API_KEY=                     # server only
OPENAI_MODEL_EXTRACT=gpt-4.1-mini   # or current structured-output capable model
EMAIL_TRANSPORT=smtp                # mailpit = local mail catcher (development only)
EMAIL_FROM=mcci@aderalabs.tech      # initial sender; switch to the official MCCI domain by configuration only
EMAIL_FROM_NAME=MCCI
SMTP_HOST= SMTP_PORT=587 SMTP_SECURE= SMTP_USER= SMTP_PASS=   # a relay allowed to send for EMAIL_FROM's domain
CRON_SECRET=                        # shared with pg_cron http calls
APP_URL=https://digital.mcci.org.pk
VERIFY_BASE_URL=https://mcci.org.pk/verify   # printed in QR codes
```

## Environments
- `local` — Supabase CLI (`supabase start`, Postgres 17 image `17.11.0.004` for CLI 2.121), test personas from
  `supabase/seed.sql`. Never real MCCI data.
- `staging` — self-hosted Supabase stack (pinned release; Postgres `17.6.1.136` at the time of review) on an
  MCCI-controlled server *(decision D-M1)*; demo + anonymised member import; used for MCCI UAT. Not provisioned yet.
- `production` — self-hosted stack on an MCCI-controlled server *(decision D-M1)*; real data; only the Secretary General
  can export data. Self-hosted Supabase has **no built-in backups or point-in-time recovery**: nightly dumps, WAL
  archiving and storage-volume backups must be set up and restore-tested *(decision D-M3)*. Not provisioned yet.

## Deployment (planned — nothing has been deployed)
1. **Database tier:** pin a self-hosted Supabase release; generate every secret with the upstream scripts and keep them
   in a secrets manager; TLS proxy in front of the gateway; only HTTPS published; Studio, Postgres, pooler and object
   storage reachable from the admin network only (`docs/17` §10).
2. **Migrations:** applied to staging first, then production after approval, from a trusted admin machine or runner with
   access to that server, and only after a verified backup. The exact mechanism (for example the Supabase CLI against the
   server's database URL) is chosen when the servers exist. Migrations are never applied from a public CI job to
   production. CI today only runs the rolled-back dry run (`db-security` job).
3. **Next.js app:** host not decided *(decision D-M1)* — on the same MCCI server or a separate host. Preview deployments
   per pull request only if a host that supports them is chosen.
4. Custom domain + TLS; Auth site URL and redirect URLs; production SMTP with SPF/DKIM/DMARC for the sender domain.
5. Error monitoring (Sentry) and uptime check on `/api/health`; container log shipping (logs/analytics are not in the
   default self-hosted stack).
