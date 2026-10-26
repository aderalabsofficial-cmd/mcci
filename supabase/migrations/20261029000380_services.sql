-- 0380 · Services (M7; docs/03 §5, docs/05 M8, docs/06 svc, actions svc.*, svcset.*, sla.rules).
--
-- Member (company svc ≥ 2, membership Permanent — or Temporary when settings.temp.servicesAllowed — and in date):
--   svc_new → draft (documents uploaded, AI may read them, fields typed) → svc_submit: token, SLA clock
--   (submitted_at + service_types.sla_hours), a fee voucher when the fee is above 0 → … ; svc_cancel while not started;
--   svc_resubmit after a return (SLA restarts).
-- Staff (svc ≥ 2, 2-step login): svc_start → svc_approve | svc_return(note) | svc_reject(reason).
-- Signatory (svc ≥ 3: President, Secretary General): svc_sign → Issued: a QR document (kind letter) in the registry;
--   only once the fee is paid. svc_sign_all signs every ready request whose fee is paid.
-- Platform (plat ≥ 2): svcset_save — fee, SLA hours, documents, fields, active (TODO(MCCI): fees are placeholders).
-- A draft is a request with draft = true (status stays Submitted until it is sent): staff never see drafts.
-- Every step writes service_history and the audit log; members are told by portal notice and email.

alter table public.service_requests
  add column draft boolean not null default false,
  add column started_at timestamptz,
  add column approved_at timestamptz,
  add column issued_at timestamptz,
  add column signed_by uuid references public.profiles,
  add column reject_reason text;
create index service_requests_open on public.service_requests (status, sla_due_at) where not draft;

create table public.service_history (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.service_requests on delete cascade,
  step text not null,
  note text,
  by_name text,
  by_user uuid references public.profiles on delete set null,
  at timestamptz not null default now()
);
create index service_history_request on public.service_history (request_id, at);
alter table public.service_history enable row level security;
grant select on public.service_history to authenticated;
create policy svc_history_select on public.service_history for select to authenticated using (private.svc_visible(request_id));

-- staff do not see members' drafts
drop policy svc_requests_select on public.service_requests;
create policy svc_requests_select on public.service_requests for select to authenticated
  using (private.company_level(company_id, 'svc') >= 1 or ((select private.staff_level('svc')) >= 1 and not draft));

-- svc.filedel: a file is taken off a draft or a returned request (the stored copy stays private and unreferenced)
grant delete on public.service_documents to authenticated;
create policy svc_docs_delete on public.service_documents for delete to authenticated
  using (private.svc_editable(request_id)
         and exists (select 1 from public.service_requests r where r.id = request_id and (r.draft or r.status = 'Returned')));

-- ───────── helpers ─────────

-- may this company use services now (docs/03 §5): an in-date Permanent member, or Temporary when allowed; never demo
create function private.svc_eligible(p_company uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1 from public.members m join public.companies c on c.id = m.company_id
       where m.company_id = p_company and not c.demo
         and m.valid_to >= (now() at time zone 'Asia/Karachi')::date
         and (m.status = 'Permanent'
              or (m.status = 'Temporary'
                  and coalesce((select (s.value ->> 'servicesAllowed')::boolean from private.settings s where s.key = 'temp'), true))))
  $$;
grant execute on function private.svc_eligible(uuid) to authenticated, service_role;

-- for the member's screens: may my company request services now (only for a company the caller belongs to)
create function api.svc_can(p_company uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select private.company_level(p_company, 'svc') >= 1 and private.svc_eligible(p_company) $$;

create function private.svc_log(p_request uuid, p_step text, p_note text default null) returns void
  language sql volatile security definer set search_path = ''
  as $$
    insert into public.service_history (request_id, step, note, by_name, by_user)
    values (p_request, p_step, nullif(left(btrim(coalesce(p_note, '')), 1000), ''), private.staff_name(), auth.uid())
  $$;
revoke all on function private.svc_log(uuid, text, text) from public, anon, authenticated, service_role;

-- the person who made the request (else the company's first Owner) is told by email; the portal notice goes to the company
create function private.svc_notify(p_request uuid, p_template text, p_title text, p_body text)
  returns table (email_id bigint, to_email text, lang text, name text, token text, service text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
  p record;
  v_id bigint;
  v_service text;
begin
  select * into r from public.service_requests x where x.id = p_request;
  select coalesce(t.full_name_en, t.name_en) into v_service from public.service_types t where t.key = r.service_key;
  perform private.company_notify_t(r.company_id, 'svc', p_template, jsonb_build_object('token', r.token, 'service', v_service),
                                   p_title, p_body, '/portal/application?t=' || r.token);
  select pr.email::text as email, pr.lang, pr.full_name into p from public.profiles pr
   where pr.id = coalesce(r.created_by, (select cu.user_id from public.company_users cu where cu.company_id = r.company_id
                                           and cu.role = 'Owner' and cu.status = 'Active' order by cu.created_at limit 1));
  if p.email is null then
    return query select null::bigint, null::text, null::text, null::text, r.token, v_service;
    return;
  end if;
  insert into public.email_log (template_key, to_email, status, created_by) values (p_template, p.email, 'queued', auth.uid())
  returning id into v_id;
  return query select v_id, p.email, p.lang, p.full_name, r.token, v_service;
end $$;
revoke all on function private.svc_notify(uuid, text, text, text) from public, anon, authenticated, service_role;

-- the request, locked, with the checks every member step shares
create function private.svc_mine(p_request uuid) returns public.service_requests
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
begin
  select * into r from public.service_requests x where x.id = p_request for update;
  if r.id is null or auth.uid() is null or private.company_level(r.company_id, 'svc') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return r;
end $$;
revoke all on function private.svc_mine(uuid) from public, anon, authenticated, service_role;

create function private.svc_staff(p_request uuid, p_level int) returns public.service_requests
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
begin
  if auth.uid() is null or private.staff_level('svc') < p_level then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into r from public.service_requests x where x.id = p_request and not x.draft for update;
  if r.id is null then
    raise exception 'request not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return r;
end $$;
revoke all on function private.svc_staff(uuid, int) from public, anon, authenticated, service_role;

-- ───────── member ─────────

create function api.svc_new(p_company uuid, p_service text) returns table (id uuid, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  t public.service_types;
begin
  if auth.uid() is null or private.company_level(p_company, 'svc') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not private.svc_eligible(p_company) then
    raise exception 'services open when the membership is active' using errcode = 'P0001', hint = 'not_member';
  end if;
  select * into t from public.service_types x where x.key = p_service and x.active;
  if t.key is null then
    raise exception 'unknown service' using errcode = 'P0001', hint = 'service';
  end if;
  if (select count(*) from public.service_requests r where r.company_id = p_company and r.draft) >= 20 then
    raise exception 'too many unfinished requests' using errcode = 'P0001', hint = 'too_many';
  end if;
  perform private.set_reason('service request started');
  return query
    insert into public.service_requests (company_id, service_key, status, draft, data, sla_due_at, created_by)
    values (p_company, t.key, 'Submitted', true, '{}', now() + make_interval(hours => t.sla_hours), auth.uid())
    returning service_requests.id, service_requests.token;
end $$;

-- the typed / AI-read details, only while the member may still change them
create function api.svc_save(p_request uuid, p_data jsonb) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
  v_fields jsonb;
  k text;
begin
  r := private.svc_mine(p_request);
  if not (r.draft or r.status = 'Returned') then
    raise exception 'this request can no longer be changed' using errcode = 'P0001', hint = 'locked';
  end if;
  select t.fields into v_fields from public.service_types t where t.key = r.service_key;
  if jsonb_typeof(p_data) is distinct from 'object' then
    raise exception 'details missing' using errcode = 'P0001', hint = 'fields';
  end if;
  for k in select jsonb_object_keys(p_data) loop
    if not v_fields ? k or jsonb_typeof(p_data -> k) <> 'string' or length(p_data ->> k) > 500 then
      raise exception 'unknown or too long field' using errcode = 'P0001', hint = 'fields';
    end if;
  end loop;
  perform private.set_reason('service request details saved');
  update public.service_requests set data = p_data where id = r.id;
end $$;

create function api.svc_submit(p_request uuid)
  returns table (email_id bigint, to_email text, lang text, name text, token text, service text, voucher_no text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
  t public.service_types;
  v_voucher text;
  f text;
  n record;
begin
  r := private.svc_mine(p_request);
  if not r.draft then
    raise exception 'already submitted' using errcode = 'P0001', hint = 'locked';
  end if;
  if not private.svc_eligible(r.company_id) then
    raise exception 'services open when the membership is active' using errcode = 'P0001', hint = 'not_member';
  end if;
  select * into t from public.service_types x where x.key = r.service_key;
  if not exists (select 1 from public.service_documents d where d.request_id = r.id) then
    raise exception 'upload the documents first' using errcode = 'P0001', hint = 'documents';
  end if;
  for f in select jsonb_array_elements_text(t.fields) loop
    if coalesce(btrim(r.data ->> f), '') = '' then
      raise exception 'fill in every detail' using errcode = 'P0001', hint = 'fields';
    end if;
  end loop;
  perform private.set_reason('service request submitted');
  update public.service_requests
     set draft = false, status = 'Submitted', submitted_at = now(), sla_due_at = now() + make_interval(hours => t.sla_hours)
   where id = r.id;
  if t.fee > 0 then
    insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at)
    values (r.company_id, 'service', r.id, jsonb_build_array(jsonb_build_object('label', coalesce(t.full_name_en, t.name_en), 'amount', t.fee)),
            t.fee, now() + make_interval(days => coalesce((select (s.value ->> 'dueDays')::int from private.settings s where s.key = 'voucher'), 7)))
    returning payment_vouchers.voucher_no into v_voucher;
  end if;
  perform private.svc_log(r.id, 'submitted', v_voucher);
  select * into n from private.svc_notify(r.id, 'service_received', 'Request received',
    'MCCI received your request ' || r.token || '. We reply within ' || t.sla_hours || ' hours.');
  return query select n.email_id, n.to_email, n.lang, n.name, n.token, n.service, v_voucher;
end $$;

create function api.svc_cancel(p_request uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
begin
  r := private.svc_mine(p_request);
  if not (r.draft or (r.status = 'Submitted' and r.started_at is null)) then
    raise exception 'MCCI has already started on this request' using errcode = 'P0001', hint = 'locked';
  end if;
  perform private.set_reason('service request cancelled by the member');
  update public.service_requests set status = 'Cancelled' where id = r.id;
  update public.payment_vouchers set status = 'Cancelled' where ref_type = 'service' and ref_id = r.id and status in ('Unpaid', 'Rejected');
  perform private.svc_log(r.id, 'cancelled');
end $$;

create function api.svc_resubmit(p_request uuid, p_note text default null)
  returns table (token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
  v_hours int;
begin
  r := private.svc_mine(p_request);
  if r.status is distinct from 'Returned' then
    raise exception 'only a returned request is sent back' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  select t.sla_hours into v_hours from public.service_types t where t.key = r.service_key;
  perform private.set_reason('service request corrected and sent back');
  update public.service_requests set status = 'In review', return_note = null, sla_due_at = now() + make_interval(hours => v_hours)
   where id = r.id;
  perform private.svc_log(r.id, 'resubmitted', p_note);
  return query select r.token;
end $$;

-- ───────── staff ─────────

create function api.svc_start(p_request uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
begin
  r := private.svc_staff(p_request, 2);
  if r.status is distinct from 'Submitted' then
    raise exception 'this request is not waiting to be started' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  perform private.set_reason('service review started');
  update public.service_requests set status = 'In review', started_at = now(), assigned_to = auth.uid() where id = r.id;
  perform private.svc_log(r.id, 'review started');
end $$;

create function api.svc_return(p_request uuid, p_note text)
  returns table (email_id bigint, to_email text, lang text, name text, token text, service text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
begin
  r := private.svc_staff(p_request, 2);
  if r.status is distinct from 'In review' then
    raise exception 'only a request under review is returned' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  if length(btrim(coalesce(p_note, ''))) < 3 then
    raise exception 'say what to correct' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason('service request returned: ' || left(btrim(p_note), 200));
  update public.service_requests set status = 'Returned', return_note = left(btrim(p_note), 1000) where id = r.id;
  perform private.svc_log(r.id, 'returned', p_note);
  return query select * from private.svc_notify(r.id, 'service_returned', 'Request returned',
    'MCCI returned your request ' || r.token || ' for a correction: ' || left(btrim(p_note), 300));
end $$;

create function api.svc_approve(p_request uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
begin
  r := private.svc_staff(p_request, 2);
  if r.status is distinct from 'In review' then
    raise exception 'only a request under review is approved' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  perform private.set_reason('service request approved for signature');
  update public.service_requests set status = 'Ready to sign', approved_at = now() where id = r.id;
  perform private.svc_log(r.id, 'approved for signature');
end $$;

create function api.svc_reject(p_request uuid, p_reason text)
  returns table (email_id bigint, to_email text, lang text, name text, token text, service text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
begin
  r := private.svc_staff(p_request, 2);
  if r.status not in ('Submitted', 'In review', 'Returned', 'Ready to sign') then
    raise exception 'this request is closed' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'give the reason' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason('service request rejected: ' || left(btrim(p_reason), 200));
  update public.service_requests set status = 'Rejected', reject_reason = left(btrim(p_reason), 1000) where id = r.id;
  update public.payment_vouchers set status = 'Cancelled' where ref_type = 'service' and ref_id = r.id and status in ('Unpaid', 'Rejected');
  perform private.svc_log(r.id, 'rejected', p_reason);
  return query select * from private.svc_notify(r.id, 'service_rejected', 'Request not approved',
    'MCCI could not approve your request ' || r.token || ': ' || left(btrim(p_reason), 300));
end $$;

-- fee: paid (or none) before a letter is issued
create function private.svc_fee_ok(p_request uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select not exists (select 1 from public.payment_vouchers v where v.ref_type = 'service' and v.ref_id = p_request)
        or exists (select 1 from public.payment_vouchers v where v.ref_type = 'service' and v.ref_id = p_request and v.status = 'Paid')
  $$;
revoke all on function private.svc_fee_ok(uuid) from public, anon, authenticated, service_role;

create function api.svc_sign(p_request uuid)
  returns table (email_id bigint, to_email text, lang text, name text, token text, service text, code text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r public.service_requests;
  v_title text;
  v_doc uuid;
  v_code text;
  n record;
begin
  r := private.svc_staff(p_request, 3);
  if r.status is distinct from 'Ready to sign' then
    raise exception 'only an approved request is signed' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  if not private.svc_fee_ok(r.id) then
    raise exception 'the service fee is not paid yet' using errcode = 'P0001', hint = 'not_paid';
  end if;
  select coalesce(t.full_name_en, t.name_en) into v_title from public.service_types t where t.key = r.service_key;
  perform private.set_reason('service letter signed and issued');
  insert into public.documents (kind, company_id, member_id, title, status)
  values ('letter', r.company_id,
          (select m.id from public.members m where m.company_id = r.company_id order by (m.status = 'Permanent') desc, m.valid_to desc limit 1),
          v_title || ' · ' || r.token, 'Valid')
  returning documents.id, documents.code into v_doc, v_code;
  update public.service_requests set status = 'Issued', issued_doc = v_doc, issued_at = now(), signed_by = auth.uid() where id = r.id;
  perform private.svc_log(r.id, 'signed and issued', v_code);
  select * into n from private.svc_notify(r.id, 'service_issued', 'Document issued',
    'Your ' || v_title || ' (' || r.token || ') is issued. Download it from your portal; it carries QR code ' || v_code || '.');
  return query select n.email_id, n.to_email, n.lang, n.name, n.token, n.service, v_code;
end $$;

-- every ready request whose fee is paid; one by one, so one problem does not stop the rest
create function api.svc_sign_all()
  returns table (email_id bigint, to_email text, lang text, name text, token text, service text, code text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  x record;
begin
  if auth.uid() is null or private.staff_level('svc') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  for x in select r.id from public.service_requests r where r.status = 'Ready to sign' and not r.draft and private.svc_fee_ok(r.id)
           order by r.sla_due_at loop
    return query select * from api.svc_sign(x.id);
  end loop;
end $$;

-- ───────── setup (svcset.edit, sla.rules) ─────────

create function api.svcset_save(p_key text, p_fee int, p_sla_hours int, p_active boolean, p_docs jsonb, p_fields jsonb) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('plat') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_fee is null or p_fee < 0 or p_fee > 1000000 or p_sla_hours is null or p_sla_hours not between 1 and 720 then
    raise exception 'fee 0–1,000,000 and SLA 1–720 hours' using errcode = 'P0001', hint = 'fields';
  end if;
  if jsonb_typeof(p_docs) <> 'array' or jsonb_typeof(p_fields) <> 'array' or jsonb_array_length(p_docs) not between 1 and 12
     or jsonb_array_length(p_fields) not between 1 and 12
     or exists (select 1 from jsonb_array_elements(p_docs || p_fields) e where jsonb_typeof(e) <> 'string' or length(btrim(e #>> '{}')) not between 2 and 120) then
    raise exception 'one to twelve documents and details, each 2–120 characters' using errcode = 'P0001', hint = 'lists';
  end if;
  perform private.set_reason('service setup changed: ' || p_key);
  update public.service_types set fee = p_fee, sla_hours = p_sla_hours, active = coalesce(p_active, true), docs = p_docs, fields = p_fields
   where key = p_key;
  if not found then
    raise exception 'unknown service' using errcode = 'P0001', hint = 'service';
  end if;
end $$;

-- ───────── a paid service fee is written on the request's history (0340 voucher_paid + this branch) ─────────

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
    if coalesce((select (s.value ->> 'autoIssue')::boolean from private.settings s where s.key = 'temp'), true) then
      select * into r from private.temp_issue(v.ref_id);
      return query select r.code, r.member_no, r.expires_at;
      return;
    end if;
  end if;
  if v.ref_type = 'service' then
    perform private.svc_log(v.ref_id, 'fee paid', v.voucher_no || ' · Rs. ' || v.amount);
  end if;
  return query select null::text, null::text, null::timestamptz;
end $$;
revoke all on function private.voucher_paid(uuid) from public, anon, authenticated, service_role;

-- ───────── the public site (0370) never counts or shows drafts ─────────

create or replace function api.site_stats()
  returns table (members int, temporary int, converted int, services_issued int, services_open int, applications_open int)
  language sql stable security definer set search_path = ''
  as $$
    select
      (select count(*)::int from public.members m join public.companies c on c.id = m.company_id
        where not c.demo and m.status in ('Permanent', 'Temporary')),
      (select count(*)::int from public.members m join public.companies c on c.id = m.company_id
        where not c.demo and m.status = 'Temporary'),
      (select count(*)::int from public.applications a join public.companies c on c.id = a.company_id
        where not c.demo and a.stage = 'permanent'),
      (select count(*)::int from public.service_requests s join public.companies c on c.id = s.company_id
        where not c.demo and not s.draft and s.status = 'Issued'),
      (select count(*)::int from public.service_requests s join public.companies c on c.id = s.company_id
        where not c.demo and not s.draft and s.status not in ('Issued', 'Rejected', 'Cancelled')),
      (select count(*)::int from public.applications a join public.companies c on c.id = a.company_id
        where not c.demo and a.stage in ('submitted', 'review', 'returned', 'proposer', 'committee', 'payment'))
  $$;

create or replace function api.site_feed(p_limit int default 8)
  returns table (kind text, token text, status text, at timestamptz)
  language sql stable security definer set search_path = ''
  as $$
    select * from (
      select 'membership'::text, a.token, a.stage::text, coalesce(a.decided_at, a.submitted_at)
        from public.applications a join public.companies c on c.id = a.company_id
       where not c.demo and a.submitted_at is not null and a.stage not in ('draft', 'withdrawn')
      union all
      select s.service_key, s.token, s.status::text, coalesce(s.issued_at, s.submitted_at)
        from public.service_requests s join public.companies c on c.id = s.company_id
       where not c.demo and not s.draft and s.status <> 'Cancelled'
    ) f
    order by 4 desc nulls last
    limit least(greatest(coalesce(p_limit, 8), 1), 20)
  $$;

create or replace function api.site_track(p_token text)
  returns table (kind text, token text, status text, submitted_at timestamptz, decided_at timestamptz, due_at timestamptz, printing boolean)
  language sql stable security definer set search_path = ''
  as $$
    select 'membership'::text, a.token, a.stage::text, a.submitted_at, a.decided_at, null::timestamptz,
           exists (select 1 from public.print_items p where p.member_id = a.member_id and p.status in ('sent', 'printing', 'received'))
      from public.applications a
     where a.token = upper(btrim(p_token)) and a.stage not in ('draft', 'withdrawn')
    union all
    select s.service_key, s.token, s.status::text, s.submitted_at, s.issued_at, s.sla_due_at, false
      from public.service_requests s
     where s.token = upper(btrim(p_token)) and not s.draft and s.status <> 'Cancelled'
    limit 1
  $$;

do $$
declare f text;
begin
  foreach f in array array['api.svc_can(uuid)', 'api.svc_new(uuid,text)', 'api.svc_save(uuid,jsonb)', 'api.svc_submit(uuid)', 'api.svc_cancel(uuid)',
                           'api.svc_resubmit(uuid,text)', 'api.svc_start(uuid)', 'api.svc_return(uuid,text)', 'api.svc_approve(uuid)',
                           'api.svc_reject(uuid,text)', 'api.svc_sign(uuid)', 'api.svc_sign_all()',
                           'api.svcset_save(text,int,int,boolean,jsonb,jsonb)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
