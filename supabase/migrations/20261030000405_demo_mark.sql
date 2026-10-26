-- 0405 · Mark a self-registered applicant as demo (owner's choice, 26 Oct 2026).
--
-- Someone who signed up on their own (a real company) could not choose the demo members as proposer / seconder:
-- demo members endorse demo applications only (0350). The Secretary General can now mark such an applicant as demo.
-- The company gets the DEMO label and a removal date; its application then finds the demo members, never goes to the
-- committee and never gets an official number (0350 rules), and "Remove all demo data" removes it with its sign-in.
-- Only while nothing official hangs on it: not a member, the application not past the proposer step, no proposer /
-- seconder requests yet, no fee voucher or receipt, no service request. At most 10 demo companies (as demo_add).
-- Who: staff with reg ≥ 3 (Secretary General, Deputy Secretary — Membership), 2-step session. Audited (0240 triggers).

-- why a company cannot be marked as demo (null = it can)
create function private.demo_mark_why(p_company uuid) returns text
  language sql stable security definer set search_path = ''
  as $$
    select case
      when c.id is null then 'not_found'
      when c.demo then 'already'
      when exists (select 1 from public.members m where m.company_id = c.id) then 'member'
      when not exists (select 1 from public.applications a where a.company_id = c.id) then 'no_application'
      when exists (select 1 from public.applications a where a.company_id = c.id
                   and a.stage not in ('draft', 'submitted', 'review', 'returned', 'proposer')) then 'too_far'
      when exists (select 1 from public.endorsements e join public.applications a on a.id = e.application_id
                   where a.company_id = c.id) then 'endorsements'
      when exists (select 1 from public.payment_vouchers v where v.company_id = c.id)
        or exists (select 1 from public.payment_receipts r where r.company_id = c.id) then 'payments'
      when exists (select 1 from public.service_requests s where s.company_id = c.id) then 'services'
    end
    from (select p_company as id) x
    left join public.companies c on c.id = x.id
  $$;
revoke all on function private.demo_mark_why(uuid) from public, anon, authenticated, service_role;

-- the self-registered applicants that can be marked as demo (for the Members Register)
create function api.demo_markable()
  returns table (company_id uuid, company text, token text, stage public.app_stage, owner_email text, created_at timestamptz)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('reg') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select c.id, c.name, a.token, a.stage,
           (select p.email::text from public.company_users cu join public.profiles p on p.id = cu.user_id
             where cu.company_id = c.id order by (cu.role = 'Owner') desc, cu.created_at limit 1),
           a.created_at
      from public.companies c
      join lateral (select x.token, x.stage, x.created_at from public.applications x
                     where x.company_id = c.id order by x.created_at desc limit 1) a on true
     where not c.demo and private.demo_mark_why(c.id) is null
     order by a.created_at desc
     limit 50;
end $$;

create function api.demo_mark(p_company uuid, p_days int default 7) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_why text;
  v_name text;
begin
  if auth.uid() is null or private.staff_level('reg') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  -- one at a time per company (two clicks, or two staff members)
  perform 1 from public.companies c where c.id = p_company for update;
  v_why := private.demo_mark_why(p_company);
  if v_why is not null then
    raise exception 'cannot mark as demo: %', v_why using errcode = 'P0001', hint = v_why;
  end if;
  if (select count(*) from public.companies c where c.demo) >= 10 then
    raise exception 'at most 10 demo accounts' using errcode = 'P0001', hint = 'too_many';
  end if;
  perform private.set_reason('applicant marked as demo');
  update public.companies c
     set demo = true,
         demo_expires_at = now() + make_interval(days => greatest(1, least(coalesce(p_days, 7), 30))),
         name = case when c.name like 'DEMO — %' then c.name else 'DEMO — ' || left(c.name, 180) end
   where c.id = p_company
  returning c.name into v_name;
  return v_name;
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.demo_markable()', 'api.demo_mark(uuid,int)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
