-- Staff list, company colleagues, designation limits and 2-step reset (migration 0290). Personas from supabase/seed.sql.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(32);

-- ───────── api.staff_directory ─────────
select throws_ok($$ select tests.exec_as(null, 'select * from api.staff_directory()') $$,
  '42501', null, 'anonymous cannot list staff');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.staff_directory()') $$,
  '42501', null, 'a member cannot list staff');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.staff_directory()') $$,
  '42501', null, 'a Membership Officer (staff level 0) cannot list staff');
select throws_ok($$ select tests.exec_as(tests.id('inactive_mo'), 'select * from api.staff_directory()') $$,
  '42501', null, 'a deactivated staff member cannot list staff');
select is(tests.num_as(tests.id('auditor'), 'select count(*) from api.staff_directory()'),
  (select count(*) from public.staff), 'the Auditor (staff level 1) sees every staff record, active and not');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.staff_directory() where email = ''mo@test.local'' and designation = ''Membership Officer'''),
  1::bigint, 'the SG sees names, emails and designations');

-- ───────── api.company_people ─────────
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.company_people(tests.id(''company_a''))') $$,
  '42501', null, 'another company''s Owner cannot list company A''s people');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.company_people(tests.id(''company_a''))') $$,
  '42501', null, 'staff do not use the member function');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.company_people(null)') $$,
  '42501', null, 'a null company is refused');
select is(tests.num_as(tests.id('viewer_a'), 'select count(*) from api.company_people(tests.id(''company_a''))'),
  5::bigint, 'a Viewer (profile level 1) sees the five colleagues of company A');
select is(tests.num_as(tests.id('viewer_a'), 'select count(*) from api.company_people(tests.id(''company_a'')) where email = ''owner.b@test.local'''),
  0::bigint, 'no one from another company is listed');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.profiles'),
  1::bigint, 'profiles stay own-row only for members (the function is the only way to colleagues)');

-- ───────── designation limits: saved per designation after a password confirmation (0400) ─────────
select throws_ok($q$ select tests.exec_as(tests.id('auditor'), 'select api.role_permissions_save(''Membership Officer'', ''{"cmt": 1}'')') $q$,
  '42501', null, 'the Auditor (staff level 1) cannot change limits');
select throws_ok($q$ select tests.exec_as(tests.id('owner_a'), 'select api.role_permissions_save(''Membership Officer'', ''{"cmt": 1}'')') $q$,
  '42501', null, 'a member cannot change limits');
select throws_ok($q$ select tests.exec_as(tests.id('sg'), 'select api.role_permissions_save(''Secretary General'', ''{"cmt": 0}'')') $q$,
  'P0001', 'Secretary General keeps full control', 'the Secretary General''s own limits are fixed');
select throws_ok($q$ select tests.exec_as(tests.id('sg'), 'select api.role_permissions_save(''Membership Officer'', ''{"nope": 1}'')') $q$,
  'P0001', 'unknown module', 'unknown module refused');
select throws_ok($q$ select tests.exec_as(tests.id('sg'), 'select api.role_permissions_save(''Membership Officer'', ''{"cmt": 4}'')') $q$,
  'P0001', 'level out of range', 'level above 3 refused');
select throws_ok($q$ select tests.exec_as(tests.id('sg'), 'select api.role_permissions_save(''Membership Officer'', ''{"cmt": 2}'')') $q$,
  'P0001', 'confirm with your password', 'not without the password confirmation');
select throws_ok($q$ select tests.exec_as(tests.id('sg'), 'select api.role_permission_set(''Membership Officer'', ''cmt'', 2::smallint)') $q$,
  '42501', null, 'the one-cell change (no password) is no longer callable');
select ok(not has_function_privilege('authenticated', 'api.reauth_mark(uuid)', 'execute') and not has_function_privilege('anon', 'api.reauth_mark(uuid)', 'execute'),
  'only the server records a password confirmation');
select api.reauth_mark(tests.id('sg'));
select is(tests.num_as(tests.id('sg'), 'select api.role_permissions_save(''Membership Officer'', ''{"cmt": 2, "dash": 1}'')'),
  1::bigint, 'after the password check the SG saves the designation (one level changed)');
select is(tests.num_as(tests.id('mo'), 'select (api.my_access() -> ''staff'' -> ''levels'' ->> ''cmt'')::int'),
  2::bigint, 'the new limit applies to the Membership Officer at once');
select ok(exists (select 1 from public.audit_log where object = 'role_permissions' and reason like 'designation limits saved after password confirmation%'
                  and user_id = tests.id('sg')), 'the change is audited with who and why');
select throws_ok($q$ select tests.exec_as(tests.id('sg'), 'select api.role_permissions_save(''Membership Officer'', ''{"cmt": 1}'')') $q$,
  'P0001', 'confirm with your password', 'the confirmation is used up by the change');
select throws_ok($q$ select tests.exec_as(tests.id('sg'), 'select api.role_permissions_reset()') $q$,
  'P0001', 'confirm with your password', 'reset to defaults needs the password too');
select api.reauth_mark(tests.id('sg'));
select lives_ok($q$ select tests.exec_as(tests.id('sg'), 'select api.role_permissions_reset()') $q$, 'the SG resets to defaults');
select is((select level from public.role_permissions where designation = 'Membership Officer' and module = 'cmt'),
  (select level from private.role_permission_defaults where designation = 'Membership Officer' and module = 'cmt'),
  'the default limit is back');

-- ───────── api.staff_mfa_reset ─────────
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select api.staff_mfa_reset(tests.id(''mo''))') $$,
  '42501', null, 'the Auditor cannot reset 2-step login');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.staff_mfa_reset(tests.id(''sg''))') $$,
  'P0001', 'cannot reset your own 2-step login here', 'nobody resets their own 2-step login here');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.staff_mfa_reset(tests.id(''owner_a''))') $$,
  'P0001', 'not a staff member', 'only staff records');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.staff_mfa_reset(tests.id(''mo''))') $$
  , 'the SG resets a colleague''s 2-step login');
select ok(exists (select 1 from public.audit_log where action = 'staff.reset2fa' and object_id = tests.id('mo')::text
                  and user_id = tests.id('sg')), 'the reset is audited even when no row changes');

select * from finish();
rollback;
