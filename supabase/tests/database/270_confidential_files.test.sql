-- Confidential documents and the register (migration 0460): staff never read confidential files from storage directly
-- (only the IT Convener); views go through api.file_access (logged, original download for the IT Convener only); the
-- register export is the IT Convener's only. Negative checks for each restricted role.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(26);

-- the Services Officer persona acts as the IT Convener in this test
update public.staff set designation = 'IT Convener' where user_id = tests.id('so');

-- stored files: an application document of company A, a receipt of company A, a service document of company A
insert into storage.objects (bucket_id, name) values
  ('application-docs', 'a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/cnic.pdf'),
  ('receipts', 'a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000001/r.jpg'),
  ('service-docs', 'a0000000-0000-0000-0000-00000000000a/requests/5e000000-0000-0000-0000-000000000001/x.pdf'),
  ('imports', 'imports/sheet.csv');

-- ───────── storage endpoint (signed URLs / downloads are made from these rows) ─────────
select is(tests.num_as(tests.id('mo'), $$select count(*) from storage.objects where bucket_id = 'application-docs' and name like 'a0000000-%cnic.pdf'$$), 0::bigint, 'Membership Officer: no direct storage read of application documents');
select is(tests.num_as(tests.id('sg'), $$select count(*) from storage.objects where bucket_id = 'application-docs' and name like 'a0000000-%cnic.pdf'$$), 0::bigint, 'Secretary General: none either');
select is(tests.num_as(tests.id('cs'), $$select count(*) from storage.objects where bucket_id = 'application-docs' and name like 'a0000000-%cnic.pdf'$$), 0::bigint, 'committee: none');
select is(tests.num_as(tests.id('accounts_staff'), $$select count(*) from storage.objects where bucket_id = 'receipts' and name like 'a0000000-%r.jpg'$$), 0::bigint, 'Accounts: no direct storage read of receipts');
select is(tests.num_as(tests.id('auditor'), $$select count(*) from storage.objects where bucket_id = 'service-docs' and name like 'a0000000-%x.pdf'$$), 0::bigint, 'Auditor: no direct storage read of service documents');
select is(tests.num_as(tests.id('mo'), $$select count(*) from storage.objects where bucket_id = 'imports'$$), 0::bigint, 'imported register sheets: no direct read');
select is(tests.num_as(tests.id('owner_a'), $$select count(*) from storage.objects where bucket_id = 'application-docs' and name like 'a0000000-%cnic.pdf'$$), 1::bigint, 'the applicant still reads their own document');
select is(tests.num_as(tests.id('so'), $$select count(*) from storage.objects where bucket_id in ('application-docs', 'receipts', 'service-docs', 'imports') and (name like 'a0000000-%' or name like 'imports/%')$$), 4::bigint, 'the IT Convener reads them all');
select is(tests.num_as_aal1(tests.id('so'), $$select count(*) from storage.objects where bucket_id = 'application-docs' and name like 'a0000000-%cnic.pdf'$$), 0::bigint, 'the IT Convener only with the 2-step login');

-- ───────── the app's file route: view (logged) vs download (IT Convener only) ─────────
create temp table t_p on commit drop as select 'a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/cnic.pdf'::text as p;
grant select on t_p to authenticated;
select is(tests.num_as(tests.id('mo'), $$select count(*) from (select api.file_access('application-docs', (select p from t_p), 'view') ok) x where ok$$), 1::bigint, 'the officer may view it (for verification)');
select is(tests.num_as(tests.id('mo'), $$select count(*) from (select api.file_access('application-docs', (select p from t_p), 'download') ok) x where ok$$), 0::bigint, 'but not download the original');
select is(tests.num_as(tests.id('sg'), $$select count(*) from (select api.file_access('application-docs', (select p from t_p), 'download') ok) x where ok$$), 0::bigint, 'nor the Secretary General');
select is(tests.num_as(tests.id('so'), $$select count(*) from (select api.file_access('application-docs', (select p from t_p), 'download') ok) x where ok$$), 1::bigint, 'the IT Convener downloads it');
select is(tests.num_as(tests.id('owner_b'), $$select count(*) from (select api.file_access('application-docs', (select p from t_p), 'view') ok) x where ok$$), 0::bigint, 'another company cannot view it');
select is(tests.num_as(tests.id('accounts_staff'), $$select count(*) from (select api.file_access('receipts', 'a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000001/r.jpg', 'view') ok) x where ok$$), 1::bigint, 'Accounts view a receipt');
select is(tests.num_as(tests.id('mo'), $$select count(*) from (select api.file_access('receipts', 'a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000001/r.jpg', 'view') ok) x where ok$$), 1::bigint, 'pay 1 views receipts too');
select is(tests.num_as(tests.id('cs'), $$select count(*) from (select api.file_access('receipts', 'a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000001/r.jpg', 'view') ok) x where ok$$), 0::bigint, 'staff without payments access do not');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.file_access(''application-docs'', ''a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/../../x'', ''view'')') $$, '42501', null, 'no path tricks');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.file_access(''certificates'', ''scans/x/original.png'', ''view'')') $$, '42501', null, 'no other buckets');
select ok((select count(*) from public.file_access_log where path = 'a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/cnic.pdf' and not allowed) >= 3
      and (select count(*) from public.file_access_log where path = 'a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/cnic.pdf' and allowed) >= 2,
  'every view and download is logged, allowed or not');

-- ───────── register export ─────────
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.register_export()'), 0::bigint, 'the Membership Officer gets nothing from the register export');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.register_export()'), 0::bigint, 'nor the Secretary General');
select ok(tests.num_as(tests.id('so'), 'select count(*) from api.register_export()') >= 2, 'the IT Convener exports it');
select is((select count(*) from public.file_access_log where bucket = 'register' and mode = 'export' and at = now()), 3::bigint, 'each export attempt is logged');

-- ───────── committee notes: the committee's only ─────────
insert into public.application_history (application_id, step, note) values (tests.id('app_a_review'), 'committee note', 'internal');
select is(tests.num_as(tests.id('mo'), $$select count(*) from public.application_history where step = 'committee note'$$), 0::bigint, 'the Membership Officer does not read committee notes');
select is(tests.num_as(tests.id('cs'), $$select count(*) from public.application_history where step = 'committee note'$$), 1::bigint, 'staff with committee access do');

select * from finish();
rollback;
