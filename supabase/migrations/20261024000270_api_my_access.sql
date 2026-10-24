-- 0270 · api.my_access(): the signed-in person's own access, for server-side permission checks (M1, docs/06)
--
-- lib/permissions (requirePermission) needs the same numbers the policies use. They live in private helpers that the
-- API cannot reach, so this function returns them for the CALLER ONLY — nothing about anyone else:
--   staff      active staff only: designation + level 0..3 per admin module (overrides included, private.staff_level;
--              a deactivated person gets null, exactly like the policies, F-08)
--   companies  active company memberships: role + level 0..3 per area (private.company_level, docs/06 matrix)
--   mfa        whether a verified TOTP factor exists (staff must have one; the session's AAL comes from the JWT)
-- The app must still enforce every rule again in the database (RLS / api.* functions); this function only lets the
-- server decide what to show and refuse early with a friendly message.
create function api.my_access() returns jsonb
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
   where cu.user_id = v_uid and cu.status = 'Active';

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
revoke all on function api.my_access() from public, anon;
grant execute on function api.my_access() to authenticated;
