-- Mark a self-registered applicant as demo (migration 0405): only reg ≥ 3 with the 2-step login; only while nothing
-- official hangs on the company; afterwards the application finds the demo members, and "remove demo data" removes it.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(17);

-- a demo member, and a real applicant who signed up on their own (as Amir khan on production)
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_add(''member'', ''Alpha Traders'', ''Associate'', ''Demo Proposer'', ''demo1@test.local'', ''Demo One'')'), 1::bigint, 'a demo member exists');
insert into public.companies (id, name, biz_type) values ('d5000000-0000-0000-0000-0000000000d5', 'Delta Traders', 'prop');
insert into public.company_users (company_id, user_id, role) values ('d5000000-0000-0000-0000-0000000000d5', tests.id('fresh'), 'Owner');
insert into public.applications (id, company_id, created_by, stage, class, form)
values ('d5000000-0000-0000-0000-0000000000a5', 'd5000000-0000-0000-0000-0000000000d5', tests.id('fresh'), 'draft', 'Associate',
        '{"biz":"prop","rep":"Delta Rep","name":"Delta Traders"}');
-- and one already at the committee
insert into public.companies (id, name, biz_type) values ('d6000000-0000-0000-0000-0000000000d6', 'Epsilon Traders', 'prop');
insert into public.applications (id, company_id, created_by, stage, class, form)
values ('d6000000-0000-0000-0000-0000000000a6', 'd6000000-0000-0000-0000-0000000000d6', tests.id('fresh'), 'committee', 'Associate',
        '{"biz":"prop","rep":"Epsilon Rep","name":"Epsilon Traders"}');

select is(tests.num_as(tests.id('fresh'), 'select count(*) from api.end_candidates(''d5000000-0000-0000-0000-0000000000a5'', ''proposer'') c where c.member_no like ''DEMO-%'''), 0::bigint, 'before: the real applicant does not see the demo members');

-- who may
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.demo_mark(''d5000000-0000-0000-0000-0000000000d5'')') $$, '42501', null, 'a Membership Officer (reg 2) cannot mark');
select throws_ok($$ select tests.exec_as(tests.id('fresh'), 'select api.demo_mark(''d5000000-0000-0000-0000-0000000000d5'')') $$, '42501', null, 'the applicant cannot mark themselves');
select throws_ok($$ select tests.exec_as_aal1(tests.id('sg'), 'select api.demo_mark(''d5000000-0000-0000-0000-0000000000d5'')') $$, '42501', null, 'not without the 2-step login');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.demo_markable()') $$, '42501', null, 'the list is for reg ≥ 3 too');

-- the list: the self-registered applicant, not the one at the committee, not members
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_markable() where company = ''Delta Traders'' and token is not null and stage = ''draft'''), 1::bigint, 'the SG sees the self-registered applicant');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_markable() where company = ''Epsilon Traders'''), 0::bigint, 'not one past the proposer step');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_markable() m join public.members x on x.company_id = m.company_id'), 0::bigint, 'never a member company');

-- refused when something official hangs on it (checked again in the database)
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.demo_mark(''d6000000-0000-0000-0000-0000000000d6'')') $$, 'P0001', 'cannot mark as demo: too_far', 'refused: past the proposer step');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.demo_mark((select company_id from public.members where id = tests.id(''member_b'')))') $$, 'P0001', 'cannot mark as demo: member', 'refused: a member company');

-- marked
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.demo_mark(''d5000000-0000-0000-0000-0000000000d5'')') $$, 'the SG marks the applicant as demo');
select results_eq($$ select name, demo, demo_expires_at > now() + interval '6 days' from public.companies where id = 'd5000000-0000-0000-0000-0000000000d5' $$,
  $$ values ('DEMO — Delta Traders', true, true) $$, 'labelled DEMO with a removal date');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.demo_mark(''d5000000-0000-0000-0000-0000000000d5'')') $$, 'P0001', 'cannot mark as demo: already', 'not twice');
select is(tests.num_as(tests.id('fresh'), 'select count(*) from api.end_candidates(''d5000000-0000-0000-0000-0000000000a5'', ''proposer'') c where c.member_no like ''DEMO-%'' and c.why is null'), 1::bigint, 'after: the applicant finds the demo member, eligible');

-- removed with the demo data
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.demo_clear() r where r.kind = ''company'' and r.id = ''d5000000-0000-0000-0000-0000000000d5'''), 1::bigint, 'remove demo data removes the marked applicant');
select ok(not exists (select 1 from public.applications where id = 'd5000000-0000-0000-0000-0000000000a5')
      and exists (select 1 from public.applications where id = 'd6000000-0000-0000-0000-0000000000a6')
      and not has_function_privilege('anon', 'api.demo_mark(uuid,int)', 'execute')
      and not has_function_privilege('anon', 'api.demo_markable()', 'execute')
      and not has_function_privilege('authenticated', 'private.demo_mark_why(uuid)', 'execute'),
  'its application is gone, the real one stays; grants: no anonymous execute, the helper is private');

select * from finish();
rollback;
