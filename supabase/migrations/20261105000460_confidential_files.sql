-- 0460 · Confidential documents and the register (owner's list of 28 Oct 2026: "no documents or any confidential data
-- will be downloaded and sent to anyone by the Membership Officer; only the IT Convener"; docs/21 §1 point 3,
-- docs/22 §4). Release R5.
--
-- • Storage: staff no longer read confidential files from storage directly (no signed URL, no storage API). Only the
--   IT Convener does. Members keep reading their own company's files (unchanged branches).
-- • Staff who need to SEE a document for their work (Membership Officer: application documents; Accounts: receipts;
--   Services: service documents) see it through the app's file route, which asks api.file_access first: every view
--   is logged (who, what, when), images are shown watermarked with the viewer's name and time, and the original file
--   (download) is given only to the IT Convener. A screen can still be photographed — that is outside any system;
--   the log and the watermark make every view traceable.
-- • The members register export (CSV) is the IT Convener's only (api.register_export), and logged.

create function private.is_it_convener() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select private.my_designation() = 'IT Convener' and private.staff_level('plat') >= 1 $$;
revoke all on function private.is_it_convener() from public, anon, authenticated, service_role;
grant execute on function private.is_it_convener() to authenticated;   -- used inside storage policies

create table public.file_access_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid references public.profiles on delete set null,
  designation text,
  bucket text not null,
  path text not null,
  mode text not null check (mode in ('view', 'download', 'export')),
  allowed boolean not null
);
create index file_access_log_at on public.file_access_log (at desc);
create index file_access_log_path on public.file_access_log (bucket, path);
alter table public.file_access_log enable row level security;
grant select on public.file_access_log to authenticated;
-- the SG and the IT Convener read the log (staff & audit); nobody writes it directly
create policy file_access_log_select on public.file_access_log for select to authenticated
  using ((select private.staff_level('staff')) >= 1 or (select private.is_it_convener()));

-- ───────── storage: staff branches → IT Convener only ─────────
drop policy if exists app_docs_read on storage.objects;
create policy app_docs_read on storage.objects for select to authenticated using (
  bucket_id = 'application-docs' and (
    (private.path_entity(name) = 'applications' and private.path_entity_id(name) in (select private.my_app_ids())
       and private.path_company(name) in (select private.my_company_ids()))
    or (select private.is_it_convener())));
drop policy if exists snapshots_read on storage.objects;
create policy snapshots_read on storage.objects for select to authenticated using (
  bucket_id = 'form-snapshots' and (
    (private.path_company(name) in (select private.my_company_ids()) and private.path_entity_id(name) in (select private.my_app_ids()))
    or (select private.is_it_convener())));
drop policy if exists receipts_read on storage.objects;
create policy receipts_read on storage.objects for select to authenticated using (
  bucket_id = 'receipts' and (
    private.company_level(private.path_company(name), 'pay') >= 1 or (select private.is_it_convener())));
drop policy if exists service_docs_read on storage.objects;
create policy service_docs_read on storage.objects for select to authenticated using (
  bucket_id = 'service-docs' and (
    private.company_level(private.path_company(name), 'svc') >= 1 or (select private.is_it_convener())));
drop policy if exists imports_read on storage.objects;
create policy imports_read on storage.objects for select to authenticated using (
  bucket_id = 'imports' and (select private.is_it_convener()));

-- ───────── the app's file route asks here first ─────────
-- view: the staff member's work needs it (application documents mem ≥ 1, receipts pay ≥ 1, service documents
-- svc ≥ 1); download (the original file): the IT Convener only. Every call is logged, allowed or not.
create function api.file_access(p_bucket text, p_path text, p_mode text) returns boolean
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_ok boolean;
begin
  if auth.uid() is null or p_mode not in ('view', 'download') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  -- the path must be a stored file of a known kind (no traversal, no other buckets)
  if p_bucket not in ('application-docs', 'receipts', 'service-docs', 'form-snapshots') or p_path !~ '^[0-9a-f-]{36}/[a-z]+/[0-9a-f-]{36}/[A-Za-z0-9._/-]{1,200}$'
     or p_path like '%..%' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_ok := case
    when private.is_it_convener() then true
    when p_mode = 'download' then false
    when p_bucket in ('application-docs', 'form-snapshots') then private.staff_level('mem') >= 1
    when p_bucket = 'receipts' then private.staff_level('pay') >= 1
    when p_bucket = 'service-docs' then private.staff_level('svc') >= 1
    else false end;
  insert into public.file_access_log (user_id, designation, bucket, path, mode, allowed)
  values (auth.uid(), private.my_designation(), p_bucket, p_path, p_mode, v_ok);
  return v_ok;
end $$;

-- ───────── committee notes: the committee's internal work ─────────
-- (0430 already hides them from the applicant) — among staff only the approved committee and staff with Membership
-- Committee access read them; the membership desk (mem ≥ 1) reads the rest of the file's history
create function private.can_read_committee_notes() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select private.staff_level('cmt') >= 1 or private.is_committee_member() $$;
revoke all on function private.can_read_committee_notes() from public, anon, authenticated, service_role;
grant execute on function private.can_read_committee_notes() to authenticated;
drop policy app_history_select on public.application_history;
create policy app_history_select on public.application_history for select to authenticated
  using ((application_id in (select private.my_app_ids()) and step not in ('committee note', 'returned to officer'))
         or ((select private.staff_level('mem')) >= 1 and (step <> 'committee note' or (select private.can_read_committee_notes()))));

-- ───────── the register export: IT Convener only ─────────
create function api.register_export()
  returns table (member_no text, company text, class text, women boolean, status text, rep_name text, since date,
                 valid_to date, ntn text, gst text, address text, tel text, email text, sector text, blacklisted boolean)
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  -- refused: logged and nothing returned (an error would roll the log entry back)
  if auth.uid() is null or not private.is_it_convener() then
    insert into public.file_access_log (user_id, designation, bucket, path, mode, allowed)
    values (auth.uid(), private.my_designation(), 'register', 'members', 'export', false);
    return;
  end if;
  insert into public.file_access_log (user_id, designation, bucket, path, mode, allowed)
  values (auth.uid(), private.my_designation(), 'register', 'members', 'export', true);
  perform private.set_reason('members register exported');
  return query
    select m.member_no, c.name, m.class::text, m.women, m.status::text, m.rep_name, m.since, m.valid_to,
           c.ntn, c.gst, c.address, c.tel, c.email::text, c.nature_sector, m.blacklisted
      from public.members m join public.companies c on c.id = m.company_id
     where not c.demo
     order by m.member_no;
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.file_access(text,text,text)', 'api.register_export()'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
