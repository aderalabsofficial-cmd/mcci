-- Committee, printing, QR registry, temporary memberships. Findings F-09 (A3, A4), F-13.
-- Runs in its own transaction and rolls back (supabase test db / pg_prove run each file in a separate session).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(21);

-- NT-40a (F-09, A3): view-only and even approve-level staff do not write committee rows directly
select throws_ok($$ select tests.exec_as(tests.id('president'), 'insert into public.committee_items (application_id, meeting_id, decision) values (tests.id(''app_a_review''), ''MC-TEST-1'', ''Approved'')') $$, '42501', null, 'NT-40a President (cmt 1) cannot record a decision');
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'update public.meetings set status = ''Held''') $$, '42501', null, 'NT-40a Auditor cannot edit meetings');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'insert into public.committee_items (application_id, meeting_id, decision) values (tests.id(''app_a_review''), ''MC-TEST-1'', ''Approved'')') $$, '42501', null, 'decisions only through api.cmt_decide (M5), even for cmt 3');
select is(tests.num_as(tests.id('cs'), 'select count(*) from public.meetings'), 1::bigint, 'Committee Secretary reads meetings');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.meetings'), 0::bigint, 'members do not read the meeting list');
-- deferral keeps history: same application on two meetings
insert into public.meetings (id, committee) values ('MC-TEST-2', 'Membership Committee');
insert into public.committee_items (application_id, meeting_id, decision) values (tests.id('app_a_review'), 'MC-TEST-1', 'Deferred');
select lives_ok($$ insert into public.committee_items (application_id, meeting_id) values (tests.id('app_a_review'), 'MC-TEST-2') $$, 'a deferred item can be listed on the next meeting');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.committee_items'), 2::bigint, 'applicant sees own agenda items');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.committee_items'), 0::bigint, 'other companies do not');

-- NT-41a (F-09, A4): print batches
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'update public.print_batches set status = ''Printing''') $$, '42501', null, 'NT-41a Auditor (temp 1) cannot edit batches');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'insert into public.print_batches (id, printer) values (''PB-X'', ''x'')') $$, '42501', null, 'batch changes only through api.batch_* (M6)');
select is(tests.num_as(tests.id('auditor'), 'select count(*) from public.print_batches'), 1::bigint, 'Auditor reads batches');
-- a member can have more than one print item (duplicate certificate, C4)
insert into public.print_items (member_id) values (tests.id('member_b'));
select lives_ok($$ insert into public.print_items (member_id, reason) values (tests.id('member_b'), 'duplicate') $$, 'second print item for the same member is possible');

-- QR registry
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.documents'), 1::bigint, 'member reads own issued documents');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.documents'), 0::bigint, 'other companies do not');
select throws_ok($$ select tests.exec_as(null, 'select count(*) from public.documents') $$, '42501', null, 'public verification only through /api/verify (service role)');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'update public.documents set status = ''Valid''') $$, '42501', null, 'members cannot change QR status');
select throws_ok($$ insert into public.documents (code, kind, title) values ('MCCI-QR-T7K2-0231', 'certificate', 'x') $$, '23514', null, 'F-13 weak legacy-format codes are rejected');
-- scan counter changes are not audited (noise), status changes are
update public.documents set scans = scans + 1 where id = tests.id('cert_b');
update public.documents set status = 'Revoked', revoked_reason = 'test' where id = tests.id('cert_b');
select is((select count(*) from public.audit_log where object = 'documents' and action = 'UPDATE'), 1::bigint, 'only the status change is audited');

-- temporary memberships: own member only
insert into public.temp_memberships (member_id, expires_at) values (tests.id('member_b'), now() + interval '60 days');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.temp_memberships'), 1::bigint, 'member reads own temporary membership');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.temp_memberships'), 0::bigint, 'others do not');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'update public.temp_memberships set expires_at = now() + interval ''1 year''') $$, '42501', null, 'members cannot extend themselves');

select * from finish();
rollback;
