-- Company boundary, members, directory, company users. Findings F-03 (A2), F-20.
select no_plan();

-- NT-10 / NT-11 (F-03, A2): no "any signed-in user reads every member" any more
select is(tests.num_as(tests.id('fresh'), 'select count(*) from public.members'), 0::bigint, 'NT-10 new account sees no members');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.members'), 0::bigint, 'NT-11 applicant company sees no other members');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.members'), 1::bigint, 'a member company sees its own membership');
select is(tests.num_as(tests.id('mo'), 'select count(*) from public.members'), 2::bigint, 'staff (mem/reg >= 1) see members');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.members where serial is not null or public_listing = false'), 1::bigint, 'own unlisted row visible to its own company only');

-- public directory: listed members only, fixed public columns, anonymous allowed
select is(tests.num_as(null, 'select count(*) from public.public_directory'), 1::bigint, 'directory shows listed members only (B is unlisted)');
select throws_ok($$ select tests.exec_as(null, 'select count(*) from public.members') $$, '42501', null, 'anonymous cannot read members');
select columns_are('public', 'public_directory', array['member_no','company','class','sector','status','valid_to'], 'directory exposes only public columns');

-- companies
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.companies'), 1::bigint, 'a user sees only own companies');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.companies set name = ''x'' where id = tests.id(''company_a'')') $$, '42501', null, 'company particulars change only via change requests / api');

-- F-20 / NT-51, NT-52: company users
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.company_users (company_id, user_id, role) values (tests.id(''company_a''), tests.id(''owner_b''), ''Owner'')') $$, '42501', null, 'NT-52 Owner cannot add users directly (invitation flow only)');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.company_users set role = ''Owner'' where user_id = tests.id(''viewer_a'')') $$, '42501', null, 'NT-52 roles change only through api.*');
select throws_ok($$ delete from public.company_users where user_id = tests.id('owner_b') $$, '23514', null, 'NT-51 the last Owner cannot be removed (even by the owner role)');
select throws_ok($$ update public.company_users set role = 'Viewer' where user_id = tests.id('owner_b') $$, '23514', null, 'NT-51 the last Owner cannot be demoted');
select lives_ok($$ update public.company_users set role = 'Viewer' where user_id = tests.id('manager_a') $$, 'non-Owner roles can change (via trusted path)');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.company_users'), 5::bigint, 'Owner sees own company users');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.company_users'), 1::bigint, 'other company sees only its own');

-- member company role matrix (docs/06 "Member company roles")
select is(private.company_role_level('Owner', 'pay'), 3::smallint, 'Owner pay 3');
select is(private.company_role_level('Manager', 'profile'), 1::smallint, 'Manager profile 1');
select is(private.company_role_level('Services', 'svc'), 2::smallint, 'Services svc 2');
select is(private.company_role_level('Services', 'pay'), 0::smallint, 'Services pay 0');
select is(private.company_role_level('Accounts', 'pay'), 2::smallint, 'Accounts pay 2');
select is(private.company_role_level('Accounts', 'events'), 0::smallint, 'Accounts events 0');
select is(private.company_role_level('Viewer', 'mship'), 1::smallint, 'Viewer mship 1');

select * from finish();
