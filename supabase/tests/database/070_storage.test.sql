-- Storage buckets and object policies. Finding F-18 (NT-70 … NT-76, NT-80 for files).
-- Paths: {company_id}/{entity}/{entity_id}/{file}. In the dry run, storage.objects is a stub of the Storage service
-- tables; on a real stack the same policies run on the service's own tables (verification T-V3, docs/17).
-- Runs in its own transaction and rolls back (supabase test db / pg_prove run each file in a separate session).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(26);

-- fixtures (written as the owner, i.e. as the trusted Storage service would)
insert into storage.objects (bucket_id, name) values
  ('application-docs', 'a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/cnic.pdf'),
  ('application-docs', 'b0000000-0000-0000-0000-00000000000b/applications/b2000000-0000-0000-0000-0000000000d1/cnic.pdf'),
  ('receipts',         'a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000002/receipt.jpg'),
  ('certificates',     'b0000000-0000-0000-0000-00000000000b/members/b1000000-0000-0000-0000-0000000000b1/certificate.pdf'),
  ('form-snapshots',   'a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/form.pdf');

-- buckets
select is((select count(*) from storage.buckets where id in ('application-docs','form-snapshots','receipts','certificates','service-docs','imports','cms')), 7::bigint, 'seven buckets');
select is((select count(*) from storage.buckets where public), 1::bigint, 'only cms is public');
select is((select file_size_limit from storage.buckets where id = 'application-docs'), 10485760::bigint, '10 MB limit (docs/01)');

-- NT-70: company isolation
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from storage.objects where bucket_id = ''application-docs'''), 1::bigint, 'applicant reads own application files');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from storage.objects where bucket_id = ''application-docs'''), 1::bigint, 'NT-70 company B reads only its own');
select is(tests.num_as(tests.id('mo'), 'select count(*) from storage.objects where bucket_id = ''application-docs'''), 2::bigint, 'officer (mem >= 1) reads all application files');

-- NT-71 / NT-72: uploads only under own company prefix, only while draft/returned
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into storage.objects (bucket_id, name) values (''application-docs'', ''b0000000-0000-0000-0000-00000000000b/applications/b2000000-0000-0000-0000-0000000000d1/x.pdf'')') $$, '42501', null, 'NT-71 no upload into another company');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into storage.objects (bucket_id, name) values (''application-docs'', ''a0000000-0000-0000-0000-00000000000a/applications/b2000000-0000-0000-0000-0000000000d1/x.pdf'')') $$, '42501', null, 'NT-71 own prefix + someone else''s application id is refused');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into storage.objects (bucket_id, name) values (''application-docs'', ''a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/late.pdf'')') $$, '42501', null, 'NT-72 no upload after submission');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into storage.objects (bucket_id, name) values (''application-docs'', ''a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000d1/ntn.pdf'')') $$, 'upload into own draft');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into storage.objects (bucket_id, name) values (''application-docs'', ''../../etc/passwd'')') $$, '42501', null, 'malformed path matches nothing');
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'insert into storage.objects (bucket_id, name) values (''application-docs'', ''a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000d1/v.pdf'')') $$, '42501', null, 'Viewer cannot upload application files');

-- NT-73 / NT-80: endorsers never read applicant files
select is(tests.num_as(tests.id('owner_e'), 'select count(*) from storage.objects where bucket_id in (''application-docs'', ''form-snapshots'')'), 0::bigint, 'NT-73 endorser reads no applicant files');

-- NT-74: receipts (only once MCCI has confirmed the bank account, migration 0340)
update private.settings set value = value || '{"confirmed": true}' where key = 'bank';
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'insert into storage.objects (bucket_id, name) values (''receipts'', ''a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000001/r.jpg'')') $$, '42501', null, 'NT-74 Viewer (pay 1) cannot upload a receipt');
select throws_ok($$ select tests.exec_as(tests.id('services_a'), 'insert into storage.objects (bucket_id, name) values (''receipts'', ''a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000001/r.jpg'')') $$, '42501', null, 'NT-74 Services user (pay 0) cannot upload a receipt');
select lives_ok($$ select tests.exec_as(tests.id('accounts_a'), 'insert into storage.objects (bucket_id, name) values (''receipts'', ''a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000001/r.jpg'')') $$, 'Accounts user uploads against an Unpaid voucher');
select throws_ok($$ select tests.exec_as(tests.id('accounts_a'), 'insert into storage.objects (bucket_id, name) values (''receipts'', ''a0000000-0000-0000-0000-00000000000a/vouchers/f1000000-0000-0000-0000-000000000002/r2.jpg'')') $$, '42501', null, 'no receipt for a Paid voucher');
select is(tests.num_as(tests.id('services_a'), 'select count(*) from storage.objects where bucket_id = ''receipts'''), 0::bigint, 'Services user (pay 0) cannot read receipts');

-- certificates
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from storage.objects where bucket_id = ''certificates'''), 1::bigint, 'member reads own certificate');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from storage.objects where bucket_id = ''certificates'''), 0::bigint, 'others do not');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'insert into storage.objects (bucket_id, name) values (''certificates'', ''b0000000-0000-0000-0000-00000000000b/scans/x/fake.pdf'')') $$, '42501', null, 'members cannot upload certificates');

-- NT-75: anonymous sees nothing in private buckets
select is(tests.num_as(null, 'select count(*) from storage.objects where bucket_id <> ''cms'''), 0::bigint, 'NT-75 anonymous lists no private objects');

-- NT-76: no client update or delete of stored evidence.
-- The real Storage service guards storage.objects with a statement-level BEFORE DELETE trigger
-- (storage.protect_delete, 42501) that refuses every direct DELETE; the Storage API deletes under the caller's RLS.
-- This helper never disables or bypasses that trigger: it fingerprints all objects, makes the attempt as the user,
-- accepts only a permission refusal (42501: RLS, grants or the Storage trigger), and reports whether anything changed.
create function pg_temp.storage_unchanged_after(p_uid uuid, p_sql text) returns boolean
  language plpgsql
  as $f$
declare
  v_before text;
  v_after text;
begin
  select md5(coalesce(string_agg(o.id::text || '|' || o.bucket_id || '|' || o.name, ',' order by o.id), '')) into v_before from storage.objects o;
  begin
    perform tests.num_as(p_uid, p_sql);
  exception when insufficient_privilege then
    null;  -- refused; the fingerprint below proves nothing was removed or changed
  end;
  select md5(coalesce(string_agg(o.id::text || '|' || o.bucket_id || '|' || o.name, ',' order by o.id), '')) into v_after from storage.objects o;
  return v_before = v_after;
end $f$;

select ok(pg_temp.storage_unchanged_after(tests.id('owner_a'), 'with d as (delete from storage.objects where bucket_id = ''application-docs'' returning 1) select count(*) from d'), 'NT-76 applicant cannot delete uploaded files');
select is(tests.num_as(tests.id('accounts_a'), 'with u as (update storage.objects set name = name || ''x'' where bucket_id = ''receipts'' returning 1) select count(*) from u'), 0::bigint, 'NT-76 receipts cannot be overwritten');
select ok(pg_temp.storage_unchanged_after(tests.id('sg'), 'with d as (delete from storage.objects returning 1) select count(*) from d'), 'NT-76 not even staff delete directly');
-- The Storage API path: it deletes and updates as the caller under RLS, so no client policy for DELETE/UPDATE may exist.
select is_empty($$ select tablename || ' ' || policyname || ' ' || cmd from pg_policies
                   where schemaname = 'storage' and cmd in ('DELETE','UPDATE','ALL')
                     and roles && array['public','anon','authenticated']::name[] $$,
  'NT-76 no client DELETE/UPDATE policy on Storage tables, so Storage API deletes are refused for every role');

select * from finish();
rollback;
