# 09 · Security and privacy

- **AuthN:** Supabase Auth; passwords ≥ 10 chars; email verification required; staff TOTP mandatory; session 12 h
  (staff 8 h idle timeout); sign out all devices on password change.
- **AuthZ:** RLS on every table (`sql/0002_rls.sql`) **and** `requirePermission()` in every server action. Never
  trust role/level sent from the client. The service-role key is used only in cron, PDF and verify handlers.
- **Data minimisation:** endorsers and the public never see CNICs, mobiles, emails or documents. Public directory =
  `public_directory` view. Track page shows stage only.
- **Files:** private buckets, signed URLs (10 min), content-type sniffing, size limits, no inline HTML/SVG uploads.
- **Input:** zod on every action; parameterised queries only (Supabase client); escape all user text in PDFs.
- **Rate limits:** login, OTP, verify, AI extraction, contact form (per IP + per user). Lock OTP after 5 attempts.
- **Headers:** CSP (self + Supabase + OpenAI only from server), HSTS, frame-ancestors none, referrer-policy strict.
- **Audit:** every write → `audit_log` with old/new values; audit log is append-only (no update/delete policy).
- **Secrets:** env vars only; rotate keys at go-live; `.env*` in `.gitignore`.
- **Backups:** daily + PITR; quarterly restore test; SG-only export of member data, audited.
- **Privacy notice & consent** on registration (data used for membership processing; documents retained while
  membership active + 7 years unless MCCI policy says otherwise — `TODO(MCCI)`).
- **Pen-test checklist before go-live:** IDOR on every `[id]` route, RLS tests for each role, OTP brute force,
  file upload abuse, XSS in names/notes, CSRF (server actions use same-site cookies + origin check).
