-- 0340 · Payments and temporary membership (docs/03 §3–4, docs/05 M6, docs/08 "QR & verification"). Release 5.
--
-- voucher: Unpaid ──receipt──▶ Receipt uploaded ──verify──▶ Paid        (pay.upload, pay.verify)
--                                   └──reject(reason)──▶ Rejected ──re-upload──▶ Receipt uploaded
--          Unpaid|Rejected|Receipt uploaded ──counter payment──▶ Paid   (psid.markpaid: paid at the MCCI counter)
--          Unpaid ──due date passed (job)──▶ Expired ──reissue──▶ new voucher;  Unpaid ──cancel(reason)──▶ Cancelled
-- Paid membership voucher → temporary membership (settings.temp.autoIssue; else staff "Issue temporary"):
--   member row (the committee's number, status Temporary, valid to 31 March), temporary certificate with QR,
--   temp_memberships (expires after settings.temp.days), print queue item, company particulars from the approved form.
-- temp: active ──alerts at alert1/alert2 days (job)──▶ active;  ──expires (job)──▶ expired (member TempExpired, QR Expired)
--       active|expired ──extend (SG, reason, ≤ maxExtensions)──▶ active;  active|expired ──revoke (SG, reason)──▶ revoked
--
-- Levels (docs/06): pay.* pay ≥ 2; temp.issue temp ≥ 2; temp.extend/revoke temp ≥ 3; qr.revoke docs ≥ 3;
-- settings.save (bank account) plat ≥ 2; member pay.upload company area pay ≥ 2. Receipts can be uploaded only once
-- MCCI has confirmed the bank account (docs/14 item 4) — the storage policy checks the same.

-- ───────── 1. tables and settings ─────────

-- a counter payment has no file: the receipt row records the bank / counter reference instead
alter table public.payment_receipts alter column path drop not null,
  add column method text not null default 'upload' check (method in ('upload', 'counter')),
  add constraint payment_receipts_path_upload check (method = 'counter' or path is not null);

-- ───────── 2. helpers (no client execute) ─────────

create function private.bank_confirmed() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select coalesce((select (s.value ->> 'confirmed')::boolean from private.settings s where s.key = 'bank'), false) $$;
revoke all on function private.bank_confirmed() from public, anon, authenticated, service_role;

-- receipts go only to an open voucher of the company, and only once the bank account is confirmed
create or replace function private.voucher_accepts_receipt(p_voucher uuid, p_company uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select private.bank_confirmed() and exists (select 1 from public.payment_vouchers v
                   where v.id = p_voucher and v.company_id = p_company and v.status in ('Unpaid','Rejected'))
  $$;
-- 0230 granted it to authenticated and service_role (the storage policy runs as the uploader) but left PostgreSQL's
-- default PUBLIC execute; anon has no usage on schema private, so it was unreachable — closed here all the same
revoke all on function private.voucher_accepts_receipt(uuid, uuid) from public, anon;

-- 31 March that ends the current membership year (1 April – 31 March, docs/02), in Asia/Karachi
create function private.membership_year_end() returns date
  language sql stable set search_path = ''
  as $$
    select make_date(extract(year from d)::int + case when extract(month from d) >= 4 then 1 else 0 end, 3, 31)
    from (select (now() at time zone 'Asia/Karachi')::date as d) x
  $$;
revoke all on function private.membership_year_end() from public, anon, authenticated, service_role;

-- portal message for every Owner / Manager / Accounts user of a company (template rendered bilingually)
create function private.company_notify_t(p_company uuid, p_area text, p_template text, p_vars jsonb, p_title text, p_body text,
                                         p_link text) returns void
  language sql volatile security definer set search_path = ''
  as $$
    insert into public.notifications (company_id, area, title, body, link, channel, template, vars)
    values (p_company, p_area, p_title, p_body, p_link, 'Email + Portal', p_template, coalesce(p_vars, '{}'))
  $$;
revoke all on function private.company_notify_t(uuid, text, text, jsonb, text, text, text) from public, anon, authenticated, service_role;

-- the person to email about a company's membership: the applicant of its latest application, else its first Owner
create function private.company_email(p_company uuid, p_template text, p_app uuid default null)
  returns table (email_id bigint, to_email text, lang text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r record;
  v_id bigint;
begin
  select p.email::text as email, p.lang, p.full_name into r
  from public.profiles p
  where p.id = coalesce(
    (select a.created_by from public.applications a where a.company_id = p_company order by a.created_at desc limit 1),
    (select cu.user_id from public.company_users cu where cu.company_id = p_company and cu.role = 'Owner'
       and cu.status = 'Active' order by cu.created_at limit 1));
  if r.email is null then
    return;
  end if;
  insert into public.email_log (template_key, to_email, status, created_by, application_id)
  values (p_template, r.email, 'queued', auth.uid(), p_app)
  returning id into v_id;
  return query select v_id, r.email, r.lang, r.full_name;
end $$;
revoke all on function private.company_email(uuid, text, uuid) from public, anon, authenticated, service_role;

-- temporary membership for an approved, paid application (docs/03 §4 issueTemporary)
create function private.temp_issue(p_app uuid)
  returns table (member_id uuid, member_no text, code text, expires_at timestamptz)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  f jsonb;
  t jsonb := coalesce((select s.value from private.settings s where s.key = 'temp'), '{}');
  v_days int;
  v_member uuid;
  v_doc uuid;
  v_code text;
  v_expires timestamptz;
begin
  select * into a from public.applications x where x.id = p_app for update;
  if a.stage is distinct from 'payment' or a.member_no is null then
    raise exception 'only an approved application waiting for payment' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if not exists (select 1 from public.payment_vouchers v where v.ref_type = 'membership' and v.ref_id = p_app and v.status = 'Paid') then
    raise exception 'the membership fee is not verified yet' using errcode = 'P0001', hint = 'not_paid';
  end if;
  f := a.form;
  v_days := coalesce((t ->> 'days')::int, 60);
  v_expires := now() + make_interval(days => v_days);

  -- the company record takes the particulars MCCI approved (directory, certificates, services use them)
  update public.companies c set
    name = coalesce(nullif(btrim(f ->> 'name'), ''), c.name),
    biz_type = coalesce((select (f ->> 'biz')::public.biz_type where f ->> 'biz' in ('prop','aop','pvt','mnc','public')), c.biz_type),
    address = coalesce(nullif(btrim(f ->> 'address'), ''), c.address),
    ntn = coalesce(nullif(btrim(f ->> 'ntn'), ''), c.ntn),
    gst = coalesce(nullif(btrim(f ->> 'gst'), ''), c.gst),
    tel = coalesce(nullif(btrim(f ->> 'tel'), ''), c.tel),
    fax = coalesce(nullif(btrim(f ->> 'fax'), ''), c.fax),
    email = coalesce(nullif(btrim(f ->> 'email'), '')::extensions.citext, c.email),
    particulars = coalesce(nullif(btrim(f ->> 'particulars'), ''), c.particulars),
    nature_sector = coalesce(nullif(btrim(f -> 'nature' ->> 'sector'), ''), c.nature_sector)
  where c.id = a.company_id;

  insert into public.members (member_no, company_id, class, women, status, rep_name, since, valid_to)
  values (a.member_no, a.company_id, a.class, a.women, 'Temporary', coalesce(nullif(btrim(f ->> 'rep'), ''), '—'),
          (now() at time zone 'Asia/Karachi')::date, private.membership_year_end())
  returning id into v_member;
  insert into public.documents (kind, company_id, member_id, title, status, valid_to)
  values ('temp_certificate', a.company_id, v_member, 'Temporary Membership Certificate', 'Temporary',
          (v_expires at time zone 'Asia/Karachi')::date)
  returning id, documents.code into v_doc, v_code;
  insert into public.temp_memberships (member_id, expires_at, certificate_doc) values (v_member, v_expires, v_doc);
  insert into public.print_items (member_id, reason, status) values (v_member, 'new', 'queued');
  update public.applications set stage = 'temp', member_id = v_member where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'temp issued', a.member_no || ' · ' || v_code || ' · until ' || to_char(v_expires at time zone 'Asia/Karachi', 'DD Mon YYYY'),
          coalesce(private.staff_name(), 'System'), auth.uid());
  perform private.app_notify_t(p_app, 'temp.issued',
    jsonb_build_object('no', a.member_no, 'code', v_code, 'until', to_char(v_expires at time zone 'Asia/Karachi', 'DD Mon YYYY')),
    'Temporary membership issued', 'Your temporary membership ' || a.member_no || ' is active. Your certificate is in My Documents.');
  return query select v_member, a.member_no, v_code, v_expires;
end $$;
revoke all on function private.temp_issue(uuid) from public, anon, authenticated, service_role;

-- a voucher becomes Paid: history, messages, and for membership the temporary membership when the setting says so
create function private.voucher_paid(p_voucher uuid)
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
  return query select null::text, null::text, null::timestamptz;
end $$;
revoke all on function private.voucher_paid(uuid) from public, anon, authenticated, service_role;

-- ───────── 3. payments (pay.upload, pay.verify, pay.reject, psid.markpaid, psid.cancel, psid.gen) ─────────

create function api.pay_upload(p_voucher text, p_path text, p_sha256 text default null, p_bank_ref text default null)
  returns table (email_id bigint, to_email text, lang text, name text, voucher_no text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
begin
  select * into v from public.payment_vouchers x where x.voucher_no = p_voucher for update;
  if v.id is null or auth.uid() is null or private.company_level(v.company_id, 'pay') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not private.bank_confirmed() then
    raise exception 'MCCI has not confirmed the bank account yet' using errcode = 'P0001', hint = 'bank_pending';
  end if;
  if v.status not in ('Unpaid', 'Rejected') then
    raise exception 'this voucher does not take a receipt now' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  if p_path is null or private.path_company(p_path) is distinct from v.company_id
     or private.path_entity(p_path) is distinct from 'vouchers' or private.path_entity_id(p_path) is distinct from v.id
     or not exists (select 1 from storage.objects o where o.bucket_id = 'receipts' and o.name = p_path) then
    raise exception 'upload the receipt file first' using errcode = 'P0001', hint = 'file';
  end if;
  if p_sha256 is not null and p_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'bad checksum' using errcode = 'P0001', hint = 'file';
  end if;
  perform private.set_reason('paid receipt uploaded');
  insert into public.payment_receipts (voucher_id, company_id, path, sha256, bank_ref, uploaded_by, method)
  values (v.id, v.company_id, p_path, p_sha256, nullif(left(btrim(coalesce(p_bank_ref, '')), 80), ''), auth.uid(), 'upload');
  update public.payment_vouchers set status = 'Receipt uploaded', reject_reason = null where id = v.id;
  if v.ref_type = 'membership' then
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (v.ref_id, 'receipt uploaded', v.voucher_no, private.staff_name(), auth.uid());
  end if;
  perform private.company_notify_t(v.company_id, 'pay', 'payment.received', jsonb_build_object('voucher', v.voucher_no),
    'Receipt received', 'MCCI Accounts will verify your receipt for voucher ' || v.voucher_no || '.', '/portal/payments');
  return query select e.email_id, e.to_email, e.lang, e.name, v.voucher_no
               from private.company_email(v.company_id, 'payment_receipt_received', case when v.ref_type = 'membership' then v.ref_id end) e;
end $$;

-- verify the uploaded receipt (or record a counter payment): Paid; temporary membership for a membership voucher
create function private.pay_settle(p_voucher text, p_counter boolean, p_ref text, p_note text)
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
               from private.company_email(v.company_id, case when r.temp_code is not null then 'temp_issued' else 'payment_verified' end,
                                          case when v.ref_type = 'membership' then v.ref_id end) e;
end $$;
revoke all on function private.pay_settle(text, boolean, text, text) from public, anon, authenticated, service_role;

create function api.pay_verify(p_voucher text)
  returns table (email_id bigint, to_email text, lang text, name text, voucher_no text, amount int, ref_type text,
                 temp_code text, member_no text, expires_at timestamptz, app_id uuid)
  language sql volatile security definer set search_path = ''
  as $$ select * from private.pay_settle(p_voucher, false, null, null) $$;

create function api.pay_counter(p_voucher text, p_ref text, p_note text default null)
  returns table (email_id bigint, to_email text, lang text, name text, voucher_no text, amount int, ref_type text,
                 temp_code text, member_no text, expires_at timestamptz, app_id uuid)
  language sql volatile security definer set search_path = ''
  as $$ select * from private.pay_settle(p_voucher, true, p_ref, p_note) $$;

create function api.pay_reject(p_voucher text, p_reason text)
  returns table (email_id bigint, to_email text, lang text, name text, voucher_no text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if auth.uid() is null or private.staff_level('pay') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_reason is null or length(v_reason) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into v from public.payment_vouchers x where x.voucher_no = p_voucher for update;
  if v.id is null or v.status is distinct from 'Receipt uploaded' then
    raise exception 'no receipt is waiting for verification' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  perform private.set_reason('receipt not accepted: ' || left(v_reason, 200));
  update public.payment_receipts set status = 'Rejected', decided_by = auth.uid(), decided_at = now(), reason = left(v_reason, 500)
   where voucher_id = v.id and status = 'Submitted';
  update public.payment_vouchers set status = 'Rejected', reject_reason = left(v_reason, 500) where id = v.id;
  if v.ref_type = 'membership' then
    insert into public.application_history (application_id, step, note, by_name, by_user)
    values (v.ref_id, 'receipt rejected', left(v_reason, 500), private.staff_name(), auth.uid());
  end if;
  perform private.company_notify_t(v.company_id, 'pay', 'payment.rejected',
    jsonb_build_object('voucher', v.voucher_no, 'reason', left(v_reason, 500)),
    'Receipt not accepted', left(v_reason, 500), '/portal/payments');
  return query select e.email_id, e.to_email, e.lang, e.name, v.voucher_no
               from private.company_email(v.company_id, 'payment_rejected', case when v.ref_type = 'membership' then v.ref_id end) e;
end $$;

create function api.voucher_cancel(p_voucher text, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
begin
  if auth.uid() is null or private.staff_level('pay') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into v from public.payment_vouchers x where x.voucher_no = p_voucher for update;
  if v.id is null or v.status not in ('Unpaid', 'Rejected', 'Expired') then
    raise exception 'this voucher cannot be cancelled' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  perform private.set_reason('voucher cancelled: ' || left(btrim(p_reason), 200));
  update public.payment_vouchers set status = 'Cancelled', reject_reason = left(btrim(p_reason), 500) where id = v.id;
end $$;

-- psid.gen for an approved membership whose voucher expired or was cancelled: a new voucher with the same lines
create function api.voucher_reissue(p_voucher text) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
  v_new text;
  v_days int := coalesce((select (s.value ->> 'dueDays')::int from private.settings s where s.key = 'voucher'), 7);
begin
  if auth.uid() is null or private.staff_level('pay') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into v from public.payment_vouchers x where x.voucher_no = p_voucher for update;
  if v.id is null or v.status not in ('Expired', 'Cancelled') then
    raise exception 'only an expired or cancelled voucher is reissued' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  if exists (select 1 from public.payment_vouchers x where x.ref_type = v.ref_type and x.ref_id = v.ref_id
             and x.status in ('Unpaid', 'Receipt uploaded', 'Rejected', 'Paid')) then
    raise exception 'a live voucher already exists' using errcode = 'P0001', hint = 'live_exists';
  end if;
  perform private.set_reason('voucher reissued for ' || v.voucher_no);
  insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at)
  values (v.company_id, v.ref_type, v.ref_id, v.lines, v.amount, now() + make_interval(days => v_days))
  returning payment_vouchers.voucher_no into v_new;
  perform private.company_notify_t(v.company_id, 'pay', 'payment.reissued', jsonb_build_object('voucher', v_new),
    'New payment voucher', 'Payment voucher ' || v_new || ' replaces ' || v.voucher_no || '.', '/portal/payments');
  return v_new;
end $$;

-- ───────── 4. temporary membership (temp.issue, temp.extend, temp.revoke) ─────────

create function api.temp_issue(p_app uuid)
  returns table (member_id uuid, member_no text, code text, expires_at timestamptz, email_id bigint, to_email text, lang text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r record;
  v_company uuid;
begin
  if auth.uid() is null or private.staff_level('temp') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('temporary membership issued');
  select * into r from private.temp_issue(p_app);
  select a.company_id into v_company from public.applications a where a.id = p_app;
  return query select r.member_id, r.member_no, r.code, r.expires_at, e.email_id, e.to_email, e.lang, e.name
               from private.company_email(v_company, 'temp_issued', p_app) e;
end $$;

create function api.temp_extend(p_temp uuid, p_reason text)
  returns table (expires_at timestamptz, email_id bigint, to_email text, lang text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  t public.temp_memberships;
  m public.members;
  s jsonb := coalesce((select x.value from private.settings x where x.key = 'temp'), '{}');
  v_days int;
  v_until timestamptz;
begin
  if auth.uid() is null or private.staff_level('temp') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into t from public.temp_memberships x where x.id = p_temp for update;
  if t.id is null or t.status not in ('active', 'expired') then
    raise exception 'only an active or expired temporary membership is extended' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  if t.extensions >= coalesce((s ->> 'maxExtensions')::int, 1) then
    raise exception 'the maximum number of extensions is reached' using errcode = 'P0001', hint = 'max_extensions';
  end if;
  v_days := coalesce((s ->> 'extendDays')::int, 30);
  v_until := greatest(t.expires_at, now()) + make_interval(days => v_days);
  perform private.set_reason('temporary membership extended: ' || left(btrim(p_reason), 200));
  update public.temp_memberships set expires_at = v_until, extended_days = extended_days + v_days,
         extensions = extensions + 1, extend_reason = left(btrim(p_reason), 500), status = 'active', alerts_sent = '{}'
   where id = t.id;
  update public.members set status = 'Temporary' where id = t.member_id and status = 'TempExpired';
  update public.documents set status = 'Temporary', valid_to = (v_until at time zone 'Asia/Karachi')::date
   where id = t.certificate_doc and status in ('Temporary', 'Expired');
  select * into m from public.members x where x.id = t.member_id;
  perform private.company_notify_t(m.company_id, 'mship', 'temp.extended',
    jsonb_build_object('no', m.member_no, 'until', to_char(v_until at time zone 'Asia/Karachi', 'DD Mon YYYY')),
    'Temporary membership extended', 'Valid until ' || to_char(v_until at time zone 'Asia/Karachi', 'DD Mon YYYY') || '.', '/portal/membership');
  return query select v_until, e.email_id, e.to_email, e.lang, e.name from private.company_email(m.company_id, 'temp_extended') e;
end $$;

create function api.temp_revoke(p_temp uuid, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  t public.temp_memberships;
  m public.members;
begin
  if auth.uid() is null or private.staff_level('temp') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into t from public.temp_memberships x where x.id = p_temp for update;
  if t.id is null or t.status not in ('active', 'expired') then
    raise exception 'only an active or expired temporary membership is revoked' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  perform private.set_reason('temporary membership revoked: ' || left(btrim(p_reason), 200));
  update public.temp_memberships set status = 'revoked' where id = t.id;
  update public.members set status = 'Revoked', suspended_reason = left(btrim(p_reason), 500) where id = t.member_id;
  update public.documents set status = 'Revoked', revoked_reason = left(btrim(p_reason), 500) where id = t.certificate_doc;
  select * into m from public.members x where x.id = t.member_id;
  perform private.company_notify_t(m.company_id, 'mship', 'temp.revoked', jsonb_build_object('no', m.member_no, 'reason', left(btrim(p_reason), 500)),
    'Temporary membership revoked', left(btrim(p_reason), 500), '/portal/membership');
end $$;

-- ───────── 5. QR registry (qr.revoke, verify.go, doc.view) ─────────

create function api.qr_revoke(p_code text, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('docs') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason('document revoked: ' || left(btrim(p_reason), 200));
  update public.documents set status = 'Revoked', revoked_reason = left(btrim(p_reason), 500)
   where code = upper(btrim(p_code)) and status <> 'Revoked';
  if not found then
    raise exception 'document not found or already revoked' using errcode = 'P0001', hint = 'not_found';
  end if;
end $$;

-- public verification (docs/08): only what the document shows anyway; every lookup is counted. Called by the app's
-- /api/verify route with the service role after its rate limit — never by browsers directly.
create function api.doc_verify(p_code text)
  returns table (code text, title text, kind text, company text, member_no text, status text, valid_to date,
                 superseded_by text, issued date)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  d public.documents;
begin
  select * into d from public.documents x where x.code = upper(btrim(p_code));
  if d.id is null then
    return;
  end if;
  update public.documents set scans = scans + 1 where id = d.id;
  return query
    select d.code, d.title, d.kind::text, c.name, m.member_no,
           case when d.status in ('Valid', 'Temporary') and d.valid_to is not null
                     and d.valid_to < (now() at time zone 'Asia/Karachi')::date then 'Expired' else d.status::text end,
           d.valid_to,
           (select coalesce(pi.serial, s.code) from public.documents s
              left join public.print_items pi on pi.member_id = s.member_id and pi.serial is not null
             where s.id = d.superseded_by limit 1),
           (d.created_at at time zone 'Asia/Karachi')::date
    from public.documents x
    left join public.companies c on c.id = d.company_id
    left join public.members m on m.id = d.member_id
    where x.id = d.id;
end $$;

-- a certificate for the screen and printing: the member's own company (docs ≥ 1) or staff (docs ≥ 1)
create function api.cert_view(p_code text)
  returns table (code text, kind text, title text, status text, company text, class text, women boolean, member_no text,
                 issued_at timestamptz, expires_at timestamptz, extended boolean, temp_status text, voucher_no text, valid_to date)
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  d public.documents;
begin
  select * into d from public.documents x where x.code = upper(btrim(p_code));
  if d.id is null or auth.uid() is null
     or not (private.company_level(d.company_id, 'docs') >= 1 or private.staff_level('docs') >= 1 or private.staff_level('temp') >= 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select d.code, d.kind::text, d.title, d.status::text, c.name, m.class::text, m.women, m.member_no,
           t.issued_at, t.expires_at, coalesce(t.extensions, 0) > 0, t.status::text,
           (select v.voucher_no from public.payment_vouchers v join public.applications a on a.id = v.ref_id
             where v.ref_type = 'membership' and a.member_id = m.id and v.status = 'Paid' order by v.paid_at desc limit 1),
           d.valid_to
    from public.documents x
    left join public.companies c on c.id = d.company_id
    left join public.members m on m.id = d.member_id
    left join public.temp_memberships t on t.certificate_doc = d.id
    where x.id = d.id;
end $$;

-- ───────── 6. settings: the bank account on vouchers (settings.save, plat ≥ 2) ─────────

create function api.settings_bank_save(p_bank text, p_title text, p_iban text, p_branch text, p_confirmed boolean) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_iban text := upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g'));
begin
  if auth.uid() is null or private.staff_level('plat') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_bank), '') = '' or coalesce(btrim(p_title), '') = '' then
    raise exception 'bank and account title are required' using errcode = 'P0001', hint = 'required';
  end if;
  -- a Pakistani IBAN: PK + 2 check digits + 4-letter bank code + 16 digits; the placeholder (PK00 XXXX …) never passes
  if v_iban !~ '^PK[0-9]{2}[A-Z]{4}[0-9]{16}$' or v_iban like 'PK00%' then
    raise exception 'IBAN like PK36 SCBL 0000 0011 2345 6702' using errcode = 'P0001', hint = 'iban';
  end if;
  perform private.set_reason(case when p_confirmed then 'bank account for vouchers confirmed' else 'bank account for vouchers saved (not confirmed)' end);
  update private.settings set value = jsonb_build_object(
      'name', left(btrim(p_bank), 120), 'title', left(btrim(p_title), 160),
      'iban', substr(v_iban, 1, 4) || ' ' || substr(v_iban, 5, 4) || ' ' || substr(v_iban, 9, 4) || ' ' || substr(v_iban, 13, 4)
              || ' ' || substr(v_iban, 17, 4) || ' ' || substr(v_iban, 21, 4),
      'branch', left(btrim(coalesce(p_branch, '')), 120), 'confirmed', coalesce(p_confirmed, false))
   where key = 'bank';
end $$;

-- staff read the bank settings for the Payments screen (pay ≥ 1 or plat ≥ 1)
create function api.settings_bank() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or (private.staff_level('pay') < 1 and private.staff_level('plat') < 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return (select s.value from private.settings s where s.key = 'bank');
end $$;

-- staff read the temporary-membership policy (days, alerts, extensions, auto-issue) for their screens (temp ≥ 1)
create function api.temp_policy() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('temp') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return coalesce((select s.value from private.settings s where s.key = 'temp'), '{}');
end $$;

-- ───────── 7. scheduled jobs (service role only; /api/cron/*) ─────────

-- temp-alerts (alert1 / alert2 days before expiry, once each) and temp-expire (docs/07)
create function api.temp_jobs()
  returns table (kind text, member_no text, company_id uuid, expires_at timestamptz, email text, full_name text, lang text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  s jsonb := coalesce((select x.value from private.settings x where x.key = 'temp'), '{}');
  a1 int := coalesce((s ->> 'alert1')::int, 15);
  a2 int := coalesce((s ->> 'alert2')::int, 7);
  t record;
  e record;
begin
  perform private.set_reason('scheduled job: temporary memberships');
  -- expiry
  for t in select tm.*, m.member_no, m.company_id from public.temp_memberships tm join public.members m on m.id = tm.member_id
           where tm.status = 'active' and tm.expires_at < now() for update of tm loop
    update public.temp_memberships set status = 'expired' where id = t.id;
    update public.members set status = 'TempExpired' where id = t.member_id and status = 'Temporary';
    update public.documents set status = 'Expired' where id = t.certificate_doc and status = 'Temporary';
    perform private.company_notify_t(t.company_id, 'mship', 'temp.expired', jsonb_build_object('no', t.member_no),
      'Temporary membership expired', 'Your temporary membership ' || t.member_no || ' has expired. MCCI can extend it.', '/portal/membership');
    for e in select * from private.company_email(t.company_id, 'temp_expired') loop
      return query select 'expired'::text, t.member_no, t.company_id, t.expires_at, e.to_email, e.name, e.lang;
    end loop;
  end loop;
  -- alerts
  for t in select tm.*, m.member_no, m.company_id,
                  case when tm.expires_at <= now() + make_interval(days => a2) then a2 else a1 end as d
           from public.temp_memberships tm join public.members m on m.id = tm.member_id
           where tm.status = 'active' and tm.expires_at <= now() + make_interval(days => a1)
             and not ((case when tm.expires_at <= now() + make_interval(days => a2) then a2 else a1 end) = any (tm.alerts_sent))
           for update of tm loop
    update public.temp_memberships set alerts_sent = alerts_sent || t.d::smallint where id = t.id;
    perform private.company_notify_t(t.company_id, 'mship', 'temp.alert',
      jsonb_build_object('no', t.member_no, 'until', to_char(t.expires_at at time zone 'Asia/Karachi', 'DD Mon YYYY'), 'days', t.d::text),
      'Temporary membership ends soon', 'Your temporary membership ' || t.member_no || ' ends on '
        || to_char(t.expires_at at time zone 'Asia/Karachi', 'DD Mon YYYY') || '.', '/portal/membership');
    for e in select * from private.company_email(t.company_id, 'temp_alert_' || t.d) loop
      return query select ('alert_' || t.d)::text, t.member_no, t.company_id, t.expires_at, e.to_email, e.name, e.lang;
    end loop;
  end loop;
end $$;

-- vouchers: Unpaid and past due → Expired (docs/07 daily 00:30)
create function api.voucher_jobs() returns int
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  n int;
begin
  perform private.set_reason('scheduled job: vouchers past due');
  update public.payment_vouchers set status = 'Expired' where status = 'Unpaid' and due_at < now();
  get diagnostics n = row_count;
  return n;
end $$;

-- ───────── 8. grants ─────────

do $$
declare f text;
begin
  foreach f in array array[
    'api.pay_upload(text,text,text,text)', 'api.pay_verify(text)', 'api.pay_counter(text,text,text)',
    'api.pay_reject(text,text)', 'api.voucher_cancel(text,text)', 'api.voucher_reissue(text)',
    'api.temp_issue(uuid)', 'api.temp_extend(uuid,text)', 'api.temp_revoke(uuid,text)', 'api.qr_revoke(text,text)',
    'api.cert_view(text)', 'api.settings_bank_save(text,text,text,text,boolean)', 'api.settings_bank()', 'api.temp_policy()'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  foreach f in array array['api.doc_verify(text)', 'api.temp_jobs()', 'api.voucher_jobs()'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
