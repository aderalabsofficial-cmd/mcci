-- Release 2 staff review (migration 0310): MFA for staff levels, open / checklist / correct / class / return /
-- verify / reject, history + audit with reasons, applicant notifications, email log marking. Rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(41);

-- a complete proprietorship file of company A, submitted (built directly; the applicant path is covered by 130)
update public.applications set stage = 'submitted', created_by = tests.id('owner_a'), jurisdiction_ok = true, decl1 = true, decl2 = true,
  sign_path = 'x/sign.png', review = '{}',
  form = '{"biz":"prop","manufacturing":false,"repEmail":"a@test.local","repAddress":"Multan","nature":{"sector":"trade","items":["Wholesaler"],"other":""},"addrMatch":true,"name":"A Traders",
           "address":"Multan","ntn":"1-1","tel":"061","email":"a@test.local","particulars":"Wholesale","est":"2010-01-01",
           "rep":"Owner A","desig":"Proprietor","cnic":"36302-1111111-1","mobile":"0300"}'
 where id = tests.id('app_a_review');
delete from public.application_documents where application_id = tests.id('app_a_review');
insert into public.application_documents (application_id, key, path, file_name)
select tests.id('app_a_review'), k, 'a/applications/r/' || k, k || '.pdf' from unnest(array['cnic','ntn','addr','bank','photo']) k;
create temp table t_doc on commit drop as
  select id from public.application_documents where application_id = tests.id('app_a_review') and key = 'ntn';
grant select on t_doc to authenticated;

-- 1. MFA: a staff password alone is not enough any more
select ok(tests.num_as(tests.id('mo'), 'select count(*) from public.applications') >= 1, 'officer with 2-step session reads applications');
select is(tests.num_as_aal1(tests.id('mo'), 'select count(*) from public.applications'), 0::bigint, 'officer without 2-step reads none');
select is(tests.num_as_aal1(tests.id('mo'), 'select count(*) from storage.objects where bucket_id = ''application-docs'''), 0::bigint, 'nor their files');
select throws_ok($$ select tests.exec_as_aal1(tests.id('mo'), 'select api.app_open(tests.id(''app_a_review''))') $$, '42501', null, 'staff functions refuse a password-only session');
select throws_ok($$ select tests.exec_as_aal1(tests.id('mo'), 'select api.doc_review(tests.id(''doc_a_review''), true)') $$, '42501', null, 'existing staff functions too (doc_review)');

-- 2. open: viewers read, officers start the review
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.app_open(tests.id(''app_a_review''))') $$, '42501', null, 'an applicant cannot open the staff file');
select is(tests.num_as(tests.id('president'), 'select count(*) from api.app_open(tests.id(''app_a_review'')) s where s = ''submitted'''), 1::bigint, 'a viewer (mem 1) opens without changing the stage');
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.app_open(tests.id(''app_a_review'')) s where s = ''review'''), 1::bigint, 'the officer opening it starts the review');
select is((select step from public.application_history where application_id = tests.id('app_a_review') order by id desc limit 1), 'review started', 'history: review started');

-- 3. documents and checklist
select throws_ok($$ select tests.exec_as(tests.id('president'), 'select api.doc_review((select id from t_doc), true)') $$, '42501', null, 'a viewer cannot accept documents');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.doc_review((select id from t_doc), false, ''Not readable'')') $$, 'the officer rejects the NTN certificate with a reason');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_check(tests.id(''app_a_review''), ''bogus'', true)') $$, 'P0001', null, 'unknown checklist item refused');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.app_check(tests.id(''app_a_review''), ''docs'', true)') $$, '42501', null, 'the applicant cannot tick the checklist');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_check(tests.id(''app_a_review''), x, true) from unnest(array[''docs'',''identity'',''ntn'',''address'']) x') $$, 'the officer ticks the checklist');
select is((select review -> 'checks' from public.applications where id = tests.id('app_a_review')), '{"docs": true, "ntn": true, "address": true, "identity": true}'::jsonb, 'checklist stored');

-- 4. corrections with reasons (audit keeps old → new)
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_edit_field(tests.id(''app_a_review''), ''name'', ''A Traders Ltd'', '' '')') $$, 'P0001', null, 'a correction needs a reason');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_edit_field(tests.id(''app_a_review''), ''biz'', ''pvt'', ''x'')') $$, 'P0001', null, 'only particulars can be corrected');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_edit_field(tests.id(''app_a_review''), ''name'', ''A Traders (Regd.)'', ''Spelling as on NTN'')') $$, 'the officer corrects the business name');
select is((select form ->> 'name' from public.applications where id = tests.id('app_a_review')), 'A Traders (Regd.)', 'form updated');
select is((select count(*) from public.audit_log where object = 'applications' and user_id = tests.id('mo') and reason = 'Spelling as on NTN'), 1::bigint, 'audit row with the officer and the reason');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_set_class(tests.id(''app_a_review''), ''Corporate'', ''x'')') $$, '42501', null, 'class override is for the Secretary General');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.app_set_class(tests.id(''app_a_review''), ''Corporate'', ''Sales-tax registered manufacturer'')') $$, 'the SG sets the class with a reason');

-- 5. return for correction: portal message + queued email; a failed email does not undo it
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.app_return(tests.id(''app_a_review''), '''')') $$, 'P0001', null, 'a return needs a note');
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.app_return(tests.id(''app_a_review''), ''NTN certificate is not readable'') r where r.to_email is not null'), 1::bigint, 'the officer returns the file; the applicant email is queued');
select results_eq($$ select stage::text, return_note from public.applications where id = tests.id('app_a_review') $$, $$ values ('returned', 'NTN certificate is not readable') $$, 'returned with the note');
select is((select count(*) from public.notifications where user_id = tests.id('owner_a') and title = 'Correction needed'), 1::bigint, 'portal message for the applicant');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.email_log'), 0::bigint, 'applicants never read the email log');
select throws_ok(format('select tests.exec_as(tests.id(''sg''), %L)', format('select api.email_mark(%s, true)', (select max(id) from public.email_log))), '42501', null, 'only the officer who queued an email marks it');
select lives_ok(format('select tests.exec_as(tests.id(''mo''), %L)', format('select api.email_mark(%s, false, null, ''SMTP timeout'')', (select max(id) from public.email_log))), 'the app reports a failed email');
select results_eq($$ select status, error from public.email_log order by id desc limit 1 $$, $$ values ('failed', 'SMTP timeout') $$, 'failure recorded');
select throws_ok(format('select tests.exec_as(tests.id(''mo''), %L)', format('select api.email_mark(%s, true)', (select max(id) from public.email_log))), '42501', null, 'an email is marked once');
select is((select stage::text from public.applications where id = tests.id('app_a_review')), 'returned', 'the decision stands after the email failure');

-- 6. verify: every document accepted and the checklist complete; no endorsements yet → proposer
update public.applications set stage = 'review' where id = tests.id('app_a_review');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.app_verify(tests.id(''app_a_review''))') $$, 'P0001', null, 'not while a document is rejected or pending');
update public.application_documents set status = 'ok' where application_id = tests.id('app_a_review');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_check(tests.id(''app_a_review''), ''identity'', false)') $$, 'one checklist item unticked');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.app_verify(tests.id(''app_a_review''))') $$, 'P0001', null, 'not with an incomplete checklist');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_check(tests.id(''app_a_review''), ''identity'', true)') $$, 'ticked again');
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.app_verify(tests.id(''app_a_review'')) v where v.stage = ''proposer'''), 1::bigint, 'verified → waits for proposer and seconder');
select is((select count(*) from public.notifications where user_id = tests.id('owner_a') and title = 'Documents verified'), 1::bigint, 'applicant told');

-- 7. reject: the Secretary General only, with a reason
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.app_reject(tests.id(''app_a_review''), ''No'')') $$, '42501', null, 'officers cannot reject');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.app_reject(tests.id(''app_a_review''), ''Business outside the Multan jurisdiction'')'), 1::bigint, 'the SG rejects with a reason');
select results_eq($$ select stage::text, reject_note, decided_at is not null from public.applications where id = tests.id('app_a_review') $$,
  $$ values ('rejected', 'Business outside the Multan jurisdiction', true) $$, 'final rejection recorded');

select * from finish();
rollback;
