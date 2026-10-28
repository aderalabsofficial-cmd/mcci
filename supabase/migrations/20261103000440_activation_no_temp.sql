-- 0440 · Fee and activation without temporary membership (owner's list of 28 Oct 2026, docs/21 points 26–29). R3.
--
-- Temporary membership is abolished. When Accounts verify the membership fee (receipt or counter), the membership
-- becomes active at once: the member record is created as Permanent with the number the Membership Officer typed,
-- the date of enrollment is the day the Convener approved (applications.decided_at) and the membership runs to the
-- next 31 March (year 1 April – 31 March). No temporary certificate, no extensions; the certificate itself is printed
-- by the security press and its scan uploaded (R4).
-- private.temp_issue keeps its name and result shape (pay_verify / pay_counter call it); `code` is null and `expires_at`
-- carries the end of the membership year. The email on activation is 'member_activated' (pay_settle below).
-- Also here (docs/22 §3): blacklist / whitelist with an audited reason (whitelisting required before renewal),
-- staff-started renewal paid through Accounts, manual restoration by the Membership Officer, partner email and
-- address required at submission, and a declined file's number kept reserved unless MCCI allows re-use.

create function private.year_end_of(p_day date) returns date
  language sql immutable set search_path = ''
  as $$ select make_date(extract(year from p_day)::int + case when extract(month from p_day) >= 4 then 1 else 0 end, 3, 31) $$;
revoke all on function private.year_end_of(date) from public, anon, authenticated, service_role;

create or replace function private.temp_issue(p_app uuid)
  returns table (member_id uuid, member_no text, code text, expires_at timestamptz)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  f jsonb;
  v_member uuid;
  v_since date;
  v_until date;
begin
  select * into a from public.applications x where x.id = p_app for update;
  if a.stage is distinct from 'payment' or a.member_no is null then
    raise exception 'only an approved application waiting for payment' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if not exists (select 1 from public.payment_vouchers v where v.ref_type = 'membership' and v.ref_id = p_app and v.status = 'Paid') then
    raise exception 'the membership fee is not verified yet' using errcode = 'P0001', hint = 'not_paid';
  end if;
  f := a.form;
  -- date of enrollment = the day of approval (never edited); the year runs to the next 31 March
  v_since := coalesce((a.decided_at at time zone 'Asia/Karachi')::date, (now() at time zone 'Asia/Karachi')::date);
  v_until := private.year_end_of(v_since);

  -- the company record takes the particulars MCCI approved (directory, certificates, services use them)
  update public.companies c set
    name = coalesce(nullif(btrim(f ->> 'name'), ''), c.name),
    biz_type = coalesce((select (f ->> 'biz')::public.biz_type where f ->> 'biz' in ('prop','aop','pvt','mnc','public','llp')), c.biz_type),
    address = coalesce(nullif(btrim(f ->> 'address'), ''), c.address),
    ntn = coalesce(nullif(btrim(f ->> 'ntn'), ''), c.ntn),
    gst = coalesce(nullif(btrim(f ->> 'gst'), ''), c.gst),
    tel = coalesce(nullif(btrim(f ->> 'tel'), ''), c.tel),
    fax = coalesce(nullif(btrim(f ->> 'fax'), ''), c.fax),
    email = coalesce(private.email_or_null(f ->> 'email'), c.email),
    particulars = coalesce(nullif(btrim(f ->> 'particulars'), ''), c.particulars),
    nature_sector = coalesce(nullif(btrim(f -> 'nature' ->> 'sector'), ''), c.nature_sector)
  where c.id = a.company_id;

  insert into public.members (member_no, company_id, class, women, status, rep_name, since, valid_to,
                              blacklisted, blacklist_note, blacklisted_at)
  values (a.member_no, a.company_id, a.class, a.women, 'Permanent', coalesce(nullif(btrim(f ->> 'rep'), ''), '—'), v_since, v_until,
          a.blacklisted, a.blacklist_note, case when a.blacklisted then now() end)
  returning id into v_member;
  update public.applications set stage = 'permanent', member_id = v_member where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'member activated',
          a.member_no || ' · enrolled ' || to_char(v_since, 'DD Mon YYYY') || ' · valid to ' || to_char(v_until, 'DD Mon YYYY'),
          coalesce(private.staff_name(), 'System'), auth.uid());
  perform private.app_notify_t(p_app, 'member.activated',
    jsonb_build_object('no', a.member_no, 'since', to_char(v_since, 'DD Mon YYYY'), 'until', to_char(v_until, 'DD Mon YYYY')),
    'Welcome — you are an MCCI member', 'Your membership ' || a.member_no || ' is active until ' || to_char(v_until, 'DD Mon YYYY') || '.');
  return query select v_member, a.member_no, null::text, v_until::timestamptz;
end $$;

-- no new temporary memberships: the staff functions refuse (existing rows, if any, stay as a record)
revoke execute on function api.temp_issue(uuid) from authenticated;
revoke execute on function api.temp_extend(uuid, text) from authenticated;
-- module 'temp' stays: its screen becomes "Certificates" (scans of the security-printed certificates, R4)

-- ───────────────────────── member lifecycle (docs/22 §3) ─────────────────────────
-- Blacklisting: a blacklisted applicant may apply and become a member (never blocked at submission), but must be
-- whitelisted before the next renewal. "Blacklisted" is recorded by an officer with its source / reason; it is not
-- tied to the ATL or sales tax unless MCCI says so. Every flag and clearance is audited (0240 triggers) with a reason.
alter table public.applications
  add column blacklisted boolean not null default false,
  add column blacklist_note text check (blacklist_note is null or length(blacklist_note) <= 1000);
alter table public.members
  add column blacklisted boolean not null default false,
  add column blacklist_note text check (blacklist_note is null or length(blacklist_note) <= 1000),
  add column blacklisted_at timestamptz,
  add column whitelisted_at timestamptz,
  add column whitelist_note text check (whitelist_note is null or length(whitelist_note) <= 1000),
  add column restored_at timestamptz;

-- MCCI policy default (CLAUDE.md rule 9): a declined file's number is not re-used unless MCCI allows it
update private.settings set value = value || '{"releaseNumberOnDecline": false}'::jsonb
 where key = 'membership' and not (value ? 'releaseNumberOnDecline');

-- adm.blacklist on an application (officer, mem ≥ 2): carried to the member record on activation
create function api.app_blacklist(p_app uuid, p_on boolean, p_note text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('mem') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  if (select a.stage from public.applications a where a.id = p_app) not in ('submitted', 'review', 'returned', 'proposer', 'committee', 'payment') then
    raise exception 'not while this application is in this stage' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason(case when p_on then 'blacklisted: ' else 'blacklist flag removed: ' end || left(btrim(p_note), 500));
  update public.applications set blacklisted = p_on, blacklist_note = left(btrim(p_note), 1000) where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, case when p_on then 'blacklisted' else 'blacklist removed' end, left(btrim(p_note), 1000),
          private.staff_name(), auth.uid());
end $$;

-- reg.blacklist / reg.whitelist on a member (officer, reg ≥ 2): whitelisting needs the evidence in the note
create function api.member_blacklist(p_member uuid, p_on boolean, p_note text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  if not exists (select 1 from public.members m where m.id = p_member) then
    raise exception 'member not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  perform private.set_reason(case when p_on then 'blacklisted: ' else 'whitelisted: ' end || left(btrim(p_note), 500));
  if p_on then
    update public.members set blacklisted = true, blacklist_note = left(btrim(p_note), 1000), blacklisted_at = now(),
           whitelisted_at = null, whitelist_note = null
     where id = p_member;
  else
    update public.members set blacklisted = false, whitelisted_at = now(), whitelist_note = left(btrim(p_note), 1000)
     where id = p_member and blacklisted;
    if not found then
      raise exception 'this member is not blacklisted' using errcode = 'P0001', hint = 'not_blacklisted';
    end if;
  end if;
end $$;

-- the subscription of a member's class for one membership year (renewal: no admission, no card)
create function private.renewal_fee(p_member uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  m public.members;
  s jsonb;
begin
  select * into m from public.members x where x.id = p_member;
  s := (select v.value from private.settings v where v.key = 'fees') -> (case when m.women then 'Women' else m.class::text end);
  if s is null or (s ->> 'subscription') is null then
    raise exception 'fees are not configured' using errcode = 'P0001', hint = 'fees';
  end if;
  return jsonb_build_object('lines', jsonb_build_array(jsonb_build_object('key', 'subscription', 'label', 'Annual subscription',
                                                                          'amount', (s ->> 'subscription')::int)),
                            'total', (s ->> 'subscription')::int);
end $$;
revoke all on function private.renewal_fee(uuid) from public, anon, authenticated, service_role;

-- reg.renew (officer, reg ≥ 2): issues the renewal voucher; Accounts verify it; the year then runs to the next
-- 31 March. Refused while the member is blacklisted (whitelisting first), for demo members, suspended / revoked
-- members (restore first), a year already renewed, or an open renewal voucher.
create function api.member_renew_start(p_member uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.members;
  v_fee jsonb;
  v_no text;
  v_days int := coalesce((select (s.value ->> 'dueDays')::int from private.settings s where s.key = 'voucher'), 7);
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into m from public.members x where x.id = p_member for update;
  if m.id is null then
    raise exception 'member not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if private.company_is_demo(m.company_id) then
    raise exception 'demo members are never renewed' using errcode = 'P0001', hint = 'demo';
  end if;
  if m.blacklisted then
    raise exception 'blacklisted: record the whitelisting before renewal' using errcode = 'P0001', hint = 'not_whitelisted';
  end if;
  if m.status not in ('Permanent', 'Expired') then
    raise exception 'only an active or expired membership is renewed (restore it first)' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  if m.valid_to > private.year_end_of((now() at time zone 'Asia/Karachi')::date) then
    raise exception 'this membership year is already renewed' using errcode = 'P0001', hint = 'already_renewed';
  end if;
  if exists (select 1 from public.payment_vouchers v where v.ref_type = 'renewal' and v.ref_id = p_member
             and v.status in ('Unpaid', 'Receipt uploaded')) then
    raise exception 'a renewal voucher is already open' using errcode = 'P0001', hint = 'open_voucher';
  end if;
  v_fee := private.renewal_fee(p_member);
  perform private.set_reason('renewal voucher issued for ' || m.member_no);
  insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at)
  values (m.company_id, 'renewal', p_member, v_fee -> 'lines', (v_fee ->> 'total')::int, now() + make_interval(days => v_days))
  returning voucher_no into v_no;
  perform private.company_notify_t(m.company_id, 'pay', 'renewal.voucher',
    jsonb_build_object('no', m.member_no, 'voucher', v_no, 'amount', v_fee ->> 'total'),
    'Renewal voucher ' || v_no, 'Your membership renewal voucher ' || v_no || ' is in Payments.', null);
  return v_no;
end $$;

-- reg.restore (officer, reg ≥ 2): a lapsed / suspended / revoked member is restored by hand (gap years and fees are
-- settled offline, as the owner decided); reason required; valid to the current membership year's 31 March
create function api.member_restore(p_member uuid, p_reason text) returns date
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.members;
  v_until date := private.year_end_of((now() at time zone 'Asia/Karachi')::date);
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into m from public.members x where x.id = p_member for update;
  if m.id is null then
    raise exception 'member not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if private.company_is_demo(m.company_id) then
    raise exception 'demo members are not restored' using errcode = 'P0001', hint = 'demo';
  end if;
  if m.status = 'Permanent' and m.valid_to >= (now() at time zone 'Asia/Karachi')::date then
    raise exception 'this membership is active' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  perform private.set_reason('restored by the Membership Officer: ' || left(btrim(p_reason), 500));
  update public.members set status = 'Permanent', valid_to = v_until, restored_at = now(), suspended_reason = null
   where id = p_member;
  return v_until;
end $$;

-- a paid renewal voucher: the year runs to the next 31 March after the current one (never 12 months from today)
create function private.renewal_paid(p_voucher uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
  m public.members;
  v_until date;
begin
  select * into v from public.payment_vouchers x where x.id = p_voucher;
  select * into m from public.members x where x.id = v.ref_id for update;
  v_until := private.year_end_of(greatest(m.valid_to + 1, (now() at time zone 'Asia/Karachi')::date));
  update public.members set status = 'Permanent', valid_to = v_until where id = m.id;
  perform private.company_notify_t(m.company_id, 'mship', 'renewal.done',
    jsonb_build_object('no', m.member_no, 'until', to_char(v_until, 'DD Mon YYYY')),
    'Membership renewed', 'Your membership ' || m.member_no || ' is renewed until ' || to_char(v_until, 'DD Mon YYYY') || '.', null);
end $$;
revoke all on function private.renewal_paid(uuid) from public, anon, authenticated, service_role;

create or replace function private.voucher_paid(p_voucher uuid)
  returns table (temp_code text, member_no text, expires_at timestamptz)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
  r record;
begin
  select * into v from public.payment_vouchers x where x.id = p_voucher;
  if v.ref_type = 'membership' then
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (v.ref_id, 'payment verified', v.voucher_no || ' · Rs. ' || v.amount, private.staff_name(), auth.uid());
    perform private.app_notify_t(v.ref_id, 'payment.verified', jsonb_build_object('voucher', v.voucher_no, 'amount', v.amount::text),
      'Payment verified', 'MCCI Accounts verified your payment for voucher ' || v.voucher_no || '.');
    select * into r from private.temp_issue(v.ref_id);
    return query select r.code, r.member_no, r.expires_at;
    return;
  end if;
  if v.ref_type = 'renewal' then
    perform private.renewal_paid(p_voucher);
  end if;
  if v.ref_type = 'service' then
    perform private.svc_log(v.ref_id, 'fee paid', v.voucher_no || ' · Rs. ' || v.amount);
  end if;
  return query select null::text, null::text, null::timestamptz;
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.app_blacklist(uuid,boolean,text)', 'api.member_blacklist(uuid,boolean,text)',
                           'api.member_renew_start(uuid)', 'api.member_restore(uuid,text)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ───────────────────────── the Convener's decision: number re-use is MCCI's policy ─────────────────────────
create or replace function api.cmt_decide_direct(p_app uuid, p_decision text, p_note text default null)
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
  v_release boolean;
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
    -- the typed number stays reserved unless MCCI allows re-use (settings.membership.releaseNumberOnDecline)
    v_release := coalesce((select (s.value ->> 'releaseNumberOnDecline')::boolean from private.settings s where s.key = 'membership'), false);
    update public.applications x set stage = 'rejected', reject_note = left(v_note, 1000), decided_at = now(),
           member_no = case when v_release then null else x.member_no end
     where x.id = p_app;
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (p_app, 'committee rejected',
            'Convener · ' || v_note || coalesce(' · No. ' || a.member_no || case when v_release then ' released' else ' kept reserved' end, ''),
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

create or replace function private.app_missing(p_app uuid) returns text[]
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  a public.applications;
  f jsonb;
  biz text;
  k text;
  miss text[] := '{}';
  rules jsonb := coalesce((select s.value from private.settings s where s.key = 'membership'), '{}'::jsonb);
  sales_tax boolean;
  aop_reg boolean;
begin
  select * into a from public.applications x where x.id = p_app;
  if a.id is null then
    return array['not_found'];
  end if;
  f := a.form;
  biz := f->>'biz';
  if biz is null or biz not in ('prop', 'aop', 'pvt', 'mnc', 'public', 'llp') then
    miss := miss || 'biz'::text;
    biz := 'prop';
  end if;
  if jsonb_typeof(f->'manufacturing') is distinct from 'boolean' then
    miss := miss || 'category'::text;
  end if;
  if biz = 'aop' and jsonb_typeof(f->'aopRegistered') is distinct from 'boolean' then
    miss := miss || 'aopReg'::text;
  end if;
  if coalesce(f#>>'{nature,sector}', '') = ''
     or (jsonb_typeof(f#>'{nature,items}') is distinct from 'array' or jsonb_array_length(f#>'{nature,items}') = 0)
        and coalesce(btrim(f#>>'{nature,other}'), '') = '' then
    miss := miss || 'nature'::text;
  end if;
  if a.jurisdiction_ok is distinct from true then
    miss := miss || 'juris'::text;
  end if;
  if not coalesce(f->'addrMatch' = 'true'::jsonb, false) then
    miss := miss || 'addr'::text;
  end if;
  foreach k in array array['name', 'address', 'ntn', 'tel', 'email', 'particulars', 'est', 'rep', 'desig', 'cnic', 'mobile',
                           'repEmail', 'repAddress'] loop
    if coalesce(btrim(f->>k), '') = '' or (k = 'est' and (f->>k) !~ '^\d{4}-\d{2}-\d{2}$') then
      miss := miss || ('field:' || k);
    end if;
  end loop;
  sales_tax := coalesce(f->'salesTax' = 'true'::jsonb, false);
  aop_reg := coalesce(f->'aopRegistered' = 'true'::jsonb, false);
  if sales_tax and coalesce(f->>'stWef', '') !~ '^\d{4}-\d{2}-\d{2}$' then
    miss := miss || 'field:stWef'::text;
  end if;
  for k in select r.key from public.document_requirements r
           where r.biz_type = biz::public.biz_type
             and (case r.key when 'st' then sales_tax when 'formc' then aop_reg else r.required end)
           order by r.sort loop
    if not exists (select 1 from public.application_documents d
                   where d.application_id = p_app and d.key = k and d.status <> 'rejected') then
      miss := miss || ('doc:' || k);
    end if;
  end loop;
  if biz <> 'prop' and (select count(*) from public.application_partners p where p.application_id = p_app) < 2 then
    miss := miss || 'partners'::text;
  end if;
  -- every partner / director listed gives an email and an address (owner, 28 Oct 2026)
  if exists (select 1 from public.application_partners p where p.application_id = p_app
             and (coalesce(btrim(p.email), '') = '' or coalesce(btrim(p.address), '') = '')) then
    miss := miss || 'partnerContacts'::text;
  end if;
  if a.sign_path is null then
    miss := miss || 'sign'::text;
  end if;
  if a.stamp_path is null and (biz <> 'prop' or coalesce(rules->'stampRequiredForProprietor' = 'true'::jsonb, false)) then
    miss := miss || 'stamp'::text;
  end if;
  if not (a.decl1 and a.decl2) then
    miss := miss || 'decl'::text;
  end if;
  return miss;
end $$;

-- ───────── the email after a verified membership fee: the membership is active (no temporary membership) ─────────
create or replace function private.pay_settle(p_voucher text, p_counter boolean, p_ref text, p_note text)
  returns table (email_id bigint, to_email text, lang text, name text, voucher_no text, amount int, ref_type text,
                 temp_code text, member_no text, expires_at timestamptz, app_id uuid)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
  r record;
begin
  if auth.uid() is null or private.staff_level('pay') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into v from public.payment_vouchers x where x.voucher_no = p_voucher for update;
  if v.id is null then
    raise exception 'voucher not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if p_counter then
    if v.status not in ('Unpaid', 'Rejected', 'Receipt uploaded') then
      raise exception 'this voucher cannot be paid now' using errcode = 'P0001', hint = 'wrong_status';
    end if;
    if coalesce(btrim(p_ref), '') = '' then
      raise exception 'the bank or counter receipt reference is required' using errcode = 'P0001', hint = 'reference';
    end if;
    perform private.set_reason('payment received at counter: ' || left(btrim(p_ref), 80));
    insert into public.payment_receipts (voucher_id, company_id, path, bank_ref, uploaded_by, method, status, decided_by, decided_at, reason)
    values (v.id, v.company_id, null, left(btrim(p_ref), 80), auth.uid(), 'counter', 'Accepted', auth.uid(), now(),
            nullif(left(btrim(coalesce(p_note, '')), 500), ''));
    update public.payment_receipts set status = 'Rejected', decided_by = auth.uid(), decided_at = now(),
           reason = 'paid at the counter instead'
     where voucher_id = v.id and status = 'Submitted';
  else
    if v.status is distinct from 'Receipt uploaded' then
      raise exception 'no receipt is waiting for verification' using errcode = 'P0001', hint = 'wrong_status';
    end if;
    perform private.set_reason('receipt verified against the bank statement');
    update public.payment_receipts set status = 'Accepted', decided_by = auth.uid(), decided_at = now()
     where voucher_id = v.id and status = 'Submitted';
  end if;
  update public.payment_vouchers set status = 'Paid', paid_at = now(), verified_by = auth.uid(), reject_reason = null where id = v.id;
  select * into r from private.voucher_paid(v.id);
  return query select e.email_id, e.to_email, e.lang, e.name, v.voucher_no, v.amount, v.ref_type,
                      r.temp_code, r.member_no, r.expires_at, case when v.ref_type = 'membership' then v.ref_id end
               from private.company_email(v.company_id, case when r.member_no is not null then 'member_activated' else 'payment_verified' end,
                                          case when v.ref_type = 'membership' then v.ref_id end) e;
end $$;

-- ───────── public counters: Corporate and Associate members apart (docs/21 point 34); no temporary members ─────────
drop function api.site_stats();
create function api.site_stats()
  returns table (members int, corporate int, associate int, services_issued int, services_open int, applications_open int)
  language sql stable security definer set search_path = ''
  as $$
    select
      (select count(*)::int from public.members m join public.companies c on c.id = m.company_id
        where not c.demo and m.status = 'Permanent'),
      (select count(*)::int from public.members m join public.companies c on c.id = m.company_id
        where not c.demo and m.status = 'Permanent' and m.class = 'Corporate'),
      (select count(*)::int from public.members m join public.companies c on c.id = m.company_id
        where not c.demo and m.status = 'Permanent' and m.class = 'Associate'),
      (select count(*)::int from public.service_requests s join public.companies c on c.id = s.company_id
        where not c.demo and not s.draft and s.status = 'Issued'),
      (select count(*)::int from public.service_requests s join public.companies c on c.id = s.company_id
        where not c.demo and not s.draft and s.status not in ('Issued', 'Rejected', 'Cancelled')),
      (select count(*)::int from public.applications a join public.companies c on c.id = a.company_id
        where not c.demo and a.stage in ('submitted', 'review', 'returned', 'proposer', 'committee', 'payment'))
  $$;
revoke all on function api.site_stats() from public, anon, authenticated;
grant execute on function api.site_stats() to service_role;
