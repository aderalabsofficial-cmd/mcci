-- Application form of 28 Oct 2026 (migrations 0420–0421): main category, LLP, registered / unregistered AOP (Form C),
-- sales tax w.e.f. date, representative email / address, partner email / address, the class rule and the checklists.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);

-- class rule
select results_eq($$ select private.class_of('{"biz":"llp"}')::text,
                            private.class_of('{"biz":"aop","manufacturing":true,"salesTax":true}')::text,
                            private.class_of('{"biz":"aop","manufacturing":false,"salesTax":true,"turnover50":true}')::text,
                            private.class_of('{"biz":"aop","manufacturing":false,"salesTax":true,"turnover50":false}')::text,
                            private.class_of('{"biz":"prop","manufacturing":true,"salesTax":false,"turnover50":true}')::text $$,
  $$ values ('Corporate', 'Corporate', 'Corporate', 'Associate', 'Associate') $$,
  'LLP is a body corporate; AOP manufacturing + GST is Corporate; non-manufacturing needs GST + Rs 50 M; no GST is Associate');

-- checklists
select is((select count(*) from public.document_requirements where biz_type = 'llp'), 10::bigint, 'LLP has its own checklist (10 documents)');
select is((select required from public.document_requirements where biz_type = 'aop' and key = 'formc'), false,
  'Form C is not asked by default (only from a registered AOP)');
select is((select count(*) from public.document_requirements where key = 'pphoto'), 0::bigint,
  'no single "photos of all partners" document any more: each partner has their own photo (0480)');
select ok(not exists (select 1 from public.document_requirements where key = 'st' and label_en ilike '%and sales tax return%'),
  'no sales tax return is asked any more');
select is((select count(*) from public.document_requirements where key = 'bank' and short_en <> 'Bank Maintenance Certificate'), 0::bigint,
  'Bank Maintenance Certificate everywhere');

-- an AOP draft of company A, complete except for the new choices
update public.applications set stage = 'draft', jurisdiction_ok = true, decl1 = true, decl2 = true, sign_path = 'x/sign.png',
  stamp_path = 'x/stamp.png',
  form = '{"biz":"aop","nature":{"sector":"trade","items":["Wholesaler"],"other":""},"addrMatch":true,"name":"A Traders",
           "address":"Multan","ntn":"1-1","tel":"061","email":"a@test.local","particulars":"Wholesale","est":"2010-01-01",
           "rep":"Owner A","desig":"Managing Partner","cnic":"36302-1111111-1","mobile":"0300"}'
 where id = tests.id('app_a_review');
delete from public.application_documents where application_id = tests.id('app_a_review');
insert into public.application_documents (application_id, key, path, file_name)
select tests.id('app_a_review'), k, 'a/applications/r/' || k, k || '.pdf'
  from unnest(array['cnic','ntn','addr','bank','deed','auth','photo']) k;
delete from public.application_partners where application_id = tests.id('app_a_review');
insert into public.application_partners (application_id, position, name, email, address)
values (tests.id('app_a_review'), 1, 'Partner One', 'one@test.local', 'Multan'), (tests.id('app_a_review'), 2, 'Partner Two', 'two@old.local', 'Multan');
-- each partner's own photo (0480; pgTAP 290 tests the rule)
update public.application_partners p
   set photo_path = a.company_id || '/applications/' || a.id || '/partners/' || p.id || '/' || gen_random_uuid() || '.jpg'
  from public.applications a where a.id = p.application_id and p.application_id = tests.id('app_a_review');

select is(private.app_missing(tests.id('app_a_review')), array['category', 'aopReg', 'field:repEmail', 'field:repAddress'],
  'the main category, registered / unregistered AOP and the representative''s email and address are required');
update public.applications set form = form || '{"manufacturing":true,"aopRegistered":false,"repEmail":"rep@test.local","repAddress":"Multan"}'
 where id = tests.id('app_a_review');
select is(private.app_missing(tests.id('app_a_review')), '{}'::text[], 'an unregistered AOP needs no Form C');
update public.applications set form = form || '{"aopRegistered":true}' where id = tests.id('app_a_review');
select is(private.app_missing(tests.id('app_a_review')), array['doc:formc'], 'a registered AOP must add Form C');
update public.applications set form = form || '{"aopRegistered":false,"salesTax":true}' where id = tests.id('app_a_review');
select is(private.app_missing(tests.id('app_a_review')), array['field:stWef', 'doc:st'],
  'sales-tax registered: the w.e.f. date and the registration certificate');
update public.applications set form = form || '{"stWef":"2020-07-01"}' where id = tests.id('app_a_review');
insert into public.application_documents (application_id, key, path, file_name)
values (tests.id('app_a_review'), 'st', 'a/applications/r/st', 'st.pdf');
select is(private.app_missing(tests.id('app_a_review')), '{}'::text[], 'complete');
select is(private.class_of((select form from public.applications where id = tests.id('app_a_review')))::text, 'Corporate',
  'this AOP (manufacturing + GST) is Corporate');

-- partners: the applicant writes email and address; another company cannot
select lives_ok(format($$ select tests.exec_as(tests.id('owner_a'), %L) $$,
  format('update public.application_partners set email = ''two@test.local'', address = ''Lahore'' where application_id = %L and position = 2',
         tests.id('app_a_review'))), 'the applicant adds a partner''s email and address');
select is((select email || ' · ' || address from public.application_partners where application_id = tests.id('app_a_review') and position = 2),
  'two@test.local · Lahore', 'saved');
select is(tests.num_as(tests.id('owner_b'), format(
  'with u as (update public.application_partners set email = ''x@x.x'' where application_id = %L returning 1) select count(*) from u',
  tests.id('app_a_review'))), 0::bigint, 'another company cannot change them');
select throws_ok($$ insert into public.application_partners (application_id, position, name, email)
                   values (tests.id('app_a_review'), 3, 'Long', repeat('x', 255)) $$, '23514', null, 'an over-long email is refused');

select * from finish();
rollback;
