-- api.my_access() (migration 0270): the caller's own access for server-side permission checks (M1, docs/06).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(20);

-- the function itself: definer, empty search_path, callable by signed-in users only
select is((select prosecdef from pg_proc where oid = 'api.my_access()'::regprocedure), true, 'security definer');
select ok(exists (select 1 from pg_proc p, unnest(p.proconfig) c
                  where p.oid = 'api.my_access()'::regprocedure and c = 'search_path=""'),
          'search_path is empty (F-14)');
select ok(not has_function_privilege('anon', 'api.my_access()', 'execute'), 'anon cannot execute');
select ok(has_function_privilege('authenticated', 'api.my_access()', 'execute'), 'authenticated can execute');
select throws_ok($$ select api.my_access() $$, '42501', null, 'no session (auth.uid() null) → not allowed');

-- members: own companies with the docs/06 matrix, no staff block
select is(tests.num_as(tests.id('owner_a'), 'select jsonb_array_length(api.my_access()->''companies'')'), 1::bigint,
          'Owner A belongs to exactly one company');
select is(tests.num_as(tests.id('owner_a'),
          'select ((api.my_access()->''companies''->0->>''id'') = tests.id(''company_a'')::text)::int'), 1::bigint,
          'that company is A');
select is(tests.num_as(tests.id('owner_a'), 'select (api.my_access()->''companies''->0->''levels''->>''mship'')::bigint'),
          3::bigint, 'Owner: mship 3');
select is(tests.num_as(tests.id('services_a'), 'select (api.my_access()->''companies''->0->''levels''->>''svc'')::bigint'),
          2::bigint, 'Services: svc 2');
select is(tests.num_as(tests.id('services_a'), 'select (api.my_access()->''companies''->0->''levels''->>''pay'')::bigint'),
          0::bigint, 'Services: pay 0');
select is(tests.num_as(tests.id('accounts_a'), 'select (api.my_access()->''companies''->0->''levels''->>''pay'')::bigint'),
          2::bigint, 'Accounts: pay 2');
select is(tests.num_as(tests.id('owner_a'), 'select (jsonb_typeof(api.my_access()->''staff'') = ''null'')::int'), 1::bigint,
          'a member has no staff block');
select is(tests.num_as(tests.id('owner_b'),
          'select count(*) from jsonb_array_elements(api.my_access()->''companies'') e where e->>''id'' = tests.id(''company_a'')::text'),
          0::bigint, 'Owner B does not see company A');
select is(tests.num_as(tests.id('fresh'), 'select jsonb_array_length(api.my_access()->''companies'')'), 0::bigint,
          'a new user has no company');
select is(tests.num_as(tests.id('owner_a'),
          'select ((api.my_access()->>''user_id'') = tests.id(''owner_a'')::text)::int'), 1::bigint,
          'returns the caller, not anyone else');

-- staff: designation and module levels; deactivated staff get nothing (F-08)
select is(tests.num_as(tests.id('mo'), 'select (api.my_access()->''staff''->''levels''->>''mem'')::bigint'), 2::bigint,
          'Membership Officer: mem 2');
select is(tests.num_as(tests.id('sg'), 'select (api.my_access()->''staff''->''levels''->>''plat'')::bigint'), 3::bigint,
          'Secretary General: plat 3');
select is(tests.num_as(tests.id('sg'), 'select (api.my_access()->''staff''->>''seniority'')::bigint'), 5::bigint,
          'Secretary General: seniority 5');
select is(tests.num_as(tests.id('inactive_mo'), 'select (jsonb_typeof(api.my_access()->''staff'') = ''null'')::int'),
          1::bigint, 'deactivated staff: no staff block, even with an override');
select is(tests.num_as(tests.id('mo'), 'select ((api.my_access()->''mfa''->>''totp_verified'')::boolean)::int'), 0::bigint,
          'no verified TOTP factor yet');

select * from finish();
rollback;
