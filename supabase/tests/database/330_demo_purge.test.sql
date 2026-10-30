-- Selective demo purge (migration 0530): server only, demo companies only, refuses broken dependencies, dry run
-- changes nothing, apply removes exactly the named companies' records and keeps the audit log.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(12);

select ok(not has_function_privilege('authenticated', 'api.demo_purge(uuid[],boolean)', 'execute'), 'signed-in users cannot call it');
select ok(has_function_privilege('service_role', 'api.demo_purge(uuid[],boolean)', 'execute'), 'the server can');
select throws_ok($$ select * from api.demo_purge(array[tests.id('company_b')], false) $$, 'P0001', null,
  'a genuine (non-demo) company is refused');

-- company E (endorser) and company A (applicant) as demo; E's member endorsed A's application
update public.companies set demo = true where id in (tests.id('company_a'), tests.id('company_e'));
select throws_ok($$ select * from api.demo_purge(array[tests.id('company_e')], false) $$, 'P0001', null,
  'refused when a kept application was endorsed by a purged member');

create temp table _before on commit drop as select (select count(*) from public.applications) a, (select count(*) from public.audit_log) l;
select lives_ok($$ select * from api.demo_purge(array[tests.id('company_a'), tests.id('company_e')], false) $$, 'dry run of both');
select is((select count(*) from public.applications), (select a from _before), 'the dry run changes nothing');
select ok((select n from api.demo_purge(array[tests.id('company_a'), tests.id('company_e')], false) where item = 'companies') = 2, 'it reports the two companies');
select ok(exists (select 1 from api.demo_purge(array[tests.id('company_a')], false) where kind = 'user' and item = tests.id('owner_a')::text),
  'it lists the accounts that belong only to these companies');

select lives_ok($$ select * from api.demo_purge(array[tests.id('company_a'), tests.id('company_e')], true) $$, 'apply');
select is((select count(*)::int from public.companies where id in (tests.id('company_a'), tests.id('company_e'))), 0, 'the two companies are gone');
select is((select count(*)::int from public.companies where id = tests.id('company_b')), 1, 'the genuine company stays');
select ok((select count(*) from public.audit_log) > (select l from _before)
          and exists (select 1 from public.audit_log where reason = 'demo data removed (launch cleanup)' and action = 'DELETE'),
  'the deletions are audited and the audit log is kept');

select * from finish();
rollback;
