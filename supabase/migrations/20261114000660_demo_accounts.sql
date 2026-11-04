-- 0660 · Demo accounts for the owner's end-to-end test of the whole flow (owner, 4 Nov 2026): an applicant, active
-- members to propose and second, and staff in each designation. Called only by scripts/ops/demo-accounts.mjs on the
-- server (service role), which creates the sign-in accounts first (already confirmed, no email needed) and shows
-- their passwords once in the owner's terminal. Everything is marked demo:
--   the applicant gets a demo company (no member number) of which they are the Owner, so their application, its files
--   and its endorsements go with api.demo_purge (0530); the members are demo companies with a DEMO- number (never a
--   certificate, never in the public directory); staff rows carry the reason "demo account" in the audit log.
-- Removal (api.demo_accounts_remove): the staff rows are deactivated (their actions stay linked in the audit log) and
-- the demo companies are returned for the script to purge. A designation that does not exist is skipped and reported:
-- which permissions a new designation has is MCCI's decision, made in Staff & Audit.

create function api.demo_accounts_setup(p jsonb) returns jsonb
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r jsonb;
  v_user uuid;
  v_company uuid;
  v_class public.member_class;
  v_no text;
  out jsonb := '[]'::jsonb;
begin
  perform private.set_reason('demo account (owner''s end-to-end test, 4 Nov 2026)');
  for r in select * from jsonb_array_elements(coalesce(p -> 'staff', '[]')) loop
    v_user := (r ->> 'user')::uuid;
    if not exists (select 1 from public.designations d where d.name = r ->> 'designation') then
      out := out || jsonb_build_object('user', v_user, 'skipped', 'no designation ' || (r ->> 'designation'));
      continue;
    end if;
    insert into public.staff (user_id, designation) values (v_user, r ->> 'designation')
    on conflict (user_id) do update set designation = excluded.designation, active = true, deactivated_at = null;
    out := out || jsonb_build_object('user', v_user, 'staff', r ->> 'designation');
  end loop;
  for r in select * from jsonb_array_elements(coalesce(p -> 'companies', '[]')) loop
    v_user := (r ->> 'user')::uuid;
    insert into public.companies (name, biz_type, demo, demo_expires_at)
    values ('DEMO — ' || left(btrim(r ->> 'company'), 180), 'prop', true, now() + interval '30 days')
    returning id into v_company;
    insert into public.company_users (company_id, user_id, role) values (v_company, v_user, 'Owner');
    v_no := null;
    if r ->> 'class' is not null then
      v_class := (r ->> 'class')::public.member_class;
      v_no := 'DEMO-' || (case when v_class = 'Corporate' then 'C' else 'A' end) || '-' ||
              lpad((select count(*) + 1 from public.members x join public.companies c on c.id = x.company_id
                    where c.demo and x.class = v_class)::text, 2, '0');
      insert into public.members (member_no, company_id, class, status, rep_name, since, valid_to, public_listing)
      values (v_no, v_company, v_class, 'Permanent', btrim(r ->> 'rep'), (now() at time zone 'Asia/Karachi')::date,
              private.membership_year_end(), false);
    end if;
    out := out || jsonb_build_object('user', v_user, 'company', v_company, 'member_no', v_no);
  end loop;
  return out;
end $$;

-- the demo staff rows are deactivated; returns the demo companies of these accounts, for api.demo_purge
create function api.demo_accounts_remove(p_users uuid[]) returns uuid[]
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  perform private.set_reason('demo account removed (owner''s end-to-end test)');
  update public.staff s set active = false, deactivated_at = now()
   where s.user_id = any(p_users) and s.active;
  return coalesce((select array_agg(distinct cu.company_id) from public.company_users cu join public.companies c on c.id = cu.company_id
                    where cu.user_id = any(p_users) and c.demo), '{}');
end $$;

revoke all on function api.demo_accounts_setup(jsonb) from public, anon, authenticated;
revoke all on function api.demo_accounts_remove(uuid[]) from public, anon, authenticated;
grant execute on function api.demo_accounts_setup(jsonb) to service_role;
grant execute on function api.demo_accounts_remove(uuid[]) to service_role;
