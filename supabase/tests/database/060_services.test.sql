-- Service requests, documents, messages. Finding F-07.
-- Runs in its own transaction and rolls back (supabase test db / pg_prove run each file in a separate session).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(20);

select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.service_requests (company_id, service_key, sla_due_at) values (tests.id(''company_a''), ''ebil'', now())') $$, '42501', null, 'requests are created only by api.svc_submit (M7)');
select throws_ok($$ select tests.exec_as(tests.id('so'), 'update public.service_requests set status = ''Issued''') $$, '42501', null, 'status moves only through api.svc_* (M7)');

-- NT-30 (F-07): no file changes once issued
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.service_documents (request_id, key, path) values (tests.id(''svc_a_issued''), ''passport'', ''p'')') $$, '42501', null, 'NT-30 no upload to an issued request');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.service_documents (request_id, key, path) values (tests.id(''svc_a_returned''), ''passport'', ''p'')') $$, 'corrected file on a returned request');
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'insert into public.service_documents (request_id, key, path) values (tests.id(''svc_a_returned''), ''passport'', ''p'')') $$, '42501', null, 'Viewer (svc 1) cannot upload');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'insert into public.service_documents (request_id, key, path) values (tests.id(''svc_a_returned''), ''passport'', ''p'')') $$, '42501', null, 'other company cannot upload');
-- NT-31: staff (any level) do not write member files directly
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'insert into public.service_documents (request_id, key, path) values (tests.id(''svc_a_returned''), ''x'', ''p'')') $$, '42501', null, 'NT-31 view-only staff cannot write');
select throws_ok($$ select tests.exec_as(tests.id('so'), 'insert into public.service_documents (request_id, key, path) values (tests.id(''svc_a_returned''), ''x'', ''p'')') $$, '42501', null, 'NT-31 Services Officer writes issued letters through the signing handler only');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.service_documents (request_id, key, path, uploaded_by) values (tests.id(''svc_a_returned''), ''x'', ''p'', tests.id(''owner_b''))') $$, '42501', null, 'uploader cannot be spoofed');

-- messages (svc.msg)
select lives_ok($$ select tests.exec_as(tests.id('services_a'), 'insert into public.service_messages (request_id, body) values (tests.id(''svc_a_returned''), ''Attached the corrected passport'')') $$, 'Services user (svc 2) writes a message');
select lives_ok($$ select tests.exec_as(tests.id('so'), 'insert into public.service_messages (request_id, body) values (tests.id(''svc_a_returned''), ''Thank you'')') $$, 'Services Officer (svc 2) replies');
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'insert into public.service_messages (request_id, body) values (tests.id(''svc_a_returned''), ''x'')') $$, '42501', null, 'Viewer (svc 1) cannot write');
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'insert into public.service_messages (request_id, body) values (tests.id(''svc_a_returned''), ''x'')') $$, '42501', null, 'Auditor (svc 1) cannot write');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'insert into public.service_messages (request_id, body) values (tests.id(''svc_a_returned''), ''x'')') $$, '42501', null, 'other company cannot write');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.service_messages (request_id, body, by_user) values (tests.id(''svc_a_returned''), ''x'', tests.id(''so''))') $$, '42501', null, 'author cannot be spoofed');

-- visibility
select is(tests.num_as(tests.id('accounts_a'), 'select count(*) from public.service_requests'), 2::bigint, 'Accounts user (svc 1) reads company requests');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.service_requests'), 0::bigint, 'other company reads none');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.service_messages'), 0::bigint, 'other company reads no messages');
select is(tests.num_as(tests.id('so'), 'select count(*) from public.service_requests'), 2::bigint, 'Services Officer reads all requests');
select matches((select token from public.service_requests where id = tests.id('svc_a_issued')), '^MCCI-[0-9]{4}-[0-9]{4,}$', 'service token format');

select * from finish();
rollback;
