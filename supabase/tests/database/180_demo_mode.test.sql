-- Demo mode (migration 0350): labelled demo members and applicants use the real workflow but stay apart from
-- official data — no official numbers, no mixing with real applicants or members, no committee decision — and are
-- removed in one step.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(24);

create temp table t_seq on commit drop as select last_value, is_called from public.member_no_a;
create temp table t_counts on commit drop as select (select count(*) from public.members) as members, (select count(*) from public.companies) as companies;

-- who may add demo accounts
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.demo_add(''member'', ''X'', ''Associate'', ''Rep X'', ''x@test.local'', ''X'')') $$, '42501', null, 'a Membership Officer (reg 2) cannot');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.demo_add(''member'', ''X'', ''Associate'', ''Rep X'', ''x@test.local'', ''X'')') $$, '42501', null, 'members cannot');
select throws_ok($$ select tests.exec_as_aal1(tests.id('sg'), 'select * from api.demo_add(''member'', ''X'', ''Associate'', ''Rep X'', ''x@test.local'', ''X'')') $$, '42501', null, 'not without the 2-step login');

-- the SG adds two demo members and a demo applicant
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_add(''member'', ''Alpha Traders'', ''Associate'', ''Demo Proposer'', ''demo1@test.local'', ''Demo One'') r where r.member_no = ''DEMO-A-01'' and r.token is not null'), 1::bigint, 'demo member 1: DEMO-A-01, owner invited');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_add(''member'', ''Beta Traders'', ''Associate'', ''Demo Seconder'', ''demo2@test.local'', ''Demo Two'') r where r.member_no = ''DEMO-A-02'''), 1::bigint, 'demo member 2: DEMO-A-02');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_add(''applicant'', ''Gamma Traders'', ''Associate'', ''Demo Applicant'', ''demo3@test.local'', ''Demo Three'') r where r.member_no is null'), 1::bigint, 'demo applicant: company only, no member number');
select results_eq($$ select c.name, m.status::text, m.public_listing, c.demo, c.demo_expires_at > now() + interval '6 days'
                     from public.members m join public.companies c on c.id = m.company_id where m.member_no = 'DEMO-A-01' $$,
  $$ values ('DEMO — Alpha Traders', 'Permanent', false, true, true) $$, 'labelled DEMO, Permanent (as eligible members are), not listed publicly, expires');
select results_eq($$ select last_value, is_called from public.member_no_a $$, $$ select last_value, is_called from t_seq $$, 'the official membership-number sequence is untouched');

-- the demo applicant's application (as after accepting the invitation and starting the form)
insert into public.company_users (company_id, user_id, role)
select c.id, tests.id('fresh'), 'Owner' from public.companies c where c.name = 'DEMO — Gamma Traders';
insert into public.applications (id, company_id, created_by, stage, form)
select 'd3000000-0000-0000-0000-0000000000d3', c.id, tests.id('fresh'), 'draft', '{"biz":"prop","rep":"Demo Applicant","name":"Gamma Traders"}'
from public.companies c where c.name = 'DEMO — Gamma Traders';

-- demo and real are kept apart
select is(tests.num_as(tests.id('fresh'), 'select count(*) from api.end_candidates(''d3000000-0000-0000-0000-0000000000d3'', ''proposer'') c where c.member_no like ''DEMO-%'' and c.why is null'), 2::bigint, 'the demo applicant sees the two demo members, both eligible');
select is(tests.num_as(tests.id('fresh'), 'select count(*) from api.end_candidates(''d3000000-0000-0000-0000-0000000000d3'', ''proposer'') c where c.member_no not like ''DEMO-%'''), 0::bigint, 'and no real member');
update public.applications set form = '{"biz":"prop","rep":"Owner A","name":"A Industries"}', stage = 'draft' where id = tests.id('app_a_draft');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.end_candidates(tests.id(''app_a_draft''), ''proposer'') c where c.member_no like ''DEMO-%'''), 0::bigint, 'a real applicant never sees demo members');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.end_request(tests.id(''app_a_draft''), ''proposer'', (select id from public.members where member_no = ''DEMO-A-01''), ''x'')') $$, 'P0001', null, 'and cannot ask one (server-side check)');
select is((select private.endorse_why('d3000000-0000-0000-0000-0000000000d3', 'proposer', tests.id('member_b'))), 'Not a demo member', 'a real member cannot endorse a demo application');

-- the demo applicant asks; the demo member signs with the code (same rules as real members)
create temp table t_dm on commit drop as select id from public.members where member_no = 'DEMO-A-01';
grant select on t_dm to authenticated;
select lives_ok($$ select tests.exec_as(tests.id('fresh'), 'select * from api.end_request(''d3000000-0000-0000-0000-0000000000d3'', ''proposer'', (select id from t_dm), ''Kindly propose'')') $$, 'the demo applicant sends the proposer request');
select is((select status::text from public.endorsements where application_id = 'd3000000-0000-0000-0000-0000000000d3'), 'Pending', 'pending like any request');

-- never on the committee's agenda, never decided
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC demo test'', (now() at time zone ''Asia/Karachi'')::date)') $$, 'a meeting is open');
update public.applications set stage = 'committee', class = 'Associate' where id = 'd3000000-0000-0000-0000-0000000000d3';
select is((select count(*) from public.committee_items where application_id = 'd3000000-0000-0000-0000-0000000000d3'), 0::bigint, 'a demo file is not placed on the agenda');
insert into public.committee_items (application_id, meeting_id) select 'd3000000-0000-0000-0000-0000000000d3', id from public.meetings where name = 'MC demo test';
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide(''d3000000-0000-0000-0000-0000000000d3'', (select id from public.meetings where name = ''MC demo test''), ''Approved'')') $$, 'P0001', null, 'and never approved (no number, no voucher) even if placed by hand');

-- one-step removal
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.demo_clear()') $$, '42501', null, 'only reg ≥ 3 removes demo data');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_clear() r where r.kind = ''company'''), 3::bigint, 'the SG removes the demo data (3 companies)');
select is((select count(*) from public.companies where demo), 0::bigint, 'no demo company left');
select is((select count(*) from public.applications where id = 'd3000000-0000-0000-0000-0000000000d3'), 0::bigint, 'the demo application and its endorsements are gone');
select results_eq($$ select (select count(*) from public.members), (select count(*) from public.companies) $$, $$ select members, companies from t_counts $$, 'official members and companies exactly as before');
select ok(not has_function_privilege('anon', 'api.demo_add(text,text,public.member_class,text,text,text,int)', 'execute')
      and not has_function_privilege('anon', 'api.demo_clear()', 'execute')
      and not has_function_privilege('authenticated', 'private.company_is_demo(uuid)', 'execute'), 'grants: no anonymous execute; the helper is private');

select * from finish();
rollback;
