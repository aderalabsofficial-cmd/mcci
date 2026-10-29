-- 0470 · Staff and member accounts are separate (owner's request, 29 Oct 2026): "anyone in staff only should access
-- admin; if they want a user account they will create one with a separate email and profile."
--
--   * A staff account sees no member company's data: the company helpers every member policy uses
--     (private.my_company_ids / my_company_role, and through them company_level / my_member_ids) return nothing for an
--     active staff member, and api.my_access lists no companies for them. A company link made earlier (production has
--     one: the Secretary's own test application) stays in the table but gives no access.
--   * New links are refused: an active staff member cannot join a company (company_users), and a person who belongs to
--     a company cannot be made active staff (staff), unless the other side is ended first.
-- The app agrees: the member login refuses staff accounts, the portal sends staff to the admin panel, and staff sign in
-- on their own page (lib/auth/staff-path.ts).

create function private.is_staff_user(p_user uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.staff s where s.user_id = p_user and s.active) $$;
revoke all on function private.is_staff_user(uuid) from public, anon;
grant execute on function private.is_staff_user(uuid) to authenticated, service_role;

create or replace function private.my_company_ids() returns setof uuid
  language sql stable security definer set search_path = ''
  as $$ select cu.company_id from public.company_users cu
         where cu.user_id = auth.uid() and cu.status = 'Active' and not private.is_staff_user(auth.uid()) $$;

create or replace function private.my_company_role(p_company uuid) returns public.company_role
  language sql stable security definer set search_path = ''
  as $$ select cu.role from public.company_users cu
         where cu.user_id = auth.uid() and cu.company_id = p_company and cu.status = 'Active'
           and not private.is_staff_user(auth.uid()) $$;

create or replace function api.my_access() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  v_uid uuid := auth.uid();
  v_staff jsonb;
  v_companies jsonb;
  v_profile record;
  v_totp boolean := false;
begin
  if v_uid is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select p.id, p.email::text as email, p.full_name, p.lang into v_profile from public.profiles p where p.id = v_uid;

  select jsonb_build_object(
           'designation', s.designation,
           'seniority', d.seniority,
           'levels', (select jsonb_object_agg(m.module, private.staff_level(m.module))
                      from unnest(array['dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat'])
                           as m(module)))
    into v_staff
    from public.staff s
    join public.designations d on d.name = s.designation
   where s.user_id = v_uid and s.active;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id,
           'name', c.name,
           'role', cu.role,
           'levels', (select jsonb_object_agg(a.area, private.company_level(c.id, a.area))
                      from unnest(array['mship','svc','docs','pay','events','profile']) as a(area)))
           order by c.name), '[]'::jsonb)
    into v_companies
    from public.company_users cu
    join public.companies c on c.id = cu.company_id
   where cu.user_id = v_uid and cu.status = 'Active'
     and v_staff is null;  -- 0470: a staff account has no member companies

  -- auth.mfa_factors is created by Supabase Auth itself (present on every real stack, absent in the bare database
  -- image of scripts/db/dry-run.sh), so it is looked up only when it exists
  if to_regclass('auth.mfa_factors') is not null then
    execute 'select exists (select 1 from auth.mfa_factors f where f.user_id = $1 and f.factor_type::text = ''totp''
             and f.status::text = ''verified'')' into v_totp using v_uid;
  end if;

  return jsonb_build_object(
    'user_id', v_uid,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'lang', v_profile.lang,
    'staff', v_staff,
    'companies', v_companies,
    'mfa', jsonb_build_object('totp_verified', v_totp)
  );
end $$;

-- ───────── no new links between the two kinds of account ─────────
create function private.company_user_not_staff() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if new.status = 'Active'
     and (tg_op = 'INSERT' or old.status <> 'Active' or old.user_id <> new.user_id)
     and private.is_staff_user(new.user_id) then
    raise exception 'a staff account cannot belong to a member company; use a separate account'
      using errcode = 'P0001', hint = 'staff_account';
  end if;
  return new;
end $$;
revoke all on function private.company_user_not_staff() from public, anon, authenticated;
create trigger company_users_not_staff before insert or update of user_id, status on public.company_users
  for each row execute function private.company_user_not_staff();

create function private.staff_not_member() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if new.active
     and (tg_op = 'INSERT' or not old.active or old.user_id <> new.user_id)
     and exists (select 1 from public.company_users cu where cu.user_id = new.user_id and cu.status = 'Active') then
    raise exception 'this account belongs to a member company; staff need a separate account'
      using errcode = 'P0001', hint = 'member_account';
  end if;
  return new;
end $$;
revoke all on function private.staff_not_member() from public, anon, authenticated;
create trigger staff_not_member before insert or update of user_id, active on public.staff
  for each row execute function private.staff_not_member();
