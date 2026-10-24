-- 0290 · what the Staff & Roles and Company Profile screens read and change beyond 0280 (M1; actions perm.cycle,
-- perm.reset, staff.reset2fa, user.* list)
--
-- Same pattern as 0280: SECURITY DEFINER + empty search_path, permission checked here, 42501 = not allowed, P0001 with
-- a stable hint that the UI maps to a bilingual message.
--   api.staff_directory()          staff module level 1 — names, emails, designation, seniority, 2-step status,
--                                   last sign-in (profiles RLS would allow the names, but 2-step status and last
--                                   sign-in live in auth.*, which clients cannot read)
--   api.company_people(company)    company area 'profile' level 1 — the colleagues of one's own company. profiles RLS
--                                   is own-row only (members must not read other companies' people), so this returns
--                                   name/email/role of the SAME company's active users and nothing else
--   api.role_permission_set(...)   staff level 3 — one designation's limit on one module; Secretary General is fixed
--   api.role_permissions_reset()   staff level 3 — back to the limits this migration snapshots as defaults
--   api.staff_mfa_reset(user)      staff level 3 — records the reset (audit) before the trusted server deletes the
--                                   person's authenticators through the Auth admin API

-- ───────── default limits (snapshot of the reference data loaded in 0140; never changed by the app) ─────────
create table private.role_permission_defaults as select designation, module, level from public.role_permissions;
alter table private.role_permission_defaults add primary key (designation, module);
alter table private.role_permission_defaults enable row level security;   -- no policies: only definer functions read it
revoke all on private.role_permission_defaults from public, anon, authenticated;

-- ───────── staff list ─────────
create function api.staff_directory()
  returns table (user_id uuid, full_name text, email text, designation text, seniority smallint, active boolean,
                 totp boolean, last_sign_in_at timestamptz, created_at timestamptz)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('staff') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  -- auth.mfa_factors / auth.users.last_sign_in_at belong to Supabase Auth (absent in the bare dry-run image)
  if to_regclass('auth.mfa_factors') is not null then
    return query execute $q$
      select s.user_id, p.full_name, p.email::text, s.designation, d.seniority, s.active,
             exists (select 1 from auth.mfa_factors f where f.user_id = s.user_id and f.factor_type::text = 'totp'
                     and f.status::text = 'verified'),
             u.last_sign_in_at, s.created_at
        from public.staff s
        join public.profiles p on p.id = s.user_id
        join public.designations d on d.name = s.designation
        left join auth.users u on u.id = s.user_id
       order by s.active desc, d.seniority desc, p.full_name$q$;
  else
    return query
      select s.user_id, p.full_name, p.email::text, s.designation, d.seniority, s.active, false, null::timestamptz,
             s.created_at
        from public.staff s
        join public.profiles p on p.id = s.user_id
        join public.designations d on d.name = s.designation
       order by s.active desc, d.seniority desc, p.full_name;
  end if;
end $$;

-- ───────── company colleagues ─────────
create function api.company_people(p_company uuid)
  returns table (user_id uuid, full_name text, email text, role public.company_role, created_at timestamptz)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or p_company is null or private.company_level(p_company, 'profile') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select cu.user_id, p.full_name, p.email::text, cu.role, cu.created_at
      from public.company_users cu
      join public.profiles p on p.id = cu.user_id
     where cu.company_id = p_company and cu.status = 'Active'
     order by (cu.role = 'Owner') desc, p.full_name;
end $$;

-- ───────── limits by designation ─────────
create function api.role_permission_set(p_designation text, p_module text, p_level smallint) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('staff') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_designation = 'Secretary General' then
    raise exception 'Secretary General keeps full control' using errcode = 'P0001', hint = 'sg_fixed';
  end if;
  if not exists (select 1 from public.designations d where d.name = p_designation) then
    raise exception 'unknown designation' using errcode = 'P0001', hint = 'designation';
  end if;
  if p_module is null or p_module not in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat') then
    raise exception 'unknown module' using errcode = 'P0001', hint = 'module';
  end if;
  if p_level is null or p_level not between 0 and 3 then
    raise exception 'level out of range' using errcode = 'P0001', hint = 'level';
  end if;
  perform private.set_reason('designation limit changed');
  insert into public.role_permissions (designation, module, level) values (p_designation, p_module, p_level)
  on conflict (designation, module) do update set level = excluded.level;
end $$;

create function api.role_permissions_reset() returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('staff') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('designation limits reset to defaults');
  update public.role_permissions rp set level = d.level
    from private.role_permission_defaults d
   where d.designation = rp.designation and d.module = rp.module and rp.level <> d.level;
  insert into public.role_permissions (designation, module, level)
  select d.designation, d.module, d.level from private.role_permission_defaults d
  on conflict (designation, module) do nothing;
  delete from public.role_permissions rp
   where not exists (select 1 from private.role_permission_defaults d
                     where d.designation = rp.designation and d.module = rp.module);
end $$;

-- ───────── 2-step login reset ─────────
-- Writes the audit entry (always, even when nothing in public.staff changes) and clears staff.totp_enabled. The
-- trusted server then deletes the authenticators with the Auth admin API; it calls this function FIRST with the
-- manager's own session, so a refused or failed check never reaches the admin API.
create function api.staff_mfa_reset(p_user uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('staff') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'cannot reset your own 2-step login here' using errcode = 'P0001', hint = 'self';
  end if;
  if not exists (select 1 from public.staff s where s.user_id = p_user) then
    raise exception 'not a staff member' using errcode = 'P0001', hint = 'not_staff';
  end if;
  perform private.set_reason('2-step login reset');
  update public.staff set totp_enabled = false where staff.user_id = p_user and totp_enabled;
  insert into public.audit_log (user_id, actor_role, action, object, object_id, reason, request_id)
  values (auth.uid(), coalesce(auth.role(), session_user::text), 'staff.reset2fa', 'staff', p_user::text,
          '2-step login reset', private.request_header('x-request-id'));
end $$;

revoke all on function api.staff_directory(), api.company_people(uuid), api.role_permission_set(text, text, smallint),
  api.role_permissions_reset(), api.staff_mfa_reset(uuid) from public, anon;
grant execute on function api.staff_directory(), api.company_people(uuid), api.role_permission_set(text, text, smallint),
  api.role_permissions_reset(), api.staff_mfa_reset(uuid) to authenticated;
