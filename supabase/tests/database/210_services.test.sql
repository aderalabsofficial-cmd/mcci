-- Services (migration 0380): only members in good standing request; drafts stay private; the state machine of
-- docs/03 §5 with the right designation at each step (docs/06); a fee voucher when the fee is above 0 and no letter
-- before it is paid; the issued letter is a QR document anyone can verify; setup by platform staff only.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(33);

create temp table t_req (id uuid, token text) on commit drop;
grant select, insert on t_req to authenticated;
create temp table t_doc (code text) on commit drop;
grant select, insert on t_doc to authenticated;

-- who may start a request
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.svc_new(tests.id(''company_a''), ''co'')') $$, 'P0001', null, 'an applicant (not yet a member) cannot use services');
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'select * from api.svc_new(tests.id(''company_b''), ''co'')') $$, '42501', null, 'someone outside the company cannot');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.svc_new(tests.id(''company_b''), ''nope'')') $$, 'P0001', null, 'an unknown service is refused');
select lives_ok($$ select tests.exec_as(tests.id('owner_b'), 'insert into t_req select * from api.svc_new(tests.id(''company_b''), ''co'')') $$, 'a Permanent member starts a Certificate of Origin request');
select is((select draft from public.service_requests where id = (select id from t_req)), true, 'it is a draft');
select is(tests.num_as(tests.id('sg'), 'select count(*) from public.service_requests where id = (select id from t_req)'), 0::bigint, 'staff do not see drafts');

-- details and documents
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.svc_save((select id from t_req), ''{"Hacker": "x"}'')') $$, 'P0001', null, 'only the service''s own details are kept');
select lives_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.svc_save((select id from t_req), ''{"Consignee": "ACME GmbH", "Destination": "Germany", "HS code": "6302.10", "Invoice value (USD)": "12000"}'')') $$, 'the details are saved');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.svc_submit((select id from t_req))') $$, 'P0001', null, 'not without documents');
insert into public.service_documents (request_id, key, path, file_name)
select id, 'd1', tests.id('company_b') || '/requests/' || id || '/invoice.pdf', 'invoice.pdf' from t_req;
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from api.svc_submit((select id from t_req)) r where r.voucher_no like ''PV-%'' and r.token like ''MCCI-%'''), 1::bigint, 'submitted: token, and a fee voucher (Certificate of Origin has a fee)');
select results_eq($$ select draft, status::text, sla_due_at > now() + interval '23 hours' from public.service_requests where id = (select id from t_req) $$,
  $$ values (false, 'Submitted', true) $$, 'out of draft, Submitted, 24-hour clock running');
select is((select amount from public.payment_vouchers where ref_type = 'service' and ref_id = (select id from t_req)), (select fee from public.service_types where key = 'co'), 'the voucher is for the service fee');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.svc_save((select id from t_req), ''{"Consignee": "Other"}'')') $$, 'P0001', null, 'a submitted request cannot be edited');

-- staff steps and who may do them
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.svc_start((select id from t_req))') $$, '42501', null, 'a Membership Officer (svc 0) cannot start');
select throws_ok($$ select tests.exec_as_aal1(tests.id('so'), 'select api.svc_start((select id from t_req))') $$, '42501', null, 'not without the 2-step login');
select lives_ok($$ select tests.exec_as(tests.id('so'), 'select api.svc_start((select id from t_req))') $$, 'the Services Officer starts the review');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.svc_cancel((select id from t_req))') $$, 'P0001', null, 'the member cannot cancel once MCCI started');
select throws_ok($$ select tests.exec_as(tests.id('so'), 'select * from api.svc_return((select id from t_req), ''x'')') $$, 'P0001', null, 'a return says what to correct');
select is(tests.num_as(tests.id('so'), 'select count(*) from api.svc_return((select id from t_req), ''Please attach the signed C.O. form'')'), 1::bigint, 'returned with a note');
select is((select count(*) from public.notifications n where n.company_id = tests.id('company_b') and n.template = 'service_returned'), 1::bigint, 'the member is told in the portal');
select lives_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.svc_resubmit((select id from t_req), ''attached'')') $$, 'the member sends it back');
select is((select status::text from public.service_requests where id = (select id from t_req)), 'In review', 'back under review');
select lives_ok($$ select tests.exec_as(tests.id('so'), 'select api.svc_approve((select id from t_req))') $$, 'approved for signature');
select throws_ok($$ select tests.exec_as(tests.id('so'), 'select * from api.svc_sign((select id from t_req))') $$, '42501', null, 'the Services Officer (svc 2) does not sign');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select * from api.svc_sign((select id from t_req))') $$, 'P0001', null, 'no letter before the fee is paid');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.svc_sign_all()'), 0::bigint, 'sign all skips requests whose fee is unpaid');

-- the fee is paid at the counter; then the signatory issues the letter
select lives_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select * from api.pay_counter((select voucher_no from public.payment_vouchers where ref_type = ''service'' and ref_id = (select id from t_req)), ''CTR-1'', null)') $$, 'Accounts record the fee');
select is((select count(*) from public.service_history where request_id = (select id from t_req) and step = 'fee paid'), 1::bigint, 'the request shows the fee as paid');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'insert into t_doc select code from api.svc_sign((select id from t_req))') $$, 'the Secretary General signs and issues');
select results_eq($$ select r.status::text, d.kind::text, d.status::text, d.company_id = tests.id('company_b') from public.service_requests r join public.documents d on d.id = r.issued_doc where r.id = (select id from t_req) $$,
  $$ values ('Issued', 'letter', 'Valid', true) $$, 'Issued, with a QR letter in the registry');
select is((select status::text from api.doc_verify((select code from t_doc))), 'Valid', 'anyone can verify the letter by its QR code');

-- setup
select throws_ok($$ select tests.exec_as(tests.id('so'), 'select api.svcset_save(''co'', 1500, 24, true, ''["Invoice"]'', ''["Consignee"]'')') $$, '42501', null, 'only platform staff change the service setup');
select ok(not has_function_privilege('anon', 'api.svc_new(uuid,text)', 'execute') and not has_function_privilege('anon', 'api.svc_sign(uuid)', 'execute')
      and not has_function_privilege('anon', 'api.svcset_save(text,int,int,boolean,jsonb,jsonb)', 'execute'), 'grants: nothing for anonymous visitors');

select * from finish();
rollback;
