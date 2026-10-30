-- 0520 · Public membership verification (owner, 30 Oct 2026; docs/26).
--
-- Anyone may check a certificate (its QR / reference) or a membership number on the public website. The answer is a
-- purpose-built minimal projection — business name, membership number, category, class, membership status and period,
-- certificate status and reference, date of the check — never a member or company row, never an address, phone,
-- email, CNIC, document, storage path, internal id or link. Demo records never verify (they are not official).
--
--   api.public_verify_code(reference, channel, client)  by certificate reference ('qr' signed link or 'code' typed)
--   api.public_verify_member(member_no, client)         by membership number (current certificate status included)
--   api.public_verify_log(channel, outcome, client)     refusals decided before the database (bad format, bad signature)
-- All three are for the server only (service role, behind per-address rate limits in lib/verify/admin). Every check is
-- recorded in verify_attempts (client = a hash of the address, never the address itself) for abuse monitoring; staff
-- with Reports ≥ 1 and the IT Convener read it.

create table public.verify_attempts (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  channel text not null check (channel in ('qr', 'code', 'member')),
  outcome text not null check (outcome in ('found', 'none', 'invalid', 'tampered', 'limited')),
  client text check (client is null or length(client) <= 64)
);
create index verify_attempts_at on public.verify_attempts (at desc);
alter table public.verify_attempts enable row level security;
grant select on public.verify_attempts to authenticated;
create policy verify_attempts_select on public.verify_attempts for select to authenticated
  using ((select private.staff_level('rep')) >= 1 or (select private.is_it_convener()));

-- the member's public status: Active while Permanent and within its period; Temporary while a temporary membership is
-- active and not past its expiry (it is a valid membership — prototype "Valid — temporary membership"); otherwise
-- Expired, Suspended or Revoked
create function private.public_member_status(m public.members) returns text
  language sql stable set search_path = ''
  as $$
    select case
      when m.status = 'Permanent' and (m.valid_to is null or m.valid_to >= (now() at time zone 'Asia/Karachi')::date) then 'Active'
      when m.status = 'Permanent' then 'Expired'
      when m.status = 'Temporary' and exists (select 1 from public.temp_memberships t
                                              where t.member_id = m.id and t.status = 'active' and t.expires_at > now())
        then 'Temporary'
      when m.status in ('Temporary', 'TempExpired') then 'Expired'
      else m.status::text end
  $$;

create function private.public_cert_status(d public.documents) returns text
  language sql stable set search_path = ''
  as $$
    select case
      when d.id is null then null
      when d.status in ('Valid', 'Temporary') and d.valid_to is not null
           and d.valid_to < (now() at time zone 'Asia/Karachi')::date then 'Expired'
      else d.status::text end
  $$;

create function api.public_verify_log(p_channel text, p_outcome text, p_client text) returns void
  language sql volatile security definer set search_path = ''
  as $$ insert into public.verify_attempts (channel, outcome, client) values (p_channel, p_outcome, left(p_client, 64)) $$;

create function api.public_verify_code(p_code text, p_channel text, p_client text)
  returns table (business_name text, member_no text, category text, class text, member_status text, member_since date,
                 valid_to date, certificate_status text, certificate_ref text, replaced_by text, checked_on date)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  d public.documents;
  m public.members;
  c public.companies;
begin
  select * into d from public.documents x
   where x.code = upper(btrim(p_code)) and x.kind in ('certificate', 'temp_certificate');
  if d.id is not null then
    select * into c from public.companies x where x.id = d.company_id;
    select * into m from public.members x where x.id = d.member_id;
  end if;
  if d.id is null or c.id is null or c.demo then
    insert into public.verify_attempts (channel, outcome, client) values (p_channel, 'none', left(p_client, 64));
    return;
  end if;
  update public.documents set scans = scans + 1 where id = d.id;
  insert into public.verify_attempts (channel, outcome, client) values (p_channel, 'found', left(p_client, 64));
  return query select c.name, m.member_no,
    case c.manufacturing when true then 'Manufacturing' when false then 'Non-manufacturing' end,
    m.class::text, case when m.id is null then null else private.public_member_status(m) end, m.since, m.valid_to,
    private.public_cert_status(d), d.code,
    (select s.code from public.documents s where s.id = d.superseded_by),
    (now() at time zone 'Asia/Karachi')::date;
end $$;

create function api.public_verify_member(p_no text, p_client text)
  returns table (business_name text, member_no text, category text, class text, member_status text, member_since date,
                 valid_to date, certificate_status text, certificate_ref text, replaced_by text, checked_on date)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.members;
  c public.companies;
  d public.documents;
begin
  select * into m from public.members x where x.member_no = upper(btrim(p_no));
  if m.id is not null then
    select * into c from public.companies x where x.id = m.company_id;
  end if;
  if m.id is null or c.demo then
    insert into public.verify_attempts (channel, outcome, client) values ('member', 'none', left(p_client, 64));
    return;
  end if;
  -- the member's current certificate (not a replaced or revoked one), else the newest
  select * into d from public.documents x
   where x.member_id = m.id and x.kind in ('certificate', 'temp_certificate')
   order by (x.status = 'Valid') desc, x.created_at desc limit 1;
  insert into public.verify_attempts (channel, outcome, client) values ('member', 'found', left(p_client, 64));
  return query select c.name, m.member_no,
    case c.manufacturing when true then 'Manufacturing' when false then 'Non-manufacturing' end,
    m.class::text, private.public_member_status(m), m.since, m.valid_to,
    private.public_cert_status(d), case when d.id is null then null else d.code end, null::text,
    (now() at time zone 'Asia/Karachi')::date;
end $$;

-- the old endpoint (api.doc_verify, 0340) no longer answers for demo records either
create or replace function api.doc_verify(p_code text)
  returns table (code text, title text, kind text, company text, member_no text, status text, valid_to date,
                 superseded_by text, issued date)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  d public.documents;
begin
  select * into d from public.documents x where x.code = upper(btrim(p_code));
  if d.id is null or exists (select 1 from public.companies c where c.id = d.company_id and c.demo) then
    return;
  end if;
  update public.documents set scans = scans + 1 where id = d.id;
  return query
    select d.code, d.title, d.kind::text, c.name, m.member_no, private.public_cert_status(d), d.valid_to,
           (select s.code from public.documents s where s.id = d.superseded_by),
           (d.created_at at time zone 'Asia/Karachi')::date
    from public.documents x
    left join public.companies c on c.id = d.company_id
    left join public.members m on m.id = d.member_id
    where x.id = d.id;
end $$;

revoke all on function private.public_member_status(public.members), private.public_cert_status(public.documents)
  from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array['api.public_verify_log(text,text,text)', 'api.public_verify_code(text,text,text)',
                           'api.public_verify_member(text,text)', 'api.doc_verify(text)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
