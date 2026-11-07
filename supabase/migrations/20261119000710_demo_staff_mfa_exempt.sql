-- 0710 · Time-limited 2-step exemption for DEMO staff only (owner, 7 Nov 2026: demo sign-ins without the authenticator
-- for a meeting; expiry chosen by the owner: end of 9 Nov 2026, Asia/Karachi).
--
-- Staff permissions need a 2-step-verified session (0310, docs/09). staff.mfa_exempt_until lets a password-only session
-- count as verified, but ONLY when all of these hold, checked here in the database on every request:
--   * the staff row is active and mfa_exempt_until is in the future (it lapses by itself; nobody has to remember);
--   * the account's email is at the demo domain (@demo.mcci.test, scripts/ops/demo-accounts.mjs), so a real staff
--     member can never be exempted, whatever is written in the column.
-- The column is set only on the server (service role / postgres); staff rows are not writable over the API, and the
-- change is in the audit log (audit_row on staff). Authenticator entries are kept, so after the expiry demo staff use
-- the same Google Authenticator entry as before.

alter table public.staff add column mfa_exempt_until timestamptz;
comment on column public.staff.mfa_exempt_until is
  'demo staff only (@demo.mcci.test): until then a password-only session counts as 2-step verified (0710)';

create function private.mfa_exempt(p_user uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1 from public.staff s join public.profiles p on p.id = s.user_id
       where s.user_id = p_user and s.active and s.mfa_exempt_until > now()
         and lower(p.email::text) like '%@demo.mcci.test')
  $$;
revoke all on function private.mfa_exempt(uuid) from public, anon, authenticated;

-- 0310's function, with the exemption as the only addition
create or replace function private.staff_level(p_module text) returns smallint
  language sql stable security definer set search_path = ''
  as $$
    select case when coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal', '') = 'aal2'
                  or private.mfa_exempt(auth.uid()) then coalesce((
      select coalesce(o.level, rp.level, 0)
      from public.staff s
      left join public.staff_permission_overrides o on o.user_id = s.user_id and o.module = p_module
      left join public.role_permissions rp on rp.designation = s.designation and rp.module = p_module
      where s.user_id = auth.uid() and s.active
    ), 0) else 0 end::smallint
  $$;

-- the app asks once per request whether a password-only staff session counts as verified
create function api.my_mfa_exempt() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select private.mfa_exempt(auth.uid()) $$;
revoke all on function api.my_mfa_exempt() from public, anon;
grant execute on function api.my_mfa_exempt() to authenticated;
