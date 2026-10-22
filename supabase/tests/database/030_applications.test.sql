-- Membership applications and documents. Findings F-01 (A1), F-04, F-05, F-07, NT-43, NT-80.
select no_plan();

-- NT-01 / NT-02 (F-01, A1): applications are created only by api.app_create, for own company, by Owner/Manager
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.applications (company_id, created_by) values (tests.id(''company_b''), tests.id(''owner_a''))') $$, '42501', null, 'NT-01 no direct insert at all');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.app_create(tests.id(''company_b''))') $$, '42501', null, 'NT-01 cannot create for another company');
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'select * from api.app_create(tests.id(''company_a''))') $$, '42501', null, 'NT-02 Viewer cannot create');
select throws_ok($$ select tests.exec_as(tests.id('services_a'), 'select * from api.app_create(tests.id(''company_a''))') $$, '42501', null, 'NT-02 Services user cannot create');
select throws_ok($$ select tests.exec_as(tests.id('fresh'), 'select * from api.app_create(tests.id(''company_a''))') $$, '42501', null, 'NT-02 outsider cannot create');
select lives_ok($$ select tests.exec_as(tests.id('manager_a'), 'select * from api.app_create(tests.id(''company_a''))') $$, 'Manager creates an application for own company');
select is((select count(*) from public.application_history h join public.applications a on a.id = h.application_id
           where a.company_id = tests.id('company_a') and h.step = 'created'), 1::bigint, 'creation is recorded in history');

-- NT-03 / NT-04 (F-05): applicant edits only own content, only while draft/returned
select is(tests.num_as(tests.id('owner_a'), 'with u as (update public.applications set form = ''{"name":"X"}'' where id = tests.id(''app_a_draft'') returning 1) select count(*) from u'), 1::bigint, 'Owner edits the form while draft');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.applications set class = ''Associate'' where id = tests.id(''app_a_draft'')') $$, '42501', null, 'NT-03 class (fee) is not applicant-writable');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.applications set review = ''{"docs":true}'' where id = tests.id(''app_a_draft'')') $$, '42501', null, 'NT-03 officer checklist is not applicant-writable');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.applications set stage = ''committee'' where id = tests.id(''app_a_draft'')') $$, '42501', null, 'NT-03 stage is not applicant-writable');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.applications set member_id = tests.id(''member_e'') where id = tests.id(''app_a_draft'')') $$, '42501', null, 'NT-03 member_id is not applicant-writable');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.applications set company_id = tests.id(''company_b'') where id = tests.id(''app_a_draft'')') $$, '42501', null, 'NT-03 company cannot be moved');
select is(tests.num_as(tests.id('owner_a'), 'with u as (update public.applications set form = ''{}'' where id = tests.id(''app_a_review'') returning 1) select count(*) from u'), 0::bigint, 'NT-04 no edits after submission');
select is(tests.num_as(tests.id('viewer_a'), 'with u as (update public.applications set form = ''{}'' where id = tests.id(''app_a_draft'') returning 1) select count(*) from u'), 0::bigint, 'Viewer cannot edit the draft');
select is(tests.num_as(tests.id('owner_b'), 'with u as (update public.applications set form = ''{}'' where id = tests.id(''app_a_draft'') returning 1) select count(*) from u'), 0::bigint, 'other company cannot edit');

-- NT-05 / NT-06 (F-04): documents enter as pending; status only through api.doc_review
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.application_documents set status = ''ok'' where id = tests.id(''doc_a_draft'')') $$, '42501', null, 'NT-05 applicant cannot approve own document');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.application_documents (application_id, key, path, status) values (tests.id(''app_a_draft''), ''ntn'', ''p'', ''ok'')') $$, '42501', null, 'NT-06 cannot insert with a status');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.application_documents (application_id, key, path, file_name) values (tests.id(''app_a_draft''), ''ntn'', ''a/applications/x/ntn.pdf'', ''ntn.pdf'')') $$, 'applicant uploads a document to the draft');
select is((select status::text from public.application_documents where application_id = tests.id('app_a_draft') and key = 'ntn'), 'pending', 'NT-06 new document is pending');
-- replacing a reviewed file resets the review and keeps the old file as a version
update public.application_documents set status = 'rejected', reject_reason = 'blurred', reviewed_by = tests.id('mo') where id = tests.id('doc_a_draft');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.application_documents set path = ''a/applications/x/cnic-v2.pdf'' where id = tests.id(''doc_a_draft'')') $$, 'applicant replaces a rejected file');
select results_eq($$ select status::text, reviewed_by from public.application_documents where id = tests.id('doc_a_draft') $$,
  $$ values ('pending', null::uuid) $$, 'F-04 replacement resets status and reviewer');
select is((select count(*) from public.application_document_versions where document_id = tests.id('doc_a_draft')), 2::bigint, 'both file versions are kept');
select is(tests.num_as(tests.id('owner_a'), 'with u as (update public.application_documents set path = ''y'' where id = tests.id(''doc_a_review'') returning 1) select count(*) from u'), 0::bigint, 'no file changes after submission');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.application_document_versions (document_id, application_id, key, path) values (tests.id(''doc_a_draft''), tests.id(''app_a_draft''), ''cnic'', ''forged'')') $$, '42501', null, 'version history cannot be forged');

-- NT-07 (F-07): partners only while draft/returned
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.application_partners (application_id, position, name) values (tests.id(''app_a_review''), 2, ''Late partner'')') $$, '42501', null, 'NT-07 no partner added after submission');
select is(tests.num_as(tests.id('owner_a'), 'with u as (update public.application_partners set name = ''X'' where application_id = tests.id(''app_a_review'') returning 1) select count(*) from u'), 0::bigint, 'NT-07 no partner edit after submission');
select is(tests.num_as(tests.id('owner_a'), 'with d as (delete from public.application_partners where application_id = tests.id(''app_a_review'') returning 1) select count(*) from d'), 0::bigint, 'NT-07 no partner removal after submission');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.application_partners (application_id, position, name) values (tests.id(''app_a_draft''), 1, ''Partner'')') $$, 'partners can be added while draft');
select is(tests.num_as(tests.id('mo'), 'with u as (update public.application_partners set name = ''x'' returning 1) select count(*) from u'), 0::bigint, 'staff do not edit partners directly (RLS: 0 rows; corrections via api, M5)');

-- NT-43: staff move state only through api.* (no direct writes, so nothing escapes audit + reason)
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'update public.applications set stage = ''committee'' where id = tests.id(''app_a_review'')') $$, '42501', null, 'NT-43 SG cannot set stage directly');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'update public.application_documents set status = ''ok'' where id = tests.id(''doc_a_review'')') $$, '42501', null, 'NT-43 officer cannot set document status directly');

-- api.doc_review: mem >= 2, application in review, reason required to reject
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.doc_review(tests.id(''doc_a_review''), true)') $$, '42501', null, 'applicant cannot review');
select throws_ok($$ select tests.exec_as(tests.id('president'), 'select api.doc_review(tests.id(''doc_a_review''), true)') $$, '42501', null, 'view-only staff (mem 1) cannot review');
select throws_ok($$ select tests.exec_as(tests.id('inactive_mo'), 'select api.doc_review(tests.id(''doc_a_review''), true)') $$, '42501', null, 'deactivated staff cannot review');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.doc_review(tests.id(''doc_a_review''), false, '' '')') $$, 'P0001', null, 'rejection needs a reason');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.doc_review(tests.id(''doc_a_draft''), true)') $$, 'P0001', null, 'documents of a draft cannot be reviewed');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.doc_review(tests.id(''doc_a_review''), false, ''CNIC expired'')') $$, 'Membership Officer rejects with a reason');
select results_eq($$ select status::text, reject_reason, reviewed_by from public.application_documents where id = tests.id('doc_a_review') $$,
  $$ values ('rejected', 'CNIC expired', tests.id('mo')) $$, 'decision stored with officer');
select is((select count(*) from public.audit_log where object = 'application_documents' and user_id = tests.id('mo') and reason = 'CNIC expired'), 1::bigint, 'audit row carries who and why');

-- NT-80: endorsers never read applications or their documents directly (docs/04 AC 6)
select is(tests.num_as(tests.id('owner_e'), 'select count(*) from public.applications'), 0::bigint, 'NT-80 endorser reads no application rows');
select is(tests.num_as(tests.id('owner_e'), 'select count(*) from public.application_documents'), 0::bigint, 'NT-80 endorser reads no documents');
select is(tests.num_as(tests.id('owner_e'), 'select count(*) from public.endorsements'), 1::bigint, 'endorser sees the request addressed to them');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.endorsements'), 0::bigint, 'other members do not');
select throws_ok($$ select tests.exec_as(tests.id('owner_e'), 'update public.endorsements set status = ''Approved''') $$, '42501', null, 'signing goes through api.end_sign (M4) only');

-- cross-company isolation
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.applications where company_id = tests.id(''company_a'')'), 0::bigint, 'company B cannot see company A applications');
select is(tests.num_as(tests.id('mo'), 'select count(*) from public.applications'), 4::bigint, 'officer (mem >= 1) sees all applications');

select * from finish();
