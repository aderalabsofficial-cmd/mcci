-- 0330 · Membership Committee: meetings, agenda, decisions, membership numbers, payment voucher (docs/03 §1, docs/05 M5,
-- docs/catalogue/actions.md cmt.* / mt.*). Release 4.
--
-- committee ──approve──▶ payment (membership number allocated, voucher created, applicant told)
-- committee ──defer────▶ committee (placed on the next Membership Committee meeting)
-- committee ──reject───▶ rejected (reason required)
--
-- Who: decisions cmt ≥ 3 (Committee Secretary, Secretary General — docs/06); meetings and minutes cmt ≥ 2. Every check
-- runs here, inside PostgreSQL, under the caller's own session (staff levels need a 2-step session since 0310).
-- MCCI decisions this release does not take (docs/14, docs/17 §10): bank account for vouchers (item 4; placeholder
-- "to be confirmed" until settings.bank.confirmed), gapless numbers (D-M2; sequences), real starting numbers (D-M20).

-- ───────── 1. columns, constraints, settings ─────────

-- the membership number allocated by the committee; the members row is created when temporary membership is issued
-- (Release 5) and takes this number
alter table public.applications add column member_no text unique
  check (member_no is null or member_no ~ '^MCCI-[CA]-\d{3,6}$');

alter table public.meetings
  add column name text,
  add column minutes text,
  add column created_by uuid references public.profiles on delete set null,
  add constraint meetings_status check (status in ('Pending', 'Approved')),
  add constraint meetings_committee check (committee in ('Membership Committee', 'Executive Committee', 'General Body'));

-- one open agenda item per application (a deferred file is on one next meeting at a time) and one final decision
create unique index committee_items_one_open on public.committee_items (application_id) where decision is null;
create unique index committee_items_one_final on public.committee_items (application_id) where decision in ('Approved', 'Rejected');
create index committee_items_meeting on public.committee_items (meeting_id, item_no);

-- MC-2026-01, EC-2026-01, GB-2026-01 (the prototype's meeting ids); never reset (decision 6)
create sequence public.meeting_seq start 1;
revoke all on sequence public.meeting_seq from public, anon, authenticated, service_role;

-- portal messages in the reader's language: the app renders `template` with `vars` from messages/*.json; title/body stay
-- as the English fallback (older rows have no template)
alter table public.notifications
  add column template text check (template is null or template ~ '^[a-z][a-zA-Z0-9_.]{0,60}$'),
  add column vars jsonb not null default '{}';

-- bank details stay "to be confirmed" on vouchers until MCCI provides them (docs/14 item 4) — TODO(MCCI)
update private.settings set value = value || '{"confirmed": false}'::jsonb
where key = 'bank' and not (value ? 'confirmed');

-- ───────── 2. helpers (no client execute) ─────────

-- the next unused membership number of a class. Skips numbers already in the register (Members Register "Add member"
-- may use a typed number) or already allocated by the committee. Sequences: a rolled-back approval can leave a gap (D-M2).
create function private.alloc_member_no(p_class public.member_class) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v text;
begin
  loop
    v := private.next_member_no(p_class);
    exit when not exists (select 1 from public.members m where m.member_no = v)
          and not exists (select 1 from public.applications a where a.member_no = v);
  end loop;
  return v;
end $$;
revoke all on function private.alloc_member_no(public.member_class) from public, anon, authenticated, service_role;

-- the membership fee of an application from settings.fees (docs/02 "Fees"; Women rates when the applicant is a woman
-- entrepreneur, plus Rs. 1,000 per extra partner card). Lines carry a key so the voucher can be shown in Urdu too.
create function private.app_fee(p_app uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  a public.applications;
  f jsonb := (select s.value from private.settings s where s.key = 'fees');
  s jsonb;
  n int;
  v_lines jsonb;
begin
  select * into a from public.applications x where x.id = p_app;
  if a.id is null or a.class is null then
    raise exception 'the application has no class' using errcode = 'P0001', hint = 'no_class';
  end if;
  s := f -> (case when a.women then 'Women' else a.class::text end);
  if s is null or (s ->> 'admission') is null or (s ->> 'subscription') is null or (s ->> 'card') is null then
    raise exception 'fees are not configured' using errcode = 'P0001', hint = 'fees';
  end if;
  select count(*) into n from public.application_partners p where p.application_id = p_app and p.extra_card;
  v_lines := jsonb_build_array(
    jsonb_build_object('key', 'admission', 'label', 'Admission fee', 'amount', (s ->> 'admission')::int),
    jsonb_build_object('key', 'subscription', 'label', 'Annual subscription', 'amount', (s ->> 'subscription')::int),
    jsonb_build_object('key', 'card', 'label', 'Membership card', 'amount', (s ->> 'card')::int));
  if n > 0 then
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('key', 'extraCards', 'label', 'Extra cards × ' || n,
                                                               'qty', n, 'amount', n * coalesce((f ->> 'extraCard')::int, 0)));
  end if;
  return jsonb_build_object('lines', v_lines,
                            'total', (select sum((l ->> 'amount')::int) from jsonb_array_elements(v_lines) l));
end $$;
revoke all on function private.app_fee(uuid) from public, anon, authenticated, service_role;

-- portal message with a template key (rendered bilingually) and the English fallback
create function private.app_notify_t(p_app uuid, p_template text, p_vars jsonb, p_title text, p_body text) returns void
  language sql volatile security definer set search_path = ''
  as $$
    insert into public.notifications (user_id, title, body, link, channel, template, vars)
    select a.created_by, p_title, p_body, '/portal/mtrack', 'Email + Portal', p_template, coalesce(p_vars, '{}')
    from public.applications a where a.id = p_app
  $$;
revoke all on function private.app_notify_t(uuid, text, jsonb, text, text) from public, anon, authenticated, service_role;

-- puts an application in "committee" without an open agenda item on the earliest open Membership Committee meeting
-- (status Pending, date today or later, not one it was already on). Returns the meeting, or null when none is scheduled:
-- it is then placed when the Committee Secretary schedules the next meeting.
create function private.cmt_place(p_app uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_meeting text;
  v_item int;
begin
  -- one placement at a time per file: two meetings scheduled at once must not both take it (the second waits here,
  -- then sees the open item the first one wrote)
  perform 1 from public.applications a where a.id = p_app for update;
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
revoke all on function private.cmt_place(uuid) from public, anon, authenticated, service_role;

-- every way into "committee" (officer verify with both signatures, the second signature) places the file on the agenda
create function private.app_to_committee() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  perform private.cmt_place(new.id);
  return null;
end $$;
revoke all on function private.app_to_committee() from public, anon, authenticated, service_role;
create trigger applications_to_committee after update of stage on public.applications
  for each row when (new.stage = 'committee' and old.stage is distinct from 'committee')
  execute function private.app_to_committee();

-- ───────── 3. meetings (mt.create, mt.minutes) ─────────

create function api.cmt_meeting_create(p_committee text, p_name text, p_held_on date)
  returns table (meeting_id text, placed int)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_id text;
  v_n int := 0;
  v_app uuid;
begin
  if auth.uid() is null or private.staff_level('cmt') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_committee not in ('Membership Committee', 'Executive Committee', 'General Body') then
    raise exception 'unknown committee' using errcode = 'P0001', hint = 'committee';
  end if;
  if coalesce(btrim(p_name), '') = '' or p_held_on is null then
    raise exception 'name and date are required' using errcode = 'P0001', hint = 'required';
  end if;
  v_id := (case p_committee when 'Membership Committee' then 'MC' when 'Executive Committee' then 'EC' else 'GB' end)
          || '-' || private.pkt_year() || '-' || lpad(nextval('public.meeting_seq')::text, 2, '0');
  perform private.set_reason('meeting scheduled');
  insert into public.meetings (id, committee, name, held_on, status, created_by)
  values (v_id, p_committee, left(btrim(p_name), 120), p_held_on, 'Pending', auth.uid());
  -- files already waiting for the committee go on the new meeting, oldest first
  if p_committee = 'Membership Committee' then
    for v_app in
      select a.id from public.applications a
      where a.stage = 'committee'
        and not exists (select 1 from public.committee_items i where i.application_id = a.id and i.decision is null)
      order by a.updated_at, a.submitted_at
    loop
      if private.cmt_place(v_app) is not null then
        v_n := v_n + 1;
      end if;
    end loop;
  end if;
  return query select v_id, v_n;
end $$;

create function api.cmt_minutes(p_meeting text, p_minutes text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('cmt') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_minutes), '') = '' then
    raise exception 'minutes are required' using errcode = 'P0001', hint = 'required';
  end if;
  perform private.set_reason('minutes recorded');
  update public.meetings set minutes = left(btrim(p_minutes), 20000), status = 'Approved' where id = p_meeting;
  if not found then
    raise exception 'meeting not found' using errcode = 'P0001', hint = 'not_found';
  end if;
end $$;

-- ───────── 4. decisions (cmt.decide, cmt.approveAll) ─────────

-- one decision on one agenda item; the core of cmt.decide and cmt.approveAll. Caller has checked cmt ≥ 3.
create function private.cmt_decide_one(p_app uuid, p_meeting text, p_decision text, p_note text)
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
revoke all on function private.cmt_decide_one(uuid, text, text, text) from public, anon, authenticated, service_role;

create function api.cmt_decide(p_app uuid, p_meeting text, p_decision text, p_note text default null)
  returns table (application_id uuid, decision text, member_no text, voucher_no text, amount int, due_at timestamptz,
                 next_meeting text, email_id bigint, to_email text, lang text, token text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('cmt') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query select * from private.cmt_decide_one(p_app, p_meeting, p_decision, p_note);
end $$;

-- every open item of a held meeting is approved (the prototype skips deferred files: they are no longer open there)
create function api.cmt_approve_all(p_meeting text)
  returns table (application_id uuid, decision text, member_no text, voucher_no text, amount int, due_at timestamptz,
                 next_meeting text, email_id bigint, to_email text, lang text, token text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_app uuid;
begin
  if auth.uid() is null or private.staff_level('cmt') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  for v_app in
    select i.application_id from public.committee_items i
    where i.meeting_id = p_meeting and i.decision is null
    order by i.item_no
  loop
    return query select * from private.cmt_decide_one(v_app, p_meeting, 'Approved', null);
  end loop;
end $$;

-- the voucher of the applicant's approved application, with the bank details from settings (not public: only the
-- company's own users with payments access, and staff with pay ≥ 1 or cmt ≥ 1, get them)
create function api.voucher_view(p_voucher text)
  returns table (voucher_no text, status text, amount int, lines jsonb, due_at timestamptz, created_at timestamptz,
                 ref_type text, token text, member_no text, company text, bank jsonb)
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
begin
  select * into v from public.payment_vouchers x where x.voucher_no = p_voucher;
  if v.id is null or auth.uid() is null
     or not (private.company_level(v.company_id, 'pay') >= 1 or private.staff_level('pay') >= 1 or private.staff_level('cmt') >= 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select v.voucher_no, v.status::text, v.amount, v.lines, v.due_at, v.created_at, v.ref_type,
           a.token, a.member_no, c.name,
           (select s.value from private.settings s where s.key = 'bank')
    from public.companies c
    left join public.applications a on v.ref_type = 'membership' and a.id = v.ref_id
    where c.id = v.company_id;
end $$;

-- ───────── 5. Members Register numbers stay clear of committee allocations ─────────

create or replace function api.member_add(p_company text, p_biz public.biz_type, p_class public.member_class, p_member_no text,
                               p_rep text, p_since date, p_valid_to date, p_sector text, p_women boolean,
                               p_owner_email text, p_owner_name text)
  returns table (member_id uuid, member_no text, company_id uuid, invitation_id uuid, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_company uuid;
  v_member uuid;
  v_no text := nullif(upper(btrim(p_member_no)), '');
  v_email extensions.citext := private.normal_email(p_owner_email);
  v_token text := private.invite_token();
  v_inv uuid;
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_company), '') = '' or coalesce(btrim(p_rep), '') = '' then
    raise exception 'company and representative are required' using errcode = 'P0001', hint = 'required';
  end if;
  if v_no is not null and v_no !~ '^MCCI-[CA]-\d{3,6}$' then
    raise exception 'membership number like MCCI-C-1134' using errcode = 'P0001', hint = 'member_no';
  end if;
  if v_no is not null and (exists (select 1 from public.members x where x.member_no = v_no)
                           or exists (select 1 from public.applications x where x.member_no = v_no)) then
    raise exception 'membership number already used' using errcode = 'P0001', hint = 'member_no_taken';
  end if;
  perform private.set_reason('existing member added to the register');
  insert into public.companies (name, biz_type, nature_sector) values (btrim(p_company), p_biz, nullif(btrim(p_sector), ''))
  returning id into v_company;
  insert into public.members (member_no, company_id, class, women, status, rep_name, since, valid_to, imported)
  values (coalesce(v_no, private.alloc_member_no(p_class)), v_company, p_class, coalesce(p_women, false), 'Permanent', btrim(p_rep),
          coalesce(p_since, (now() at time zone 'Asia/Karachi')::date), p_valid_to, true)
  returning id, members.member_no into v_member, v_no;
  insert into public.invitations (kind, email, full_name, company_id, company_role, token_hash, invited_by)
  values ('company_user', v_email, nullif(btrim(p_owner_name), ''), v_company, 'Owner', private.invite_hash(v_token), auth.uid())
  returning id into v_inv;
  return query select v_member, v_no, v_company, v_inv, v_token;
end $$;

-- ───────── 6. grants ─────────

do $$
declare f text;
begin
  foreach f in array array[
    'api.cmt_meeting_create(text,text,date)', 'api.cmt_minutes(text,text)',
    'api.cmt_decide(uuid,text,text,text)', 'api.cmt_approve_all(text)', 'api.voucher_view(text)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
