-- 0430 · Hierarchy and approval (owner's list of 28 Oct 2026, docs/21 §1 and §3). Release R2.
--
-- 1. Designations: Membership Committee Convener, Membership Committee Member, IT Convener.
-- 2. The Secretary General assigns the Membership Committee (Convener + members); the assignment counts only once the
--    President approves it. Only the Convener of the approved committee decides applications.
-- 3. The Membership Officer types the membership number (C-201 / A-786) and forwards the file to the committee.
--    Nothing moves to the committee by itself any more: documents verified + both consents → "ready to forward".
-- 4. The committee desk lists every forwarded file at once (no meeting or agenda first). The Convener approves,
--    declines (reason required) or returns the file to the officer. Date of enrollment = the day of approval.
--    Demo files (0350) reach the desk but are never approved (no voucher, no member record); a number typed on a
--    demo file never blocks a real applicant.
--    Meetings and minutes stay as an optional record; files are no longer placed on agendas automatically.
-- 5. Proposer and seconder only consent in their portal (Approve / Decline): no emailed code, no signature.
-- Every check runs here under the caller's own session; staff levels need the 2-step login (0310).

-- ───────── 1. designations ─────────
insert into public.designations (name, seniority) values
  ('Membership Committee Convener', 4),
  ('Membership Committee Member', 2),
  ('IT Convener', 4)
on conflict (name) do nothing;

insert into public.role_permissions (designation, module, level) values
  ('Membership Committee Convener', 'dash', 1),
  ('Membership Committee Convener', 'mem', 1),
  ('Membership Committee Convener', 'cmt', 3),
  ('Membership Committee Convener', 'reg', 1),
  ('Membership Committee Member', 'dash', 1),
  ('Membership Committee Member', 'mem', 1),
  ('Membership Committee Member', 'cmt', 1),
  ('IT Convener', 'dash', 1),
  ('IT Convener', 'mem', 1),
  ('IT Convener', 'reg', 1),
  ('IT Convener', 'docs', 1),
  ('IT Convener', 'rep', 1),
  ('IT Convener', 'plat', 3)
on conflict (designation, module) do nothing;

-- the caller's designation (active staff only); never trusted from the client
create function private.my_designation() returns text
  language sql stable security definer set search_path = ''
  as $$ select s.designation from public.staff s where s.user_id = auth.uid() and s.active $$;
revoke all on function private.my_designation() from public, anon, authenticated, service_role;

-- ───────── 2. committee assignment ─────────
create table public.committee_assignments (
  id uuid primary key default gen_random_uuid(),
  committee text not null default 'Membership Committee' check (committee = 'Membership Committee'),
  convener uuid not null references public.staff (user_id),
  members uuid[] not null default '{}' check (cardinality(members) <= 20),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Withdrawn', 'Superseded')),
  note text check (note is null or length(note) <= 1000),
  proposed_by uuid not null references public.profiles,
  proposed_at timestamptz not null default now(),
  decided_by uuid references public.profiles,
  decided_at timestamptz,
  decision_note text check (decision_note is null or length(decision_note) <= 1000)
);
create unique index committee_assignments_one_approved on public.committee_assignments (committee) where status = 'Approved';
create unique index committee_assignments_one_pending on public.committee_assignments (committee) where status = 'Pending';
alter table public.committee_assignments enable row level security;
grant select on public.committee_assignments to authenticated;
create policy committee_assignments_select on public.committee_assignments for select to authenticated
  using ((select private.is_staff()));
create trigger audit_row after insert or update or delete on public.committee_assignments
  for each row execute function private.audit_row();

-- the caller is the Convener / a member of the approved Membership Committee (and still active staff)
create function private.is_convener() returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.committee_assignments c join public.staff s on s.user_id = c.convener and s.active
                   where c.status = 'Approved' and c.convener = auth.uid())
  $$;
create function private.is_committee_member() returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select private.is_convener()
        or exists (select 1 from public.committee_assignments c
                   where c.status = 'Approved' and auth.uid() = any (c.members)
                     and exists (select 1 from public.staff s where s.user_id = auth.uid() and s.active))
  $$;
revoke all on function private.is_convener(), private.is_committee_member() from public, anon, authenticated, service_role;

-- a staff member's level on a module (as private.staff_level, for another person; the 2-step rule applies when they act)
create function private.level_of(p_user uuid, p_module text) returns smallint
  language sql stable security definer set search_path = ''
  as $$
    select coalesce((
      select coalesce(o.level, rp.level, 0)
      from public.staff s
      left join public.staff_permission_overrides o on o.user_id = s.user_id and o.module = p_module
      left join public.role_permissions rp on rp.designation = s.designation and rp.module = p_module
      where s.user_id = p_user and s.active
    ), 0)::smallint
  $$;
revoke all on function private.level_of(uuid, text) from public, anon, authenticated, service_role;

-- cmt.assign: the Secretary General proposes the committee; it waits for the President
create function api.cmt_assign_propose(p_convener uuid, p_members uuid[], p_note text default null) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_members uuid[] := array(select distinct x from unnest(coalesce(p_members, '{}')) x where x is distinct from p_convener);
  v_id uuid;
begin
  if auth.uid() is null or private.staff_level('staff') < 3 or private.my_designation() is distinct from 'Secretary General' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  -- everyone on the committee needs Membership Committee access (module cmt), or they could not see the desk
  if private.level_of(p_convener, 'cmt') < 1 then
    raise exception 'the Convener must be an active staff account with committee access' using errcode = 'P0001', hint = 'convener';
  end if;
  if exists (select 1 from unnest(v_members) x where private.level_of(x, 'cmt') < 1) then
    raise exception 'every member must be an active staff account with committee access' using errcode = 'P0001', hint = 'members';
  end if;
  perform private.set_reason('Membership Committee proposed');
  update public.committee_assignments set status = 'Withdrawn', decided_at = now(), decided_by = auth.uid()
   where committee = 'Membership Committee' and status = 'Pending';
  insert into public.committee_assignments (convener, members, note, proposed_by)
  values (p_convener, v_members, nullif(left(btrim(coalesce(p_note, '')), 1000), ''), auth.uid())
  returning id into v_id;
  return v_id;
end $$;

-- cmt.assign.decide: the President approves (it replaces the current committee) or rejects (reason required)
create function api.cmt_assign_decide(p_id uuid, p_approve boolean, p_note text default null) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 1000), '');
begin
  if auth.uid() is null or private.staff_level('dash') < 1 or private.my_designation() is distinct from 'President (Signatory)' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.committee_assignments c where c.id = p_id and c.status = 'Pending') then
    raise exception 'nothing waiting for approval' using errcode = 'P0001', hint = 'not_found';
  end if;
  if not p_approve and v_note is null then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason(case when p_approve then 'Membership Committee approved by the President'
                                  else 'Membership Committee not approved: ' || v_note end);
  if p_approve then
    update public.committee_assignments set status = 'Superseded'
     where committee = 'Membership Committee' and status = 'Approved';
  end if;
  update public.committee_assignments
     set status = case when p_approve then 'Approved' else 'Rejected' end,
         decided_by = auth.uid(), decided_at = now(), decision_note = v_note
   where id = p_id;
end $$;

-- the committee in force and the one waiting for the President, with names (committee desk; staff with cmt or dash)
create function api.cmt_committee()
  returns table (id uuid, status text, convener uuid, convener_name text, members jsonb, note text,
                 proposed_by_name text, proposed_at timestamptz, decided_by_name text, decided_at timestamptz,
                 decision_note text, me_convener boolean, me_member boolean)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or (private.staff_level('cmt') < 1 and private.staff_level('dash') < 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select c.id, c.status, c.convener, pc.full_name,
           coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name, 'designation', s.designation)
                                      order by p.full_name)
                       from unnest(c.members) x join public.profiles p on p.id = x join public.staff s on s.user_id = x), '[]'),
           c.note, pp.full_name, c.proposed_at, pd.full_name, c.decided_at, c.decision_note,
           c.convener = auth.uid(), auth.uid() = any (c.members)
      from public.committee_assignments c
      join public.profiles pc on pc.id = c.convener
      join public.profiles pp on pp.id = c.proposed_by
      left join public.profiles pd on pd.id = c.decided_by
     where c.status in ('Approved', 'Pending')
     order by c.status;
end $$;

-- ───────── 3. membership number typed by the officer; forward to the committee ─────────
alter table public.applications drop constraint if exists applications_member_no_check;
alter table public.applications add constraint applications_member_no_check
  check (member_no is null or member_no ~ '^(MCCI-)?[CA]-\d{1,6}$');

-- "C-201" / "c 201" / "MCCI-C-201" → "C-201" (null when it is not a membership number)
create function private.typed_member_no(p text) returns text
  language sql immutable set search_path = ''
  as $$
    select case when m is not null then m[1] || '-' || ltrim(m[2], '0') end
    from (select regexp_match(upper(btrim(coalesce(p, ''))), '^(?:MCCI-?)?([CA])[- ]?(\d{1,6})$') m) x
  $$;
revoke all on function private.typed_member_no(text) from public, anon, authenticated, service_role;

-- both consents are in
create function private.endorsed(p_app uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select (select count(distinct e.role) from public.endorsements e where e.application_id = p_app and e.status = 'Approved') = 2 $$;
revoke all on function private.endorsed(uuid) from public, anon, authenticated, service_role;

-- adm.forward: documents verified (stage "proposer") and both consents in → the officer types the number and forwards.
-- A file already with the committee without a number (forwarded before this release) gets its number the same way.
create function api.app_forward(p_app uuid, p_member_no text) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  v_no text := private.typed_member_no(p_member_no);
begin
  if auth.uid() is null or private.staff_level('mem') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into a from public.applications x where x.id = p_app for update;
  if not (a.stage = 'proposer' or (a.stage = 'committee' and a.member_no is null)) then
    raise exception 'only a verified file waiting to be forwarded' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if not private.endorsed(p_app) then
    raise exception 'the proposer and the seconder have not both consented' using errcode = 'P0001', hint = 'endorsements';
  end if;
  if v_no is null then
    raise exception 'type the membership number, e.g. C-201 or A-786' using errcode = 'P0001', hint = 'member_no';
  end if;
  if left(v_no, 1) <> left(coalesce(a.class, private.class_of(a.form))::text, 1) then
    raise exception 'C is for Corporate, A for Associate' using errcode = 'P0001', hint = 'member_no_class';
  end if;
  -- a number held by a demo file (0350) never blocks a real one: the demo file gives it up
  if exists (select 1 from public.members m where private.typed_member_no(m.member_no) = v_no)
     or exists (select 1 from public.applications x where x.id <> p_app and private.typed_member_no(x.member_no) = v_no
                  and not private.company_is_demo(x.company_id)) then
    raise exception 'this membership number is already used' using errcode = 'P0001', hint = 'member_no_used';
  end if;
  perform private.set_reason('forwarded to the Membership Committee with No. ' || v_no);
  if exists (select 1 from public.applications x where x.id <> p_app and private.typed_member_no(x.member_no) = v_no) then
    if private.company_is_demo(a.company_id) then
      raise exception 'this membership number is held by another demo file' using errcode = 'P0001', hint = 'member_no_used';
    end if;
    update public.applications x set member_no = null
     where x.id <> p_app and private.typed_member_no(x.member_no) = v_no and private.company_is_demo(x.company_id);
  end if;
  update public.applications set member_no = v_no, stage = 'committee', class = coalesce(class, private.class_of(form))
   where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'forwarded', 'Membership No. ' || v_no || ' · to the Membership Committee', private.staff_name(), auth.uid());
  if a.stage = 'proposer' then
    perform private.app_notify(p_app, 'With the Membership Committee',
      'MCCI has forwarded your application (' || a.token || ') to the Membership Committee for approval.');
  end if;
  return v_no;
end $$;

-- documents verified: the file waits for both consents and then for the officer to forward it
create or replace function private.endorse_advance(p_app uuid) returns boolean
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if (select a.stage from public.applications a where a.id = p_app) in ('submitted', 'review', 'proposer')
     and private.endorsed(p_app) then
    insert into public.application_history (application_id, step, note)
    values (p_app, 'consents complete', 'proposer and seconder approved');
    perform private.app_notify(p_app, 'Proposer and seconder approved',
      'Both of your proposer and seconder have approved. MCCI will forward your application to the Membership Committee.');
    return true;
  end if;
  return false;
end $$;

-- adm.verify: as 0310, but the file always waits as "proposer" (consents, then the officer forwards with the number)
create or replace function api.app_verify(p_app uuid)
  returns table (email_id bigint, to_email text, lang text, token text, name text, stage text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  v_need text[];
  v_item text;
begin
  if auth.uid() is null or private.staff_level('mem') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into a from public.applications x where x.id = p_app for update;
  if a.stage is distinct from 'review' then
    raise exception 'only an application in review can be verified' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if cardinality(private.app_missing(p_app)) > 0 then
    raise exception 'the application is incomplete' using errcode = 'P0001', hint = 'incomplete';
  end if;
  if exists (select 1 from public.application_documents d where d.application_id = p_app and d.status <> 'ok') then
    raise exception 'accept every document first' using errcode = 'P0001', hint = 'documents';
  end if;
  select coalesce(array(select jsonb_array_elements_text(s.value -> 'checklist')), '{}') into v_need
  from private.settings s where s.key = 'membership';
  foreach v_item in array coalesce(v_need, '{}') loop
    if not coalesce((a.review -> 'checks' ->> v_item)::boolean, false) then
      raise exception 'complete the officer checklist first' using errcode = 'P0001', hint = 'checklist';
    end if;
  end loop;
  perform private.set_reason('documents verified');
  update public.applications set stage = 'proposer' where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'verified', case when private.endorsed(p_app) then 'next: forward to the committee'
                                  else 'next: proposer and seconder' end, private.staff_name(), auth.uid());
  perform private.app_notify(p_app, 'Documents verified',
    'MCCI has checked and accepted your documents (' || a.token || ').');
  return query select e.*, 'proposer'::text from private.app_email(p_app, 'membership_verified') e;
end $$;

-- files are no longer placed on a meeting agenda (the desk lists every forwarded file): neither when they reach the
-- committee nor when a meeting is scheduled (api.cmt_meeting_create calls private.cmt_place for waiting files)
drop trigger if exists applications_to_committee on public.applications;
create or replace function private.cmt_place(p_app uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  return null;
end $$;

-- ───────── 4. the Convener decides ─────────
create function api.cmt_decide_direct(p_app uuid, p_decision text, p_note text default null)
  returns table (application_id uuid, decision text, member_no text, voucher_no text, amount int, due_at timestamptz,
                 email_id bigint, to_email text, lang text, token text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_fee jsonb;
  v_days int := coalesce((select (s.value ->> 'dueDays')::int from private.settings s where s.key = 'voucher'), 7);
  v_voucher text;
  v_due timestamptz;
begin
  if auth.uid() is null or private.staff_level('cmt') < 1 or not private.is_convener() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_decision not in ('Approved', 'Rejected', 'Returned') then
    raise exception 'unknown decision' using errcode = 'P0001', hint = 'decision';
  end if;
  if p_decision <> 'Approved' and (v_note is null or length(v_note) < 3) then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into a from public.applications x where x.id = p_app for update;
  if a.stage is distinct from 'committee' then
    raise exception 'only a file with the committee can be decided' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  -- demo files (0350) are never approved: no voucher, no member record
  if p_decision = 'Approved' and private.company_is_demo(a.company_id) then
    raise exception 'a demo file is never approved' using errcode = 'P0001', hint = 'demo';
  end if;
  if p_decision = 'Approved' and a.member_no is null then
    raise exception 'the Membership Officer has not typed the membership number yet' using errcode = 'P0001', hint = 'no_number';
  end if;

  perform private.set_reason('Convener: ' || lower(p_decision) || coalesce(' — ' || v_note, ''));
  -- an agenda item from the meeting record, if any, takes the same decision
  update public.committee_items i set decision = case when p_decision = 'Returned' then 'Deferred' else p_decision end,
         note = left(v_note, 2000), decided_at = now(), decided_by = auth.uid()
   where i.application_id = p_app and i.decision is null;

  if p_decision = 'Approved' then
    v_fee := private.app_fee(p_app);
    v_due := now() + make_interval(days => v_days);
    insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at)
    values (a.company_id, 'membership', p_app, v_fee -> 'lines', (v_fee ->> 'total')::int, v_due)
    returning payment_vouchers.voucher_no into v_voucher;
    -- date of enrollment = today (decided_at), set here and never editable
    update public.applications set stage = 'payment', decided_at = now() where id = p_app;
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (p_app, 'approved', 'Convener · ' || a.member_no || ' · ' || v_voucher || ' (Rs. ' || (v_fee ->> 'total') || ')',
            private.staff_name(), auth.uid());
    perform private.app_notify_t(p_app, 'committee.approved',
      jsonb_build_object('no', a.member_no, 'voucher', v_voucher, 'amount', v_fee ->> 'total'),
      'Approved — membership No. ' || a.member_no,
      'The Membership Committee approved your application. Payment voucher ' || v_voucher || ' for Rs. '
        || (v_fee ->> 'total') || ' is in Payments.');
    return query select p_app, p_decision, a.member_no, v_voucher, (v_fee ->> 'total')::int, v_due, e.*
                 from private.app_email(p_app, 'membership_approved_voucher') e;
  elsif p_decision = 'Rejected' then
    -- the typed number is free again
    update public.applications set stage = 'rejected', reject_note = left(v_note, 1000), decided_at = now(), member_no = null
     where id = p_app;
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (p_app, 'committee rejected', 'Convener · ' || v_note || coalesce(' · No. ' || a.member_no || ' released', ''),
            private.staff_name(), auth.uid());
    perform private.app_notify_t(p_app, 'committee.rejected', jsonb_build_object('reason', left(v_note, 1000)),
      'Application not approved', left(v_note, 1000));
    return query select p_app, p_decision, null::text, null::text, null::int, null::timestamptz, e.*
                 from private.app_email(p_app, 'membership_rejected') e;
  else
    -- back to the Membership Officer (not to the applicant): the number stays, the officer forwards again
    update public.applications set stage = 'proposer' where id = p_app;
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (p_app, 'returned to officer', 'Convener · ' || v_note, private.staff_name(), auth.uid());
    return query select p_app, p_decision, a.member_no, null::text, null::int, null::timestamptz,
                        null::bigint, null::text, null::text, a.token, null::text;
  end if;
end $$;

-- a committee member's note for the Convener (on the file's history)
create function api.cmt_note(p_app uuid, p_note text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('cmt') < 1 or not private.is_committee_member() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'write the note' using errcode = 'P0001', hint = 'required';
  end if;
  if (select a.stage from public.applications a where a.id = p_app) is distinct from 'committee' then
    raise exception 'only a file with the committee' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'committee note', left(btrim(p_note), 1000), private.staff_name(), auth.uid());
end $$;

-- committee notes and "returned to officer" are internal: the applicant's history never shows them
drop policy app_history_select on public.application_history;
create policy app_history_select on public.application_history for select to authenticated
  using ((application_id in (select private.my_app_ids()) and step not in ('committee note', 'returned to officer'))
         or (select private.staff_level('mem')) >= 1);

-- the meeting path no longer decides (only the Convener decides, on the desk)
revoke execute on function api.cmt_decide(uuid, text, text, text) from authenticated;
revoke execute on function api.cmt_approve_all(text) from authenticated;

-- ───────── 5. proposer / seconder: consent only ─────────
create function api.end_approve(p_endorsement uuid, p_ip text default null, p_user_agent text default null) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  e public.endorsements;
  v_ref text;
  v_ip inet;
begin
  select * into e from public.endorsements x where x.id = p_endorsement for update;
  if e.id is null or auth.uid() is null or e.endorser_member_id not in (select private.my_endorser_member_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if e.status <> 'Pending' then
    raise exception 'this request is no longer open' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if e.expires_at < now() then
    raise exception 'this request has expired' using errcode = 'P0001', hint = 'expired';
  end if;
  begin
    v_ip := nullif(btrim(p_ip), '')::inet;
  exception when others then
    v_ip := null;
  end;
  v_ref := upper(left(encode(extensions.digest(e.id::text || now()::text, 'sha256'), 'hex'), 12));
  perform private.set_reason(e.role::text || ' approved');
  update public.endorsements
     set status = 'Approved', decided_at = now(), decided_by = auth.uid(),
         declaration_text = 'Approved in the MCCI portal', ip = v_ip, user_agent = left(p_user_agent, 300), ref = v_ref
   where id = p_endorsement;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (e.application_id, e.role::text || ' approved',
          (select m.rep_name || ' (' || m.member_no || ') · ref ' || v_ref from public.members m where m.id = e.endorser_member_id),
          (select p.full_name from public.profiles p where p.id = auth.uid()), auth.uid());
  perform private.app_notify(e.application_id, 'Your ' || e.role::text || ' approved',
          (select m.rep_name from public.members m where m.id = e.endorser_member_id) || ' approved your application as ' || e.role::text || '.');
  perform private.endorse_advance(e.application_id);
  return v_ref;
end $$;
-- the code-and-signature path is retired
revoke execute on function api.end_sign(uuid, text, text, text, text, text, text) from authenticated;
update private.settings set value = value || '{"needCode": false}'::jsonb where key = 'endorse';

-- ───────── grants ─────────
do $$
declare f text;
begin
  foreach f in array array['api.cmt_assign_propose(uuid,uuid[],text)', 'api.cmt_assign_decide(uuid,boolean,text)',
                           'api.cmt_committee()',
                           'api.app_forward(uuid,text)', 'api.cmt_decide_direct(uuid,text,text)', 'api.cmt_note(uuid,text)',
                           'api.end_approve(uuid,text,text)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
