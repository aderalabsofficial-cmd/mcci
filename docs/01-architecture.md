# 01 · Architecture

## Overview

```
Browser (EN/UR, RTL)                Next.js on Vercel                         Supabase
───────────────────     ─────────────────────────────────────     ─────────────────────────────
Public site  ─────────▶ Server Components (read via RLS)   ─────▶ Postgres + RLS
Member portal ────────▶ Server Actions (authz + zod + audit) ────▶  ├─ tables (02-data-model)
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
- `lib/supabase/admin.ts` — service-role client. **Only** in cron handlers, PDF generation and the public verify
  endpoint (which returns a fixed, minimal projection). Never import it in a component.
- `lib/supabase/client.ts` — browser client for Realtime subscriptions only.

## Live updates
Subscribe with Realtime to rows the user can read (RLS applies to Realtime):
- member: `notifications` where `user_id = me`, own `applications`, `endorsements` where `endorser_member_id = mine`
  or `application_id` in mine, own `service_requests`, `payments`.
- staff: queues they can see. On change → `router.refresh()` and a toast ("Live update: …"), exactly like the
  prototype's cross-tab behaviour.

## Storage buckets (all private)
| bucket | content | who reads |
|---|---|---|
| `application-docs` | applicant documents, photo, signature, stamp | owner company, staff with `mem ≥ view` |
| `receipts` | bank receipts | owner company, staff with `pay ≥ view` |
| `certificates` | temporary + permanent certificate PDFs, scans of printed certificates | owner company, staff `temp ≥ view` |
| `service-docs` | service request uploads and issued letters | owner company, staff `svc ≥ view` |
| `cms` | public images for news/pages | public read via signed/public URL |

Path convention: `{company_id}/{entity}/{entity_id}/{uuid}.{ext}`. Max 10 MB, types: pdf, jpg, png, heic (converted).

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only
OPENAI_API_KEY=                     # server only
OPENAI_MODEL_EXTRACT=gpt-4.1-mini   # or current structured-output capable model
EMAIL_FROM="MCCI <no-reply@mcci.org.pk>"
EMAIL_PROVIDER=smtp|resend
SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASS=
RESEND_API_KEY=
CRON_SECRET=                        # shared with pg_cron http calls
APP_URL=https://digital.mcci.org.pk
VERIFY_BASE_URL=https://mcci.org.pk/verify   # printed in QR codes
```

## Environments
- `local` — Supabase CLI (`supabase start`), seed with demo data.
- `staging` — separate Supabase project, demo + anonymised member import, used for MCCI UAT.
- `production` — real data; daily backups + point-in-time recovery; only Secretary General can export data.

## Deployment
1. GitHub repo → Vercel project (preview deployment per PR).
2. `supabase db push` from CI on merge to `main` (staging), manual promotion to production.
3. Custom domain + SSL; set Auth redirect URLs; configure SPF/DKIM/DMARC for the sender domain.
4. Error monitoring (Sentry) and uptime check on `/api/health`.
