-- 0400 · Designation limits change only after the person re-enters their password (owner's request, 26 Oct 2026).
--
-- Staff & Roles → Limits by designation: a designation's limits are saved together (api.role_permissions_save), and
-- only within 5 minutes of a successful password check made by the app's server (Supabase Auth verifies the
-- password; the server then records it with api.reauth_mark, service role only). The mark is used up by the change, so
-- a stolen session alone — or a direct call to the database — cannot change limits. The one-cell function of 0290 is
-- no longer callable by signed-in users; "Reset to defaults" needs the same check.

create table private.staff_reauth (
  user_id uuid primary key references public.profiles on delete cascade,
  at timestamptz not null default now()
);
alter table private.staff_reauth enable row level security;
revoke all on private.staff_reauth from public, anon, authenticated, service_role;

-- the server confirms the password was just verified for this person
create function api.reauth_mark(p_user uuid) returns void
  language sql volatile security definer set search_path = ''
  as $$
    insert into private.staff_reauth (user_id, at) values (p_user, now())
    on conflict (user_id) do update set at = excluded.at
  $$;
revoke all on function api.reauth_mark(uuid) from public, anon, authenticated;
grant execute on function api.reauth_mark(uuid) to service_role;

-- used up by the change it allows; at most 5 minutes old
create function private.reauth_take() returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  delete from private.staff_reauth r where r.user_id = auth.uid() and r.at > now() - interval '5 minutes';
  if not found then
    raise exception 'confirm with your password' using errcode = 'P0001', hint = 'reauth';
  end if;
end $$;
revoke all on function private.reauth_take() from public, anon, authenticated, service_role;

create function api.role_permissions_save(p_designation text, p_levels jsonb) returns int
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  k text;
  v smallint;
  n int := 0;
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
  if jsonb_typeof(p_levels) is distinct from 'object' then
    raise exception 'levels missing' using errcode = 'P0001', hint = 'level';
  end if;
  for k in select jsonb_object_keys(p_levels) loop
    if k not in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat') then
      raise exception 'unknown module' using errcode = 'P0001', hint = 'module';
    end if;
    if jsonb_typeof(p_levels -> k) <> 'number' or (p_levels ->> k)::numeric not in (0, 1, 2, 3) then
      raise exception 'level out of range' using errcode = 'P0001', hint = 'level';
    end if;
  end loop;
  perform private.reauth_take();
  perform private.set_reason('designation limits saved after password confirmation: ' || p_designation);
  for k in select jsonb_object_keys(p_levels) loop
    v := (p_levels ->> k)::smallint;
    insert into public.role_permissions (designation, module, level) values (p_designation, k, v)
    on conflict (designation, module) do update set level = excluded.level
    where public.role_permissions.level is distinct from excluded.level;
    if found then
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke all on function api.role_permissions_save(text, jsonb) from public, anon, service_role;
grant execute on function api.role_permissions_save(text, jsonb) to authenticated;

-- "Reset to defaults" also needs the password (0290 body + the check)
create or replace function api.role_permissions_reset() returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('staff') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.reauth_take();
  perform private.set_reason('designation limits reset to defaults after password confirmation');
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

-- the one-cell change (0290) bypassed the password: no longer callable by signed-in users
revoke execute on function api.role_permission_set(text, text, smallint) from authenticated;
