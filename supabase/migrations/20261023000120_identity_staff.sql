-- 0120 · identity, staff, permissions (docs/02, docs/06) and per-user tables (docs/15 §6, docs/16 C2, E5)
-- Findings: F-08 (overrides of deactivated staff), F-14 (SECURITY DEFINER search_path), F-15 (profile self-update),
-- F-17 (invitation token hash).

create table public.profiles (                   -- 1:1 with auth.users, created by trigger
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  email extensions.citext not null unique,       -- mirrored from auth.users; changed only through Auth (C1)
  mobile text,
  cnic text,                                     -- protection at rest: decision D-M7
  lang text not null default 'en' check (lang in ('en','ur')),
  prefs jsonb not null default '{}',             -- notification preferences per category (docs/15 §6)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- draft column profiles.is_staff removed: access is decided by public.staff only (F-15)

create table public.designations (               -- docs/06 "Designations (seniority L1–L5)"
  name text primary key,
  seniority smallint not null check (seniority between 1 and 5)
);

create table public.role_permissions (           -- default limits per designation, editable by the SG (docs/06)
  designation text not null references public.designations on update cascade,
  module text not null check (module in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat')),
  level smallint not null check (level between 0 and 3),
  primary key (designation, module)
);

create table public.staff (
  user_id uuid primary key references public.profiles on delete cascade,
  designation text not null references public.designations on update cascade,
  active boolean not null default true,
  totp_enabled boolean not null default false,
  deactivated_at timestamptz,
  deactivated_by uuid references public.profiles,
  created_at timestamptz not null default now(),
  check (active or deactivated_at is not null)
);

create table public.staff_permission_overrides ( -- optional per-person override (docs/06)
  user_id uuid not null references public.staff on delete cascade,
  module text not null check (module in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat')),
  level smallint not null check (level between 0 and 3),
  reason text not null,
  set_by uuid references public.profiles,
  set_at timestamptz not null default now(),
  primary key (user_id, module)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('staff','company_user')),
  email extensions.citext not null,
  full_name text,
  designation text references public.designations,
  company_id uuid,                               -- FK added in 0130
  company_role public.company_role,
  token_hash text not null,                      -- sha256 of the emailed token; never readable by clients (F-17)
  status public.invite_status not null default 'Invited',
  invited_by uuid references public.profiles,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_by uuid references public.profiles,
  created_at timestamptz not null default now(),
  check ((kind = 'staff' and designation is not null) or (kind = 'company_user' and company_id is not null and company_role is not null))
);
create unique index invitations_one_open on public.invitations (lower(email::text), kind, coalesce(company_id::text, '')) where status = 'Invited';

create table public.consents (                   -- docs/16 E5: which terms/privacy version a user accepted
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  document text not null check (document in ('terms','privacy')),
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, document, version)
);

create table public.device_tokens (              -- docs/15 §6: own rows only; staff cannot read tokens
  token text primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  platform text not null default 'android' check (platform in ('android')),
  app_version text,
  lang text check (lang in ('en','ur')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.account_deletion_requests (  -- docs/15 §6, docs/16 C2; decided by staff reg >= 3 (acc.delete)
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  reason text,
  status public.deletion_status not null default 'Requested',
  decided_by uuid references public.profiles,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index deletion_one_open on public.account_deletion_requests (user_id) where status in ('Requested','Approved');

-- ───────── permission helpers (F-08, F-14) ─────────
create function private.is_staff() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.staff s where s.user_id = auth.uid() and s.active) $$;

-- Level 0..3 of the current user on an admin module. Inactive staff always get 0, including their overrides (F-08).
create function private.staff_level(p_module text) returns smallint
  language sql stable security definer set search_path = ''
  as $$
    select coalesce((
      select coalesce(o.level, rp.level, 0)
      from public.staff s
      left join public.staff_permission_overrides o on o.user_id = s.user_id and o.module = p_module
      left join public.role_permissions rp on rp.designation = s.designation and rp.module = p_module
      where s.user_id = auth.uid() and s.active
    ), 0)::smallint
  $$;

grant execute on function private.is_staff(), private.staff_level(text) to authenticated, service_role;

-- ───────── new auth user → profile; email kept in sync with Auth ─────────
create function private.handle_new_user() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  insert into public.profiles (id, email, full_name, lang)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'lang' = 'ur' then 'ur' else 'en' end
  );
  return new;
end $$;

create function private.sync_user_email() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
create trigger on_auth_user_email after update of email on auth.users for each row execute function private.sync_user_email();

-- ───────── RLS + grants ─────────
alter table public.profiles enable row level security;
alter table public.designations enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff enable row level security;
alter table public.staff_permission_overrides enable row level security;
alter table public.invitations enable row level security;
alter table public.consents enable row level security;
alter table public.device_tokens enable row level security;
alter table public.account_deletion_requests enable row level security;

-- profiles: own row, or staff with members-register / membership view
grant select on public.profiles to authenticated;
grant update (full_name, mobile, lang, prefs) on public.profiles to authenticated;   -- F-15: not email, not cnic
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.staff_level('reg')) >= 1 or (select private.staff_level('mem')) >= 1 or (select private.staff_level('staff')) >= 1);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.designations, public.role_permissions, public.staff to authenticated;
create policy designations_select on public.designations for select to authenticated using ((select private.is_staff()));
create policy role_permissions_select on public.role_permissions for select to authenticated using ((select private.is_staff()));
create policy staff_select on public.staff for select to authenticated using ((select private.is_staff()));

grant select on public.staff_permission_overrides to authenticated;
create policy overrides_select on public.staff_permission_overrides for select to authenticated
  using (user_id = (select auth.uid()) or (select private.staff_level('staff')) >= 1);

-- invitations: never token_hash (F-17); staff managers see all, a company Owner sees invitations of their company
grant select (id, kind, email, full_name, designation, company_id, company_role, status, invited_by, expires_at, accepted_at, created_at)
  on public.invitations to authenticated;
-- company branch added in 0130 (needs private.my_company_role)
create policy invitations_select_staff on public.invitations for select to authenticated
  using ((select private.staff_level('staff')) >= 3);

grant select on public.consents to authenticated;
grant insert (document, version) on public.consents to authenticated;   -- user_id comes from the default (auth.uid())
create policy consents_select on public.consents for select to authenticated using (user_id = (select auth.uid()));
create policy consents_insert on public.consents for insert to authenticated with check (user_id = (select auth.uid()));

grant select, delete on public.device_tokens to authenticated;
grant insert (token, platform, app_version, lang) on public.device_tokens to authenticated;
grant update (app_version, lang, last_seen_at) on public.device_tokens to authenticated;
create policy device_tokens_select on public.device_tokens for select to authenticated using (user_id = (select auth.uid()));
create policy device_tokens_insert on public.device_tokens for insert to authenticated with check (user_id = (select auth.uid()));
create policy device_tokens_update on public.device_tokens for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy device_tokens_delete on public.device_tokens for delete to authenticated using (user_id = (select auth.uid()));

grant select on public.account_deletion_requests to authenticated;
grant insert (reason) on public.account_deletion_requests to authenticated;
create policy deletion_select on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select private.staff_level('reg')) >= 3);
create policy deletion_insert on public.account_deletion_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'Requested');

-- audit log readable by staff with staff/audit >= 1 (docs/06 "audit.* → staff 1")
grant select on public.audit_log to authenticated;
create policy audit_log_select on public.audit_log for select to authenticated using ((select private.staff_level('staff')) >= 1);
