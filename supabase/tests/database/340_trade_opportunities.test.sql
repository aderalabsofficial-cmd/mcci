-- Trade opportunities (migration 0540): post → approval → interest (once) → withdraw; expiry; MCCI inquiries.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

create temp table _o (id uuid) on commit drop;
grant all on _o to authenticated;

select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'select api.opp_post(tests.id(''company_a''), ''Need cotton yarn'', ''500 kg cotton yarn every month'', null, null, 30)') $$,
  '42501', null, 'a Viewer (events level 1) cannot post');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.opp_post(tests.id(''company_b''), ''Need cotton yarn'', ''500 kg cotton yarn every month'', null, null, 30)') $$,
  '42501', null, 'nor post for another company');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into _o select api.opp_post(tests.id(''company_a''), ''Need cotton yarn'', ''500 kg cotton yarn every month'', ''Textile'', ''Pakistan'', 30)') $$,
  'the Owner posts a requirement');
select is((select status from public.opportunities where id = (select id from _o)), 'Pending', 'it waits for MCCI approval');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.opportunities where id = (select id from _o)'), 0::bigint,
  'other members do not see a pending post');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.opp_interest((select id from _o), tests.id(''company_b''), ''We can supply'')') $$,
  'P0001', null, 'nobody can answer it before it is published');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.opp_decide((select id from _o), true, null)') $$,
  '42501', null, 'a member cannot publish');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.opp_decide((select id from _o), true, null)') $$, 'staff publish it');
select ok(exists (select 1 from public.notifications where company_id = tests.id('company_a') and template = 'opp_published'),
  'the posting company is notified');
select lives_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.opp_interest((select id from _o), tests.id(''company_b''), ''We can supply'')') $$,
  'another member expresses interest');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.opp_interest((select id from _o), tests.id(''company_b''), ''Again'')') $$,
  'P0001', 'already interested', 'only once per company');
select lives_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.opp_withdraw_interest((select id from _o), tests.id(''company_b''))') $$,
  'and may withdraw');
update public.opportunities set expires_at = current_date - 1 where id = (select id from _o);
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.opp_interest((select id from _o), tests.id(''company_b''), ''Late'')') $$,
  'P0001', 'not open', 'an expired post cannot be answered');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.opp_share(''EU buyer seeks bed linen'', ''A German retailer looks for cotton bed linen suppliers.'', ''Textile'', ''Germany'', 60)') $$,
  'MCCI shares a buyer inquiry, published at once');

select * from finish();
rollback;
