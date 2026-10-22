-- 0230 · storage buckets and object policies (docs/01 "Storage buckets", docs/08 upload pipeline)
-- Finding F-18: the draft defined no storage policies. Path convention (docs/01):
--   {company_id}/{entity}/{entity_id}/{uuid}.{ext}
-- The first segment is the owning company; policies check it plus the state of the entity in segment 3.
-- Clients never update or delete objects: a replacement is a new object (the old one stays as evidence).
-- storage.buckets / storage.objects are created by the Storage service before this migration runs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('application-docs', 'application-docs', false, 10485760, array['application/pdf','image/jpeg','image/png','image/heic']),
  ('form-snapshots',   'form-snapshots',   false, 10485760, array['application/pdf']),
  ('receipts',         'receipts',         false, 10485760, array['application/pdf','image/jpeg','image/png','image/heic']),
  ('certificates',     'certificates',     false, 10485760, array['application/pdf','image/jpeg','image/png']),
  ('service-docs',     'service-docs',     false, 10485760, array['application/pdf','image/jpeg','image/png','image/heic']),
  ('imports',          'imports',          false, 10485760, array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv']),
  ('cms',              'cms',              true,  5242880,  array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

-- path helpers (NULL instead of an error for malformed paths, so a bad path simply matches nothing)
create function private.path_company(p_name text) returns uuid
  language plpgsql immutable set search_path = ''
  as $$ begin return split_part(p_name, '/', 1)::uuid; exception when others then return null; end $$;
create function private.path_entity(p_name text) returns text
  language sql immutable set search_path = ''
  as $$ select nullif(split_part(p_name, '/', 2), '') $$;
create function private.path_entity_id(p_name text) returns uuid
  language plpgsql immutable set search_path = ''
  as $$ begin return split_part(p_name, '/', 3)::uuid; exception when others then return null; end $$;
grant execute on function private.path_company(text), private.path_entity(text), private.path_entity_id(text) to authenticated, service_role;

-- voucher of my company that may receive a receipt (Unpaid / Rejected) — mirrors docs/03 §3
create function private.voucher_accepts_receipt(p_voucher uuid, p_company uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.payment_vouchers v
                   where v.id = p_voucher and v.company_id = p_company and v.status in ('Unpaid','Rejected'))
  $$;
grant execute on function private.voucher_accepts_receipt(uuid, uuid) to authenticated, service_role;

-- application-docs: applicant company reads; uploads while the application is draft/returned; staff mem >= 1 read.
-- Endorsers have no branch here (docs/04 AC 6).
create policy app_docs_read on storage.objects for select to authenticated using (
  bucket_id = 'application-docs' and (
    (private.path_entity(name) = 'applications' and private.path_entity_id(name) in (select private.my_app_ids())
       and private.path_company(name) in (select private.my_company_ids()))
    or (select private.staff_level('mem')) >= 1));
create policy app_docs_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'application-docs' and private.path_entity(name) = 'applications'
  and private.path_company(name) in (select private.my_company_ids())
  and private.path_entity_id(name) in (select private.my_app_ids())
  and private.app_editable(private.path_entity_id(name)));

-- form-snapshots: written by the trusted PDF handler only
create policy snapshots_read on storage.objects for select to authenticated using (
  bucket_id = 'form-snapshots' and (
    (private.path_company(name) in (select private.my_company_ids()) and private.path_entity_id(name) in (select private.my_app_ids()))
    or (select private.staff_level('mem')) >= 1));

-- receipts: company users with pay access read; Owner/Manager/Accounts (pay >= 2) upload against an open voucher
create policy receipts_read on storage.objects for select to authenticated using (
  bucket_id = 'receipts' and (
    private.company_level(private.path_company(name), 'pay') >= 1 or (select private.staff_level('pay')) >= 1));
create policy receipts_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'receipts' and private.path_entity(name) = 'vouchers'
  and private.company_level(private.path_company(name), 'pay') >= 2
  and private.voucher_accepts_receipt(private.path_entity_id(name), private.path_company(name)));

-- certificates: member company reads (docs >= 1); staff temp >= 1 read; printed-certificate scans by staff temp >= 2
create policy certificates_read on storage.objects for select to authenticated using (
  bucket_id = 'certificates' and (
    private.company_level(private.path_company(name), 'docs') >= 1 or (select private.staff_level('temp')) >= 1));
create policy certificates_scan_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'certificates' and private.path_entity(name) = 'scans' and (select private.staff_level('temp')) >= 2);

-- service-docs: company svc >= 1 read; uploads while the request is Submitted/Returned; staff svc >= 1 read
create policy service_docs_read on storage.objects for select to authenticated using (
  bucket_id = 'service-docs' and (
    private.company_level(private.path_company(name), 'svc') >= 1 or (select private.staff_level('svc')) >= 1));
create policy service_docs_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'service-docs' and private.path_entity(name) = 'requests'
  and private.path_company(name) in (select private.my_company_ids())
  and private.svc_editable(private.path_entity_id(name)));

-- imports: staff with members-register edit
create policy imports_read on storage.objects for select to authenticated using (
  bucket_id = 'imports' and (select private.staff_level('reg')) >= 2);
create policy imports_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'imports' and (select private.staff_level('reg')) >= 2);

-- cms: public bucket (published site images); uploads by staff eng >= 2
create policy cms_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'cms' and (select private.staff_level('eng')) >= 2);
