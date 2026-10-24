-- M3 application wizard (migration 0300): app_start, app_missing, app_submit, app_resubmit, app_withdraw,
-- app_doc_remove, ai_extraction_finish, class rule. Runs in its own transaction and rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(31);

-- a registered person without a company gets an applicant company (as Owner) and one draft
select lives_ok($$ select tests.exec_as(tests.id('fresh'), 'select * from api.app_start()') $$, 'a newly registered person starts an application');
select is((select count(*) from public.company_users where user_id = tests.id('fresh') and role = 'Owner' and status = 'Active'),
  1::bigint, 'they own the new applicant company');
create temp table t_app on commit drop as
  select a.id, a.company_id from public.applications a
  join public.company_users cu on cu.company_id = a.company_id where cu.user_id = tests.id('fresh');
select is((select count(*) from t_app), 1::bigint, 'one draft application');
select is((select form->>'rep' from public.applications where id = (select id from t_app)), 'Fresh', 'representative pre-filled from the account name');
select lives_ok($$ select tests.exec_as(tests.id('fresh'), 'select * from api.app_start()') $$, 'starting again is harmless');
select is((select count(*) from public.applications where company_id = (select company_id from t_app)), 1::bigint, 'still one open application per person');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.app_start()'), 1::bigint, 'an Owner with an open application gets it back');
select is((select count(*) from public.applications where company_id = tests.id('company_a') and stage = 'draft'), 1::bigint, 'no second draft for company A');

-- missing items: own application only
select ok((select private.app_missing((select id from t_app)) @> array['biz', 'nature', 'juris', 'addr', 'field:name', 'doc:cnic', 'doc:photo', 'sign', 'decl']),
  'a new draft lists what is missing');
select throws_ok(format('select tests.exec_as(tests.id(''owner_b''), %L)', format('select api.app_missing(%L)', (select id from t_app))),
  '42501', null, 'another company cannot read the missing list');
select throws_ok(format('select tests.exec_as(tests.id(''fresh''), %L)', format('select api.app_submit(%L)', (select id from t_app))),
  'P0001', null, 'an incomplete application cannot be submitted');

-- fill everything a proprietorship needs, as the applicant
select lives_ok(format('select tests.exec_as(tests.id(''fresh''), %L)', format($q$
  update public.applications set
    form = '{"biz":"prop","nature":{"sector":"trade","items":["Wholesaler"],"other":""},"addrMatch":true,
             "name":"Fresh Traders","address":"12 Hussain Agahi, Multan","ntn":"1234567-8","tel":"061-4500000",
             "email":"info@fresh.test","particulars":"Wholesale & Distribution: Wholesaler","est":"2019-03-01",
             "rep":"Fresh","desig":"Proprietor","cnic":"36302-1234567-1","mobile":"0300-1234567"}',
    jurisdiction_ok = true, decl1 = true, decl2 = true, sign_path = 'x/sign.png', field_confidence = '{"name":100}'
  where id = %L$q$, (select id from t_app))), 'applicant fills the form, declarations and signature');
select lives_ok(format('select tests.exec_as(tests.id(''fresh''), %L)', format($q$
  insert into public.application_documents (application_id, key, path, file_name)
  select %L, k, 'p/' || k, k || '.pdf' from unnest(array['cnic','ntn','addr','bank','photo']) k$q$, (select id from t_app))),
  'applicant uploads the five required documents');
select is(private.app_missing((select id from t_app)), '{}'::text[], 'nothing missing for a proprietorship (stamp optional)');
update public.applications set form = form || '{"salesTax":true}' where id = (select id from t_app);
select is(private.app_missing((select id from t_app)), array['doc:st'], 'sales-tax registered: the sales tax certificate becomes required');
update public.applications set form = form - 'salesTax' where id = (select id from t_app);

select throws_ok(format('select tests.exec_as(tests.id(''owner_b''), %L)', format('select api.app_submit(%L)', (select id from t_app))),
  '42501', null, 'another company cannot submit it');
select is(tests.num_as(tests.id('fresh'), format('select count(*) from api.app_submit(%L) t where t like ''MCCI-%%-M-%%''', (select id from t_app))),
  1::bigint, 'the applicant submits and gets the token');
select results_eq(format('select stage::text, class::text, address_matches_ntn from public.applications where id = %L', (select id from t_app)),
  $$ values ('submitted', 'Associate', true) $$, 'submitted, class from the rule, address confirmed');
select results_eq(format('select name, biz_type::text, nature_items from public.companies where id = %L', (select company_id from t_app)),
  $$ values ('Fresh Traders', 'prop', array['Wholesaler']) $$, 'the company takes the submitted particulars');
select is((select count(*) from public.application_history where application_id = (select id from t_app) and step = 'submitted'), 1::bigint, 'history records the submission');
select is((select count(*) from public.notifications where user_id = tests.id('fresh') and title = 'Application received'), 1::bigint, 'portal message for the applicant');
select throws_ok(format('select tests.exec_as(tests.id(''fresh''), %L)', format('select api.app_submit(%L)', (select id from t_app))),
  'P0001', null, 'cannot submit twice');
select is(tests.num_as(tests.id('fresh'), format('with u as (update public.applications set form = ''{}'' where id = %L returning 1) select count(*) from u', (select id from t_app))),
  0::bigint, 'the form is locked after submission');
select throws_ok(format('select tests.exec_as(tests.id(''fresh''), %L)', format('select api.app_resubmit(%L)', (select id from t_app))),
  'P0001', null, 'resubmit only after a return');

-- withdraw, then a new application in the same company
select lives_ok(format('select tests.exec_as(tests.id(''fresh''), %L)', format('select api.app_withdraw(%L, ''changed my mind'')', (select id from t_app))),
  'the applicant withdraws before the committee');
select lives_ok($$ select tests.exec_as(tests.id('fresh'), 'select * from api.app_start()') $$, 'after withdrawing, the applicant starts again');
select is((select count(*) from public.applications where company_id = (select company_id from t_app) and stage = 'draft'),
  1::bigint, 'a new draft in the same company');

-- class rule (form)
select results_eq($$ select private.class_of('{"biz":"pvt"}')::text, private.class_of('{"biz":"prop","manufacturing":true,"salesTax":true}')::text,
                     private.class_of('{"biz":"aop","salesTax":true,"turnover50":true}')::text, private.class_of('{"biz":"prop","salesTax":true}')::text $$,
  $$ values ('Corporate', 'Corporate', 'Corporate', 'Associate') $$, 'Corporate / Associate as printed on the form');

-- documents and AI results belong to their author
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'select api.app_doc_remove(tests.id(''doc_a_draft''))') $$, '42501', null, 'a Viewer cannot remove documents');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.ai_extraction_begin(tests.id(''app_a_draft''), ''ntn'')') $$, 'AI reading starts (quota checked)');
select throws_ok(format('select tests.exec_as(tests.id(''manager_a''), %L)', format('select api.ai_extraction_finish(%L, true, ''m'', ''{}'')',
  (select id from public.ai_extractions where application_id = tests.id('app_a_draft') order by created_at desc limit 1))),
  '42501', null, 'only the person who started a reading can store its result');

select * from finish();
rollback;
