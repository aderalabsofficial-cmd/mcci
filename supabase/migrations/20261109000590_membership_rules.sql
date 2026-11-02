-- 0590 · Membership rules of 1 Nov 2026 (owner's list, docs/31): enrollment dates for legacy members, renewal with an
-- editable period and a change declaration, restoration by dues and tax returns (the enrollment date never changes),
-- the voter list from a cutoff date, and change declarations with a review queue.
--
-- Voter terminology belongs to Membership and Reports only. The outreach and WhatsApp modules keep their rule of not
-- using it: nothing here is an audience or a filter there.
--
-- New modules: vot (voter list: 1 view, 2 export), chg (change declarations: 1 view, 3 approve), fin (accounts, 0600).

-- ───────── modules ─────────
alter table public.role_permissions drop constraint role_permissions_module_check;
alter table public.role_permissions add constraint role_permissions_module_check
  check (module in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat','biz','out','fin','vot','chg'));
alter table public.staff_permission_overrides drop constraint staff_permission_overrides_module_check;
alter table public.staff_permission_overrides add constraint staff_permission_overrides_module_check
  check (module in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat','biz','out','fin','vot','chg'));

do $$
declare r record;
begin
  for r in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('api', 'private') and p.prosrc like '%''plat'',''biz'',''out''%'
  loop
    execute replace(pg_get_functiondef(r.oid), '''plat'',''biz'',''out''', '''plat'',''biz'',''out'',''fin'',''vot'',''chg''');
  end loop;
end $$;

-- TODO(MCCI): default limits are a proposal; the Secretary General can change them in Staff & Roles
do $$
declare
  v_rows text[][] := array[
    ['Secretary General', 'fin', '3'], ['Secretary General', 'vot', '3'], ['Secretary General', 'chg', '3'],
    ['President (Signatory)', 'fin', '1'], ['President (Signatory)', 'vot', '1'], ['President (Signatory)', 'chg', '3'],
    ['Deputy Secretary — Membership', 'vot', '2'], ['Deputy Secretary — Membership', 'chg', '1'],
    ['Membership Officer', 'vot', '1'], ['Membership Officer', 'chg', '1'],
    ['Accounts Officer', 'fin', '2'],
    ['Auditor (read-only)', 'fin', '1'], ['Auditor (read-only)', 'vot', '1'], ['Auditor (read-only)', 'chg', '1']];
  i int;
begin
  for i in 1 .. array_length(v_rows, 1) loop
    if exists (select 1 from public.designations where name = v_rows[i][1]) then
      insert into public.role_permissions (designation, module, level)
      values (v_rows[i][1], v_rows[i][2], v_rows[i][3]::smallint) on conflict do nothing;
      insert into private.role_permission_defaults (designation, module, level)
      values (v_rows[i][1], v_rows[i][2], v_rows[i][3]::smallint) on conflict do nothing;
    end if;
  end loop;
end $$;

-- TODO(MCCI): the owner's rules, kept in settings so a by-law or a DGTO order changes them without a deploy.
-- excludeBlacklisted is off: the owner's criteria do not name it, and the list shows the flag for a person to see.
insert into private.settings (key, value) values
  ('voter', '{"minYears":2,"restoredYears":1,"excludeBlacklisted":false}'::jsonb),
  ('renewal', '{"opensOn":"2027-01-01"}'::jsonb)
on conflict (key) do nothing;

-- ───────── enrollment dates ─────────
-- A legacy member's date may be unknown ("Old"): null until set from SECP or FBR records, and never on the voter list
-- until then. Today is not a safe stand-in: it would quietly cost the member their years.
alter table public.members
  alter column since drop not null,
  add column enrollment_source text not null default 'register'
    check (enrollment_source in ('application', 'register', 'import', 'secp', 'fbr')),
  add column secp_incorporated_on date,
  add column fbr_registered_on date,
  add column valid_from date;

update public.members m set enrollment_source = 'import' where m.imported;
update public.members m set enrollment_source = 'application'
 where not m.imported and exists (select 1 from public.applications a where a.member_id = m.id);

create function private.member_source_default() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  if new.imported then new.enrollment_source := 'import';
  elsif exists (select 1 from public.applications a where a.member_no = new.member_no) then new.enrollment_source := 'application';
  end if;
  return new;
end $$;
revoke all on function private.member_source_default() from public, anon, authenticated, service_role;
create trigger member_source_default before insert on public.members
  for each row execute function private.member_source_default();

-- imports no longer turn a blank or "Old" date into today
do $$
declare r record;
begin
  for r in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('api', 'private')
       and p.prosrc like '%coalesce(nullif(d ->> ''member_since'', '''')::date, (now() at time zone ''Asia/Karachi'')::date)%'
  loop
    execute replace(pg_get_functiondef(r.oid),
      'coalesce(nullif(d ->> ''member_since'', '''')::date, (now() at time zone ''Asia/Karachi'')::date)',
      'nullif(d ->> ''member_since'', '''')::date');
  end loop;
end $$;

-- reg.enrollment: the oldest authentic date of SECP incorporation and FBR registration. Setting a missing date needs
-- reg ≥ 2; correcting a date already set needs reg ≥ 3 and a reason. A date from an approved application stays as it is.
create function api.member_enrollment_set(p_member uuid, p_secp date, p_fbr date, p_reason text default null) returns date
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.members;
  v_day date := least(p_secp, p_fbr);
  v_today date := (now() at time zone 'Asia/Karachi')::date;
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into m from public.members x where x.id = p_member for update;
  if m.id is null then raise exception 'member not found' using errcode = 'P0001', hint = 'not_found'; end if;
  if m.enrollment_source = 'application' then
    raise exception 'the date of an approved application is never changed' using errcode = 'P0001', hint = 'not_legacy';
  end if;
  if v_day is null or v_day > v_today or v_day < date '1900-01-01' then
    raise exception 'a real SECP or FBR date is needed' using errcode = 'P0001', hint = 'date';
  end if;
  if m.since is not null then
    if private.staff_level('reg') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
    if coalesce(length(btrim(p_reason)), 0) < 3 then
      raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
    end if;
  end if;
  perform private.set_reason(coalesce('enrollment date: ' || left(nullif(btrim(p_reason), ''), 400),
                                      'enrollment date set from official records'));
  update public.members set since = v_day, secp_incorporated_on = p_secp, fbr_registered_on = p_fbr,
         enrollment_source = case when p_secp is not null and p_secp = v_day then 'secp' else 'fbr' end
   where id = p_member;
  return v_day;
end $$;

-- ───────── change declarations ─────────
-- A member declares a change at any time, or at renewal, with the documents. Reviewed by chg ≥ 3; on approval the
-- listed fields go to the live profile. Partner changes are recorded with the deed: the partner list belongs to the
-- application, so the reviewer sees them in the declaration and History.
create table public.change_declarations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  member_id uuid references public.members on delete cascade,
  context text not null default 'anytime' check (context in ('anytime', 'renewal')),
  summary text not null check (length(summary) between 3 and 2000),
  fields jsonb not null default '[]'::jsonb check (jsonb_typeof(fields) = 'array'),
  documents jsonb not null default '[]'::jsonb check (jsonb_typeof(documents) = 'array'),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  requested_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  decided_by uuid references public.profiles on delete set null,
  decided_at timestamptz,
  decision_note text check (decision_note is null or length(decision_note) <= 1000)
);
create index change_declarations_status on public.change_declarations (status, created_at);
create index change_declarations_company on public.change_declarations (company_id, created_at desc);
alter table public.change_declarations enable row level security;
grant select on public.change_declarations to authenticated;
create policy change_declarations_select on public.change_declarations for select to authenticated
  using (company_id in (select private.my_company_ids())
         or (select private.staff_level('chg')) >= 1 or (select private.staff_level('reg')) >= 1);
create trigger audit_row after insert or update or delete on public.change_declarations
  for each row execute function private.audit_row();

create function private.declaration_fields() returns text[]
  language sql immutable set search_path = ''
  as $$ select array['name','address','tel','fax','email','web','ntn','gst','nature_sector','particulars','rep_name'] $$;
revoke all on function private.declaration_fields() from public, anon, authenticated, service_role;

-- each document must be in this company's folder of the private member-docs bucket
create function private.member_docs_ok(p_company uuid, p_folder text, p_docs jsonb) returns boolean
  language sql immutable set search_path = ''
  as $$
    select jsonb_typeof(p_docs) = 'array' and not exists (
      select 1 from jsonb_array_elements(p_docs) d
       where d ->> 'path' is null or d ->> 'path' like '%..%'
          or d ->> 'path' not like p_company::text || '/' || p_folder || '/%')
  $$;
revoke all on function private.member_docs_ok(uuid, text, jsonb) from public, anon, authenticated, service_role;

create function api.declaration_submit(p_company uuid, p_context text, p_summary text, p_fields jsonb, p_docs jsonb) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_id uuid;
  v_fields jsonb := '[]'::jsonb;
  f jsonb;
  c public.companies;
  v_member public.members;
  v_old text;
begin
  if auth.uid() is null or (private.company_level(p_company, 'profile') < 3 and private.staff_level('reg') < 2) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_context not in ('anytime', 'renewal') or coalesce(length(btrim(p_summary)), 0) < 3 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  if not private.member_docs_ok(p_company, 'declarations', coalesce(p_docs, '[]'::jsonb)) or jsonb_array_length(coalesce(p_docs, '[]'::jsonb)) = 0 then
    raise exception 'the supporting document is needed' using errcode = 'P0001', hint = 'documents';
  end if;
  select * into c from public.companies x where x.id = p_company;
  select * into v_member from public.members x where x.company_id = p_company order by x.created_at desc limit 1;
  for f in select * from jsonb_array_elements(coalesce(p_fields, '[]'::jsonb)) loop
    if f ->> 'field' is null or not ((f ->> 'field') = any (private.declaration_fields()))
       or coalesce(length(btrim(f ->> 'value')), 0) not between 1 and 2000 then
      raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
    end if;
    v_old := case f ->> 'field'
      when 'name' then c.name when 'address' then c.address when 'tel' then c.tel when 'fax' then c.fax
      when 'email' then c.email::text when 'web' then c.web when 'ntn' then c.ntn when 'gst' then c.gst
      when 'nature_sector' then c.nature_sector when 'particulars' then c.particulars
      when 'rep_name' then v_member.rep_name end;
    v_fields := v_fields || jsonb_build_object('field', f ->> 'field', 'old', v_old, 'new', btrim(f ->> 'value'));
  end loop;
  perform private.set_reason('change declared: ' || left(btrim(p_summary), 400));
  insert into public.change_declarations (company_id, member_id, context, summary, fields, documents)
  values (p_company, v_member.id, p_context, btrim(p_summary), v_fields, p_docs)
  returning id into v_id;
  return v_id;
end $$;

create function api.declaration_decide(p_id uuid, p_approve boolean, p_note text default null) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  d public.change_declarations;
  f jsonb;
  v text;
begin
  if auth.uid() is null or private.staff_level('chg') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into d from public.change_declarations x where x.id = p_id for update;
  if d.id is null then raise exception 'not found' using errcode = 'P0001', hint = 'not_found'; end if;
  if d.status <> 'Pending' then raise exception 'already decided' using errcode = 'P0001', hint = 'decided'; end if;
  if not p_approve and coalesce(length(btrim(p_note)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason(case when p_approve then 'change declaration approved' else 'change declaration rejected: ' || left(btrim(p_note), 400) end);
  if p_approve then
    for f in select * from jsonb_array_elements(d.fields) loop
      v := f ->> 'new';
      case f ->> 'field'
        when 'name' then update public.companies set name = v where id = d.company_id;
        when 'address' then update public.companies set address = v where id = d.company_id;
        when 'tel' then update public.companies set tel = v where id = d.company_id;
        when 'fax' then update public.companies set fax = v where id = d.company_id;
        when 'email' then update public.companies set email = private.email_or_null(v) where id = d.company_id;
        when 'web' then update public.companies set web = v where id = d.company_id;
        when 'ntn' then update public.companies set ntn = v where id = d.company_id;
        when 'gst' then update public.companies set gst = v where id = d.company_id;
        when 'nature_sector' then update public.companies set nature_sector = v where id = d.company_id;
        when 'particulars' then update public.companies set particulars = v where id = d.company_id;
        when 'rep_name' then update public.members set rep_name = v where company_id = d.company_id;
      end case;
    end loop;
  end if;
  update public.change_declarations
     set status = case when p_approve then 'Approved' else 'Rejected' end, decided_by = auth.uid(), decided_at = now(),
         decision_note = nullif(left(btrim(coalesce(p_note, '')), 1000), '')
   where id = p_id;
  perform private.company_notify_t(d.company_id, 'mship', case when p_approve then 'declaration.approved' else 'declaration.rejected' end,
    jsonb_build_object('note', coalesce(nullif(btrim(p_note), ''), '')),
    case when p_approve then 'Your change declaration is approved' else 'Your change declaration was not approved' end,
    case when p_approve then 'MCCI verified your documents and updated your company profile.' else left(btrim(p_note), 1000) end, '/portal/profile');
end $$;

-- ───────── renewal and restoration requests ─────────
create table public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members on delete cascade,
  kind text not null check (kind in ('renewal', 'restoration')),
  voucher_no text,
  valid_from date,
  valid_to date,
  no_change boolean,
  declaration_id uuid references public.change_declarations on delete set null,
  documents jsonb not null default '[]'::jsonb,
  arrears jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open', 'paid', 'cancelled')),
  reason text,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index membership_requests_member on public.membership_requests (member_id, created_at desc);
alter table public.membership_requests enable row level security;
grant select on public.membership_requests to authenticated;
create policy membership_requests_select on public.membership_requests for select to authenticated
  using ((select private.staff_level('reg')) >= 1
         or member_id in (select m.id from public.members m where m.company_id in (select private.my_company_ids())));
create trigger audit_row after insert or update or delete on public.membership_requests
  for each row execute function private.audit_row();

alter table public.payment_vouchers drop constraint payment_vouchers_ref_type_check;
alter table public.payment_vouchers add constraint payment_vouchers_ref_type_check
  check (ref_type in ('membership', 'renewal', 'restoration', 'service', 'extra_card'));

-- the renewal season: members start their own renewal from this date; staff can at any time
create function api.renewal_opens_on() returns date
  language sql stable security definer set search_path = ''
  as $$ select (s.value ->> 'opensOn')::date from private.settings s where s.key = 'renewal' and auth.uid() is not null $$;

create function api.renewal_opens_save(p_day date, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('reg') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_day is null then raise exception 'date' using errcode = 'P0001', hint = 'date'; end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason('renewals open from ' || p_day || ': ' || left(btrim(p_reason), 400));
  update private.settings set value = value || jsonb_build_object('opensOn', p_day), updated_at = now() where key = 'renewal';
end $$;

-- Renewal: the period is proposed (the day after the last period, to the next 31 March) and editable, because the
-- Secretary may start it earlier under a DGTO order or a gazette notification. A changed period needs a reason and the
-- person's approval level stays staff; members take the proposed period. The declaration is required either way.
drop function api.member_renew_start(uuid);
create function api.member_renew_start(p_member uuid, p_from date default null, p_to date default null,
                                       p_no_change boolean default null, p_declaration uuid default null,
                                       p_reason text default null) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.members;
  v_fee jsonb;
  v_no text;
  v_days int := coalesce((select (s.value ->> 'dueDays')::int from private.settings s where s.key = 'voucher'), 7);
  v_today date := (now() at time zone 'Asia/Karachi')::date;
  v_staff boolean := private.staff_level('reg') >= 2;
  v_from date;
  v_to date;
  v_default_to date;
begin
  if auth.uid() is null then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into m from public.members x where x.id = p_member for update;
  if m.id is null then
    if v_staff then raise exception 'member not found' using errcode = 'P0001', hint = 'not_found'; end if;
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not v_staff then
    if private.company_level(m.company_id, 'mship') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
    if p_from is not null or p_to is not null then raise exception 'not allowed' using errcode = '42501'; end if;
    if m.valid_to >= v_today and v_today < coalesce((select (s.value ->> 'opensOn')::date from private.settings s where s.key = 'renewal'), v_today) then
      raise exception 'renewals are not open yet' using errcode = 'P0001', hint = 'not_open';
    end if;
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
  if m.valid_to > private.year_end_of(v_today) then
    raise exception 'this membership year is already renewed' using errcode = 'P0001', hint = 'already_renewed';
  end if;
  if exists (select 1 from public.payment_vouchers v where v.ref_type = 'renewal' and v.ref_id = p_member
             and v.status in ('Unpaid', 'Receipt uploaded')) then
    raise exception 'a renewal voucher is already open' using errcode = 'P0001', hint = 'open_voucher';
  end if;
  if p_no_change is not true and p_declaration is null then
    raise exception 'declare any change, or that there is none' using errcode = 'P0001', hint = 'declaration';
  end if;
  if p_declaration is not null and not exists (select 1 from public.change_declarations d where d.id = p_declaration and d.company_id = m.company_id) then
    raise exception 'not this company''s declaration' using errcode = 'P0001', hint = 'declaration';
  end if;
  v_from := coalesce(p_from, m.valid_to + 1);
  v_default_to := private.year_end_of(greatest(m.valid_to + 1, v_today));
  v_to := coalesce(p_to, v_default_to);
  if v_to <= v_from or v_to - v_from > 1100 then
    raise exception 'check the period' using errcode = 'P0001', hint = 'period';
  end if;
  if (v_from <> m.valid_to + 1 or v_to <> v_default_to) and coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a changed period needs its reason' using errcode = 'P0001', hint = 'reason_required';
  end if;
  v_fee := private.renewal_fee(p_member);
  perform private.set_reason(coalesce('renewal: ' || left(nullif(btrim(p_reason), ''), 400), 'renewal voucher issued for ' || m.member_no));
  update public.membership_requests set status = 'cancelled' where member_id = p_member and kind = 'renewal' and status = 'open';
  insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at)
  values (m.company_id, 'renewal', p_member, v_fee -> 'lines', (v_fee ->> 'total')::int, now() + make_interval(days => v_days))
  returning voucher_no into v_no;
  insert into public.membership_requests (member_id, kind, voucher_no, valid_from, valid_to, no_change, declaration_id, reason)
  values (p_member, 'renewal', v_no, v_from, v_to, p_no_change is true and p_declaration is null, p_declaration, nullif(btrim(coalesce(p_reason, '')), ''));
  perform private.company_notify_t(m.company_id, 'pay', 'renewal.voucher',
    jsonb_build_object('no', m.member_no, 'voucher', v_no, 'amount', v_fee ->> 'total'),
    'Renewal voucher ' || v_no, 'Your membership renewal voucher ' || v_no || ' is in Payments.', null);
  return v_no;
end $$;

-- a renewal that declares a change: both in one transaction, so a refused renewal leaves no stray declaration behind
create function api.member_renew_declared(p_member uuid, p_company uuid, p_summary text, p_fields jsonb, p_docs jsonb,
                                          p_from date default null, p_to date default null, p_reason text default null) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_declaration uuid;
begin
  if not exists (select 1 from public.members m where m.id = p_member and m.company_id = p_company) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_declaration := api.declaration_submit(p_company, 'renewal', p_summary, p_fields, p_docs);
  return api.member_renew_start(p_member, p_from, p_to, false, v_declaration, p_reason);
end $$;

create or replace function private.renewal_paid(p_voucher uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
  m public.members;
  q public.membership_requests;
  v_until date;
begin
  select * into v from public.payment_vouchers x where x.id = p_voucher;
  select * into m from public.members x where x.id = v.ref_id for update;
  select * into q from public.membership_requests x where x.member_id = m.id and x.kind = 'renewal' and x.status = 'open'
   order by x.created_at desc limit 1;
  v_until := coalesce(q.valid_to, private.year_end_of(greatest(m.valid_to + 1, (now() at time zone 'Asia/Karachi')::date)));
  update public.members set status = 'Permanent', valid_to = v_until, valid_from = coalesce(q.valid_from, m.valid_to + 1) where id = m.id;
  if q.id is not null then
    update public.membership_requests set status = 'paid', paid_at = now(), voucher_no = v.voucher_no where id = q.id;
  end if;
  perform private.company_notify_t(m.company_id, 'mship', 'renewal.done',
    jsonb_build_object('no', m.member_no, 'until', to_char(v_until, 'DD Mon YYYY')),
    'Membership renewed', 'Your membership ' || m.member_no || ' is renewed until ' || to_char(v_until, 'DD Mon YYYY') || '.', null);
end $$;

-- Restoration: every unpaid membership year's subscription, from the year after the last valid one to the current one.
-- TODO(MCCI): the current subscription is used for past years; say if old years were charged at old rates.
create function private.restore_lines(p_member uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  m public.members;
  v_fee int;
  v_end date;
  v_last date := private.year_end_of((now() at time zone 'Asia/Karachi')::date);
  v_lines jsonb := '[]'::jsonb;
begin
  select * into m from public.members x where x.id = p_member;
  v_fee := (private.renewal_fee(p_member) ->> 'total')::int;
  v_end := private.year_end_of(m.valid_to + 1);
  while v_end <= v_last loop
    v_lines := v_lines || jsonb_build_object('key', 'subscription',
      'label', 'Annual subscription ' || (extract(year from v_end)::int - 1) || '-' || to_char(v_end, 'YY'), 'amount', v_fee);
    v_end := (v_end + interval '1 year')::date;
  end loop;
  return v_lines;
end $$;
revoke all on function private.restore_lines(uuid) from public, anon, authenticated, service_role;

create function api.member_restore_quote(p_member uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  m public.members;
  v_lines jsonb;
begin
  select * into m from public.members x where x.id = p_member;
  if auth.uid() is null or m.id is null or (private.staff_level('reg') < 1 and private.company_level(m.company_id, 'mship') < 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_lines := private.restore_lines(p_member);
  return jsonb_build_object('lines', v_lines,
    'total', (select coalesce(sum((l ->> 'amount')::int), 0) from jsonb_array_elements(v_lines) l),
    'since', m.since, 'until', private.year_end_of((now() at time zone 'Asia/Karachi')::date));
end $$;

-- returns the voucher number, or null when no dues remain and the member is restored at once
create function api.member_restore_start(p_member uuid, p_docs jsonb, p_reason text default null) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.members;
  v_lines jsonb;
  v_total int;
  v_no text;
  v_days int := coalesce((select (s.value ->> 'dueDays')::int from private.settings s where s.key = 'voucher'), 7);
  v_today date := (now() at time zone 'Asia/Karachi')::date;
begin
  if auth.uid() is null then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into m from public.members x where x.id = p_member for update;
  if m.id is null or (private.staff_level('reg') < 2 and private.company_level(m.company_id, 'mship') < 2) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if private.company_is_demo(m.company_id) then
    raise exception 'demo members are not restored' using errcode = 'P0001', hint = 'demo';
  end if;
  if m.status = 'Permanent' and m.valid_to >= v_today then
    raise exception 'this membership is active' using errcode = 'P0001', hint = 'wrong_status';
  end if;
  if m.blacklisted then
    raise exception 'blacklisted: record the whitelisting first' using errcode = 'P0001', hint = 'not_whitelisted';
  end if;
  if not private.member_docs_ok(m.company_id, 'taxreturns', coalesce(p_docs, '[]'::jsonb)) or jsonb_array_length(coalesce(p_docs, '[]'::jsonb)) = 0 then
    raise exception 'tax returns are needed' using errcode = 'P0001', hint = 'documents';
  end if;
  if exists (select 1 from public.payment_vouchers v where v.ref_type = 'restoration' and v.ref_id = p_member
             and v.status in ('Unpaid', 'Receipt uploaded')) then
    raise exception 'a restoration voucher is already open' using errcode = 'P0001', hint = 'open_voucher';
  end if;
  v_lines := private.restore_lines(p_member);
  v_total := (select coalesce(sum((l ->> 'amount')::int), 0) from jsonb_array_elements(v_lines) l);
  perform private.set_reason(coalesce('restoration: ' || left(nullif(btrim(p_reason), ''), 400), 'restoration requested for ' || m.member_no));
  update public.membership_requests set status = 'cancelled' where member_id = p_member and kind = 'restoration' and status = 'open';
  if v_total = 0 then
    insert into public.membership_requests (member_id, kind, valid_from, valid_to, documents, arrears, status, reason, paid_at)
    values (p_member, 'restoration', v_today, m.valid_to, p_docs, '[]'::jsonb, 'paid', nullif(btrim(coalesce(p_reason, '')), ''), now());
    update public.members set status = 'Permanent', restored_at = now(), suspended_reason = null where id = p_member;
    return null;
  end if;
  insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at)
  values (m.company_id, 'restoration', p_member, v_lines, v_total, now() + make_interval(days => v_days))
  returning voucher_no into v_no;
  insert into public.membership_requests (member_id, kind, voucher_no, valid_from, valid_to, documents, arrears, reason)
  values (p_member, 'restoration', v_no, m.valid_to + 1, private.year_end_of(v_today), p_docs, v_lines, nullif(btrim(coalesce(p_reason, '')), ''));
  perform private.company_notify_t(m.company_id, 'pay', 'restoration.voucher',
    jsonb_build_object('no', m.member_no, 'voucher', v_no, 'amount', v_total::text),
    'Restoration voucher ' || v_no, 'Your membership restoration voucher ' || v_no || ' is in Payments.', null);
  return v_no;
end $$;

-- the enrollment date is never touched: only the validity and the date of restoration change
create function private.restoration_paid(p_voucher uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v public.payment_vouchers;
  m public.members;
  q public.membership_requests;
  v_until date := private.year_end_of((now() at time zone 'Asia/Karachi')::date);
begin
  select * into v from public.payment_vouchers x where x.id = p_voucher;
  select * into m from public.members x where x.id = v.ref_id for update;
  select * into q from public.membership_requests x where x.member_id = m.id and x.kind = 'restoration' and x.status = 'open'
   order by x.created_at desc limit 1;
  perform private.set_reason('restored after paying ' || v.voucher_no);
  update public.members set status = 'Permanent', valid_from = (now() at time zone 'Asia/Karachi')::date, valid_to = v_until,
         restored_at = now(), suspended_reason = null
   where id = m.id;
  if q.id is not null then
    update public.membership_requests set status = 'paid', paid_at = now(), voucher_no = v.voucher_no where id = q.id;
  end if;
  perform private.company_notify_t(m.company_id, 'mship', 'restoration.done',
    jsonb_build_object('no', m.member_no, 'until', to_char(v_until, 'DD Mon YYYY')),
    'Membership restored', 'Your membership ' || m.member_no || ' is restored until ' || to_char(v_until, 'DD Mon YYYY') || '. Your date of enrollment is unchanged.', null);
end $$;
revoke all on function private.restoration_paid(uuid) from public, anon, authenticated, service_role;

do $$
begin
  execute replace(pg_get_functiondef('private.voucher_paid(uuid)'::regprocedure),
    'if v.ref_type = ''service'' then',
    'if v.ref_type = ''restoration'' then
    perform private.restoration_paid(p_voucher);
  end if;
  if v.ref_type = ''service'' then');
end $$;

-- the old restoration by hand is replaced: dues and tax returns now go through a voucher (owner, 1 Nov 2026)
revoke execute on function api.member_restore(uuid, text) from authenticated;

-- ───────── voter list ─────────
-- Null means eligible; otherwise the reason. Dates are compared with the cutoff, the day the election schedule is
-- announced: enrolled exactly minYears before it counts, a day later does not (owner's example: enrolled 14 Jul 2026,
-- announced 13 Jul 2028, not eligible). For a cutoff in the future, validity is judged as of today.
-- TODO(MCCI): "continuous" is read as: no restoration inside the period. Renewal history before this release is not
-- in the system, so a past gap of a legacy member that was never recorded as a lapse cannot be seen.
create function private.voter_reason(m public.members, p_cutoff date) returns text
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  s jsonb := coalesce((select x.value from private.settings x where x.key = 'voter'), '{}'::jsonb);
  v_years int := coalesce((s ->> 'minYears')::int, 2);
  v_restored int := coalesce((s ->> 'restoredYears')::int, 1);
  v_today date := (now() at time zone 'Asia/Karachi')::date;
begin
  if m.since is null then return 'no_date'; end if;
  if m.status in ('Suspended', 'Revoked') then return 'not_active'; end if;
  if m.valid_to < least(p_cutoff, v_today) then return 'lapsed'; end if;
  if (s ->> 'excludeBlacklisted')::boolean is true and m.blacklisted then return 'blacklisted'; end if;
  if m.since > (p_cutoff - make_interval(years => v_years))::date then return 'too_new'; end if;
  if m.restored_at is not null
     and (m.restored_at at time zone 'Asia/Karachi')::date > (p_cutoff - make_interval(years => v_restored))::date then
    return 'restored_recently';
  end if;
  return null;
end $$;
revoke all on function private.voter_reason(public.members, date) from public, anon, authenticated, service_role;

create function api.voter_list(p_cutoff date, p_class text default null)
  returns table (member_id uuid, member_no text, company text, class text, women boolean, rep_name text, since date,
                 enrollment_source text, valid_to date, restored_at timestamptz, blacklisted boolean, status text, reason text)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('vot') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_cutoff is null then raise exception 'date' using errcode = 'P0001', hint = 'date'; end if;
  return query
    select m.id, m.member_no, c.name, m.class::text, m.women, m.rep_name, m.since, m.enrollment_source, m.valid_to,
           m.restored_at, m.blacklisted, m.status::text, private.voter_reason(m, p_cutoff)
      from public.members m join public.companies c on c.id = m.company_id
     where not c.demo and (p_class is null or m.class::text = p_class)
     order by m.member_no;
end $$;

create table public.voter_list_exports (
  id bigint generated always as identity primary key,
  cutoff date not null,
  class text,
  result text not null,
  row_count int not null,
  exported_by uuid default auth.uid() references public.profiles on delete set null,
  at timestamptz not null default now()
);
alter table public.voter_list_exports enable row level security;
grant select on public.voter_list_exports to authenticated;
create policy voter_list_exports_select on public.voter_list_exports for select to authenticated
  using ((select private.staff_level('vot')) >= 1);
create trigger audit_row after insert or update or delete on public.voter_list_exports
  for each row execute function private.audit_row();

create function api.voter_export_log(p_cutoff date, p_class text, p_result text, p_count int) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('vot') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('voter list exported');
  insert into public.voter_list_exports (cutoff, class, result, row_count) values (p_cutoff, p_class, p_result, p_count);
end $$;

-- ───────── staff read the new private buckets through the logged file route (0460) ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('member-docs', 'member-docs', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

do $$
begin
  execute replace(replace(pg_get_functiondef('api.file_access(text,text,text)'::regprocedure),
    '''service-docs'', ''form-snapshots'')', '''service-docs'', ''form-snapshots'', ''member-docs'')'),
    'when p_bucket = ''service-docs'' then private.staff_level(''svc'') >= 1',
    'when p_bucket = ''service-docs'' then private.staff_level(''svc'') >= 1
    when p_bucket = ''member-docs'' then private.staff_level(''reg'') >= 1 or private.staff_level(''chg'') >= 1');
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'api.member_enrollment_set(uuid,date,date,text)',
    'api.declaration_submit(uuid,text,text,jsonb,jsonb)', 'api.declaration_decide(uuid,boolean,text)',
    'api.renewal_opens_on()', 'api.renewal_opens_save(date,text)',
    'api.member_renew_start(uuid,date,date,boolean,uuid,text)',
    'api.member_renew_declared(uuid,uuid,text,jsonb,jsonb,date,date,text)',
    'api.member_restore_quote(uuid)', 'api.member_restore_start(uuid,jsonb,text)',
    'api.voter_list(date,text)', 'api.voter_export_log(date,text,text,int)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
