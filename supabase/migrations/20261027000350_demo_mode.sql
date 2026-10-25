-- 0350 · Demo mode (for presentations): synthetic, clearly labelled demo members and applicants that use the real
-- workflow (sign-in, proposer & seconder with the emailed code) but stay apart from official membership data.
--
-- - companies.demo marks a demo company; its members get non-official numbers DEMO-A-01 / DEMO-C-01, never from the
--   official sequences; the names say DEMO.
-- - demo members endorse demo applications only, real members real ones (endorse_why + candidate list);
-- - demo applications never go on a committee agenda and are never decided (no membership number, no voucher);
-- - official counts and lists leave demo companies out (the app filters on companies.demo);
-- - api.demo_clear removes every demo row (the app then deletes the demo sign-in accounts and stored files).
-- Who: staff with reg ≥ 3 (Secretary General, Deputy Secretary — Membership), 2-step session.

alter table public.companies
  add column demo boolean not null default false,
  add column demo_expires_at timestamptz,
  add constraint companies_demo_expiry check (demo or demo_expires_at is null);
create index companies_demo on public.companies (demo) where demo;

create function private.company_is_demo(p_company uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select coalesce((select c.demo from public.companies c where c.id = p_company), false) $$;
revoke all on function private.company_is_demo(uuid) from public, anon, authenticated, service_role;

-- ───────── existing rules with the demo checks (copied from 0320 / 0330; only the marked lines are new) ─────────

create or replace function private.endorse_why(p_app uuid, p_role public.endorse_role, p_member uuid) returns text
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  a public.applications;
  m public.members;
  r jsonb := private.endorse_rules();
  v_cls public.member_class;
  v_other uuid;
begin
  select * into a from public.applications x where x.id = p_app;
  select * into m from public.members x where x.id = p_member;
  if a.id is null or m.id is null then
    return 'Not found';
  end if;
  -- demo mode (0350): demo members endorse demo applications only, and real members real ones
  if private.company_is_demo(m.company_id) is distinct from private.company_is_demo(a.company_id) then
    return case when private.company_is_demo(m.company_id) then 'Demo member (demo applications only)' else 'Not a demo member' end;
  end if;
  if not (m.status = 'Permanent' or (m.status = 'Temporary' and coalesce((r ->> 'tempMembersMayEndorse')::boolean, false))) then
    return 'Not a valid permanent member';
  end if;
  if m.valid_to < (now() at time zone 'Asia/Karachi')::date then
    return 'Membership has expired';
  end if;
  v_cls := coalesce(a.class, private.class_of(a.form));
  if coalesce((r ->> 'sameClass')::boolean, true) and m.class <> v_cls then
    return 'Different class (' || m.class::text || ')';
  end if;
  if m.company_id = a.company_id then
    return 'Your own company';
  end if;
  if private.norm_name(m.rep_name) <> '' and (
       private.norm_name(m.rep_name) = private.norm_name(a.form ->> 'rep')
       or exists (select 1 from public.application_partners p where p.application_id = p_app
                  and private.norm_name(p.name) = private.norm_name(m.rep_name))) then
    return 'Your representative or a partner / director';
  end if;
  select e.endorser_member_id into v_other from public.endorsements e
   where e.application_id = p_app and e.role <> p_role and e.status in ('Pending', 'Approved') limit 1;
  if v_other is not null and (v_other = p_member or (select x.company_id from public.members x where x.id = v_other) = m.company_id) then
    return 'Already your other endorser';
  end if;
  if (select count(*) from public.endorsements e where e.endorser_member_id = p_member and e.status = 'Approved'
        and e.decided_at > now() - interval '365 days') >= coalesce((r ->> 'maxPerYear')::int, 12) then
    return 'Yearly endorsement limit reached';
  end if;
  return null;
end $$;

create or replace function api.end_candidates(p_app uuid, p_role public.endorse_role, p_query text default '')
  returns table (member_id uuid, member_no text, company text, rep text, class text, sector text, same_sector boolean,
                 year_count int, why text)
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  v_q text := lower(btrim(coalesce(p_query, '')));
  v_sector text;
  v_demo boolean;
begin
  if auth.uid() is null or not private.app_applicant(p_app) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select a.form #>> '{nature,sector}' into v_sector from public.applications a where a.id = p_app;
  select private.company_is_demo(a.company_id) into v_demo from public.applications a where a.id = p_app;
  return query
    select m.id, m.member_no, c.name, m.rep_name, m.class::text, coalesce(c.nature_sector, c.sector, ''),
           (c.nature_sector is not null and c.nature_sector = v_sector),
           (select count(*)::int from public.endorsements e where e.endorser_member_id = m.id and e.status = 'Approved'
              and e.decided_at > now() - interval '365 days'),
           private.endorse_why(p_app, p_role, m.id)
    from public.members m join public.companies c on c.id = m.company_id
    where m.status in ('Permanent', 'Temporary')
      and private.company_is_demo(m.company_id) = v_demo
      and (v_q = '' or lower(m.rep_name || ' ' || c.name || ' ' || coalesce(c.nature_sector, '') || ' ' || m.member_no) like '%' || v_q || '%')
    order by (private.endorse_why(p_app, p_role, m.id) is null) desc,
             (c.nature_sector is not null and c.nature_sector = v_sector) desc, c.name
    limit 60;
end $$;

create or replace function private.cmt_place(p_app uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_meeting text;
  v_item int;
begin
  -- one placement at a time per file: two meetings scheduled at once must not both take it (the second waits here,
  -- then sees the open item the first one wrote)
  perform 1 from public.applications a where a.id = p_app for update;
  -- demo applications (0350) never go on an official agenda
  if (select private.company_is_demo(a.company_id) from public.applications a where a.id = p_app) then
    return null;
  end if;
  if (select a.stage from public.applications a where a.id = p_app) is distinct from 'committee'
     or exists (select 1 from public.committee_items i where i.application_id = p_app and i.decision is null) then
    return null;
  end if;
  select m.id into v_meeting from public.meetings m
  where m.committee = 'Membership Committee' and m.status = 'Pending'
    and m.held_on >= (now() at time zone 'Asia/Karachi')::date
    and not exists (select 1 from public.committee_items i where i.meeting_id = m.id and i.application_id = p_app)
  order by m.held_on, m.created_at
  limit 1
  for update;
  if v_meeting is null then
    return null;
  end if;
  select coalesce(max(i.item_no), 0) + 1 into v_item from public.committee_items i where i.meeting_id = v_meeting;
  insert into public.committee_items (application_id, meeting_id, item_no) values (p_app, v_meeting, v_item);
  insert into public.application_history (application_id, step, note, by_name)
  values (p_app, 'agenda', v_meeting || ' · item ' || v_item, 'System');
  return v_meeting;
end $$;

create or replace function private.cmt_decide_one(p_app uuid, p_meeting text, p_decision text, p_note text)
  returns table (application_id uuid, decision text, member_no text, voucher_no text, amount int, due_at timestamptz,
                 next_meeting text, email_id bigint, to_email text, lang text, token text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  m public.meetings;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_no text;
  v_fee jsonb;
  v_days int := coalesce((select (s.value ->> 'dueDays')::int from private.settings s where s.key = 'voucher'), 7);
  v_voucher text;
  v_due timestamptz;
  v_next text;
begin
  if p_decision not in ('Approved', 'Deferred', 'Rejected') then
    raise exception 'unknown decision' using errcode = 'P0001', hint = 'decision';
  end if;
  if p_decision <> 'Approved' and (v_note is null or length(v_note) < 3) then
    raise exception 'the committee''s reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into a from public.applications x where x.id = p_app for update;
  if a.stage is distinct from 'committee' then
    raise exception 'only an application with the committee can be decided' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  -- demo applications (0350) are never decided: no membership number, no voucher
  if private.company_is_demo(a.company_id) then
    raise exception 'demo applications are not decided by the committee' using errcode = 'P0001', hint = 'demo';
  end if;
  select * into m from public.meetings x where x.id = p_meeting;
  if m.id is null or m.committee <> 'Membership Committee' then
    raise exception 'meeting not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if m.held_on is null or m.held_on > (now() at time zone 'Asia/Karachi')::date then
    raise exception 'decisions are recorded on or after the meeting date' using errcode = 'P0001', hint = 'not_held';
  end if;
  if not exists (select 1 from public.committee_items i
                 where i.application_id = p_app and i.meeting_id = p_meeting and i.decision is null) then
    raise exception 'this item is not open on that meeting''s agenda' using errcode = 'P0001', hint = 'not_on_agenda';
  end if;

  perform private.set_reason('committee ' || lower(p_decision) || coalesce(': ' || v_note, ''));
  update public.committee_items i
     set decision = p_decision, note = left(v_note, 2000), decided_at = now(), decided_by = auth.uid()
   where i.application_id = p_app and i.meeting_id = p_meeting and i.decision is null;

  if p_decision = 'Approved' then
    v_no := private.alloc_member_no(a.class);
    v_fee := private.app_fee(p_app);
    v_due := now() + make_interval(days => v_days);
    insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at)
    values (a.company_id, 'membership', p_app, v_fee -> 'lines', (v_fee ->> 'total')::int, v_due)
    returning payment_vouchers.voucher_no into v_voucher;
    update public.applications set stage = 'payment', member_no = v_no, decided_at = now() where id = p_app;
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (p_app, 'approved', p_meeting || ' · ' || v_no || ' · ' || v_voucher || ' (Rs. ' || (v_fee ->> 'total') || ')',
            private.staff_name(), auth.uid());
    perform private.app_notify_t(p_app, 'committee.approved',
      jsonb_build_object('no', v_no, 'voucher', v_voucher, 'amount', v_fee ->> 'total'),
      'Approved — membership No. ' || v_no,
      'The Membership Committee approved your application. Payment voucher ' || v_voucher || ' for Rs. '
        || (v_fee ->> 'total') || ' is in Payments.');
    return query select p_app, p_decision, v_no, v_voucher, (v_fee ->> 'total')::int, v_due, null::text, e.*
                 from private.app_email(p_app, 'membership_approved_voucher') e;
  elsif p_decision = 'Rejected' then
    update public.applications set stage = 'rejected', reject_note = left(v_note, 1000), decided_at = now() where id = p_app;
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (p_app, 'committee rejected', p_meeting || ' · ' || v_note, private.staff_name(), auth.uid());
    perform private.app_notify_t(p_app, 'committee.rejected', jsonb_build_object('reason', left(v_note, 1000)),
      'Application not approved', left(v_note, 1000));
    return query select p_app, p_decision, null::text, null::text, null::int, null::timestamptz, null::text, e.*
                 from private.app_email(p_app, 'membership_rejected') e;
  else
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (p_app, 'deferred', p_meeting || ' · ' || v_note, private.staff_name(), auth.uid());
    v_next := private.cmt_place(p_app);
    perform private.app_notify_t(p_app, 'committee.deferred', jsonb_build_object('reason', left(v_note, 1000)),
      'Deferred to the next meeting', left(v_note, 1000));
    -- no email for a deferral (docs/07 lists none); the portal message is shown in the reader's language
    return query select p_app, p_decision, null::text, null::text, null::int, null::timestamptz, v_next,
                        null::bigint, null::text, null::text, a.token, null::text;
  end if;
end $$;

-- ───────── demo accounts ─────────

-- a demo member (Permanent, valid to 31 March, DEMO number) or a demo applicant (company only), with an Owner invitation
create function api.demo_add(p_kind text, p_company text, p_class public.member_class, p_rep text, p_owner_email text,
                             p_owner_name text, p_days int default 7)
  returns table (company_id uuid, member_no text, invitation_id uuid, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_company uuid;
  v_no text;
  v_email extensions.citext := private.normal_email(p_owner_email);
  v_token text := private.invite_token();
  v_inv uuid;
begin
  if auth.uid() is null or private.staff_level('reg') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_kind not in ('member', 'applicant') then
    raise exception 'unknown kind' using errcode = 'P0001', hint = 'kind';
  end if;
  if coalesce(btrim(p_company), '') = '' or coalesce(btrim(p_rep), '') = '' or v_email is null then
    raise exception 'company, representative and email are required' using errcode = 'P0001', hint = 'required';
  end if;
  if (select count(*) from public.companies c where c.demo) >= 10 then
    raise exception 'at most 10 demo accounts' using errcode = 'P0001', hint = 'too_many';
  end if;
  perform private.set_reason('demo account added (' || p_kind || ')');
  insert into public.companies (name, biz_type, demo, demo_expires_at)
  values ('DEMO — ' || left(btrim(p_company), 180), 'prop', true, now() + make_interval(days => greatest(1, least(coalesce(p_days, 7), 30))))
  returning id into v_company;
  if p_kind = 'member' then
    v_no := 'DEMO-' || (case when p_class = 'Corporate' then 'C' else 'A' end) || '-' ||
            lpad((select count(*) + 1 from public.members x join public.companies c on c.id = x.company_id
                  where c.demo and x.class = p_class)::text, 2, '0');
    insert into public.members (member_no, company_id, class, status, rep_name, since, valid_to, public_listing)
    values (v_no, v_company, p_class, 'Permanent', btrim(p_rep), (now() at time zone 'Asia/Karachi')::date,
            private.membership_year_end(), false);
  end if;
  insert into public.invitations (kind, email, full_name, company_id, company_role, token_hash, invited_by)
  values ('company_user', v_email, nullif(btrim(p_owner_name), ''), v_company, 'Owner', private.invite_hash(v_token), auth.uid())
  returning id into v_inv;
  return query select v_company, v_no, v_inv, v_token;
end $$;

-- removes every demo row; returns the demo sign-in accounts (only those linked to nothing but demo companies, never
-- staff) and the demo companies, so the app can delete the accounts and the stored files
create function api.demo_clear()
  returns table (kind text, id uuid)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_companies uuid[] := array(select c.id from public.companies c where c.demo);
  v_users uuid[];
begin
  if auth.uid() is null or private.staff_level('reg') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_users := array(
    select distinct cu.user_id from public.company_users cu
    where cu.company_id = any (v_companies)
      and not exists (select 1 from public.company_users o where o.user_id = cu.user_id and not (o.company_id = any (v_companies)))
      and not exists (select 1 from public.staff s where s.user_id = cu.user_id));
  perform private.set_reason('demo data removed');
  delete from public.endorsements e
   where e.endorser_member_id in (select m.id from public.members m where m.company_id = any (v_companies))
      or e.application_id in (select a.id from public.applications a where a.company_id = any (v_companies));
  delete from public.applications a where a.company_id = any (v_companies);
  delete from public.ai_extractions x where x.company_id = any (v_companies);
  delete from public.payment_receipts x where x.company_id = any (v_companies);
  delete from public.payment_vouchers x where x.company_id = any (v_companies);
  delete from public.print_items x where x.member_id in (select m.id from public.members m where m.company_id = any (v_companies));
  delete from public.documents x where x.company_id = any (v_companies);
  delete from public.members m where m.company_id = any (v_companies);
  delete from public.companies c where c.id = any (v_companies);
  return query select 'company'::text, u from unnest(v_companies) u
               union all select 'user'::text, u from unnest(v_users) u;
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.demo_add(text,text,public.member_class,text,text,text,int)', 'api.demo_clear()'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
