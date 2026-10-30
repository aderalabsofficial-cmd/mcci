-- Public verification (migration 0520): server-only functions, minimal projection, every public status, demo records
-- never verify, every attempt logged (hashed client only), the log readable by Reports staff only.
-- Personas from supabase/seed.sql: company B with member MCCI-C-9001 and certificate cert_b.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(30);

create temp table _ref on commit drop as select code from public.documents where id = tests.id('cert_b');

-- ───────── who may call them ─────────
select ok(not has_function_privilege('anon', 'api.public_verify_code(text,text,text)', 'execute'), 'anon cannot call public_verify_code (only the server, behind rate limits)');
select ok(not has_function_privilege('authenticated', 'api.public_verify_code(text,text,text)', 'execute'), 'nor a signed-in user');
select ok(not has_function_privilege('anon', 'api.public_verify_member(text,text)', 'execute'), 'anon cannot call public_verify_member');
select ok(not has_function_privilege('authenticated', 'api.public_verify_log(text,text,text)', 'execute'), 'nor write the attempts log');
select ok(has_function_privilege('service_role', 'api.public_verify_member(text,text)', 'execute'), 'the server (service role) can');
select ok(not has_function_privilege('anon', 'api.doc_verify(text)', 'execute'), 'the old endpoint is server-only too');

-- ───────── minimal projection ─────────
select is(pg_get_function_result('api.public_verify_code(text,text,text)'::regprocedure),
  'TABLE(business_name text, member_no text, category text, class text, member_status text, member_since date, valid_to date, certificate_status text, certificate_ref text, replaced_by text, checked_on date)',
  'by reference: only the approved fields (no address, phone, email, CNIC, path, id or link)');
select is(pg_get_function_result('api.public_verify_member(text,text)'::regprocedure),
  pg_get_function_result('api.public_verify_code(text,text,text)'::regprocedure), 'by membership number: the same fields');

-- ───────── a current member and certificate ─────────
select results_eq($$ select business_name, member_no, member_status, certificate_status, certificate_ref
                       from api.public_verify_code((select code from _ref), 'qr', 'h') $$,
  $$ select 'Company B (member)'::text, 'MCCI-C-9001'::text, 'Active'::text, 'Valid'::text, (select code from _ref) $$,
  'a current certificate verifies: business, number, Active, Valid');
select is((select scans from public.documents where id = tests.id('cert_b')), 1, 'the check is counted on the document');
select is((select count(*)::int from api.public_verify_code(lower(' ' || (select code from _ref) || ' '), 'code', 'h')), 1,
  'the reference is matched regardless of case and spaces');
select results_eq($$ select member_no, member_status, certificate_ref from api.public_verify_member(' mcci-c-9001 ', 'h') $$,
  $$ select 'MCCI-C-9001'::text, 'Active'::text, (select code from _ref) $$, 'by membership number, with the current certificate');
select is((select count(*)::int from api.public_verify_code('MCCI-QR-AAAAA-AAAAA', 'code', 'h')), 0, 'an unknown reference finds nothing');
select is((select count(*)::int from api.public_verify_member('MCCI-C-0000', 'h')), 0, 'an unknown membership number finds nothing');

-- ───────── statuses ─────────
update public.documents set valid_to = current_date - 1 where id = tests.id('cert_b');
select is((select certificate_status from api.public_verify_code((select code from _ref), 'code', 'h')), 'Expired', 'a certificate past its date: Expired');
update public.documents set valid_to = null, status = 'Revoked' where id = tests.id('cert_b');
select is((select certificate_status from api.public_verify_code((select code from _ref), 'code', 'h')), 'Revoked', 'a revoked certificate: Revoked');

insert into public.documents (id, kind, company_id, member_id, title)
values ('0d000000-0000-0000-0000-0000000000f2', 'certificate', tests.id('company_b'), tests.id('member_b'), 'Certificate B (new)');
update public.documents set status = 'Superseded', superseded_by = '0d000000-0000-0000-0000-0000000000f2' where id = tests.id('cert_b');
select results_eq($$ select certificate_status, replaced_by from api.public_verify_code((select code from _ref), 'code', 'h') $$,
  $$ select 'Superseded'::text, (select code from public.documents where id = '0d000000-0000-0000-0000-0000000000f2') $$,
  'a replaced certificate says so and names the new reference');
select is((select certificate_ref from api.public_verify_member('MCCI-C-9001', 'h')),
  (select code from public.documents where id = '0d000000-0000-0000-0000-0000000000f2'),
  'by membership number the current (new) certificate is shown, not the replaced one');

update public.members set valid_to = current_date - 1 where id = tests.id('member_b');
select is((select member_status from api.public_verify_member('MCCI-C-9001', 'h')), 'Expired', 'a membership past its period: Expired');
update public.members set valid_to = current_date + 100, status = 'Suspended' where id = tests.id('member_b');
select is((select member_status from api.public_verify_member('MCCI-C-9001', 'h')), 'Suspended', 'a suspended member: Suspended');
update public.members set status = 'Temporary' where id = tests.id('member_b');
insert into public.temp_memberships (member_id, expires_at) values (tests.id('member_b'), now() + interval '30 days');
select is((select member_status from api.public_verify_member('MCCI-C-9001', 'h')), 'Temporary',
  'a temporary membership that is active and not past its expiry: Temporary (valid)');
update public.temp_memberships set expires_at = now() - interval '1 day' where member_id = tests.id('member_b');
select is((select member_status from api.public_verify_member('MCCI-C-9001', 'h')), 'Expired', 'past its expiry: Expired');
update public.members set status = 'Permanent' where id = tests.id('member_b');

-- ───────── demo records never verify ─────────
update public.companies set demo = true where id = tests.id('company_b');
select is((select count(*)::int from api.public_verify_member('MCCI-C-9001', 'h')), 0, 'a demo member is not verified by number');
select is((select count(*)::int from api.public_verify_code((select code from public.documents where id = '0d000000-0000-0000-0000-0000000000f2'), 'code', 'h')), 0,
  'nor its certificate by reference');
select is((select count(*)::int from api.doc_verify((select code from public.documents where id = '0d000000-0000-0000-0000-0000000000f2'))), 0,
  'nor through the old endpoint');
update public.companies set demo = false where id = tests.id('company_b');

-- ───────── attempts log ─────────
select lives_ok($$ select api.public_verify_log('qr', 'tampered', 'client-hash') $$, 'refusals decided before the database are logged');
select ok((select count(*) from public.verify_attempts where outcome = 'found') >= 5
          and (select count(*) from public.verify_attempts where outcome = 'none') >= 4
          and exists (select 1 from public.verify_attempts where channel = 'qr' and outcome = 'tampered'),
  'every check is recorded with its channel and outcome');
select is((select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'verify_attempts'
            and column_name ~ '(ip|addr|email|user)'), 0, 'the log holds no address, email or user column — only a client hash');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.verify_attempts'), 0::bigint, 'members cannot read the log');
select ok(tests.num_as(tests.id('mo'), 'select count(*) from public.verify_attempts') > 0, 'staff with Reports access can');

select * from finish();
rollback;
