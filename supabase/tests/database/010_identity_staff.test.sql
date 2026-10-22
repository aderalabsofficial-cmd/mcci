-- Identity, staff permissions, per-user tables. Findings F-08, F-15, F-17.
select no_plan();

-- F-15 / NT-08: profile self-service is limited to full_name, mobile, lang, prefs
select hasnt_column('public', 'profiles', 'is_staff', 'F-15 profiles.is_staff removed (authority is public.staff)');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.profiles set full_name = ''Owner A2'', lang = ''ur'' where id = tests.id(''owner_a'')') $$, 'user updates own name and language');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.profiles set email = ''x@test.local'' where id = tests.id(''owner_a'')') $$, '42501', null, 'NT-08 user cannot change email outside Auth');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.profiles set cnic = ''1'' where id = tests.id(''owner_a'')') $$, '42501', null, 'NT-08 user cannot change CNIC directly');
-- NT-09: another user's profile is not updatable (0 rows)
select is(tests.num_as(tests.id('owner_a'), 'with u as (update public.profiles set full_name = ''hack'' where id = tests.id(''owner_b'') returning 1) select count(*) from u'), 0::bigint, 'NT-09 cannot update another profile');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.profiles'), 1::bigint, 'member sees only own profile');
-- email stays in sync with Auth (trigger)
update auth.users set email = 'owner.a.new@test.local' where id = tests.id('owner_a');
select is((select email::text from public.profiles where id = tests.id('owner_a')), 'owner.a.new@test.local', 'profile email follows auth.users');

-- F-08 / NT-50: a deactivated staff user keeps nothing, not even a per-person override
select is(tests.num_as(tests.id('inactive_mo'), 'select private.staff_level(''mem'')'), 0::bigint, 'NT-50 inactive staff override ignored');
select is(tests.num_as(tests.id('inactive_mo'), 'select count(*) from public.applications'), 0::bigint, 'NT-50 inactive staff reads no applications');
select is(tests.num_as(tests.id('mo'), 'select private.staff_level(''mem'')'), 2::bigint, 'Membership Officer mem = 2 (docs/06)');
select is(tests.num_as(tests.id('sg'), 'select private.staff_level(''plat'')'), 3::bigint, 'Secretary General plat = 3');
select is(tests.num_as(tests.id('president'), 'select private.staff_level(''svc'')'), 3::bigint, 'President svc = 3 (signatory)');
select is(tests.num_as(tests.id('president'), 'select private.staff_level(''cmt'')'), 1::bigint, 'President cmt = 1 (view)');
select is(tests.num_as(tests.id('owner_a'), 'select private.staff_level(''mem'')'), 0::bigint, 'a member has no staff level');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.staff'), 0::bigint, 'members cannot list staff');
select is(tests.num_as(tests.id('auditor'), 'select count(*) from public.staff'), 8::bigint, 'staff can list staff');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'update public.staff set active = true where user_id = tests.id(''inactive_mo'')') $$, '42501', null, 'staff changes go through api.* only (no direct update)');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'insert into public.staff_permission_overrides (user_id, module, level, reason) values (tests.id(''mo''), ''plat'', 3, ''x'')') $$, '42501', null, 'overrides change only through api.*');

-- F-17 / NT-49: invitation token hashes are never readable
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select token_hash from public.invitations') $$, '42501', null, 'NT-49 Owner cannot read token_hash');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select token_hash from public.invitations') $$, '42501', null, 'NT-49 even staff cannot read token_hash');
select is(tests.num_as(tests.id('owner_a'), 'select count(id) from public.invitations'), 1::bigint, 'Owner sees the invitation of their company');
select is(tests.num_as(tests.id('manager_a'), 'select count(id) from public.invitations'), 0::bigint, 'Manager (profile = 1) does not');
select is(tests.num_as(tests.id('owner_b'), 'select count(id) from public.invitations'), 0::bigint, 'other company does not');
select is(tests.num_as(tests.id('sg'), 'select count(id) from public.invitations'), 1::bigint, 'staff manager (staff = 3) sees invitations');

-- consents (E5): own rows only; user_id cannot be chosen
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.consents (document, version) values (''terms'', ''2026-10'')') $$, 'user records own consent');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.consents (user_id, document, version) values (tests.id(''owner_b''), ''terms'', ''2026-10'')') $$, '42501', null, 'cannot record consent for someone else');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.consents'), 0::bigint, 'consents are private');

-- device tokens (docs/15 §6): own rows only; staff cannot read tokens
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.device_tokens (token) values (''tok-a'')') $$, 'user registers own device token');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.device_tokens'), 0::bigint, 'other users cannot see tokens');
select is(tests.num_as(tests.id('sg'), 'select count(*) from public.device_tokens'), 0::bigint, 'staff cannot see tokens (docs/15 §6)');

-- account deletion requests (C2): own; staff reg >= 3 only
select lives_ok($$ select tests.exec_as(tests.id('viewer_a'), 'insert into public.account_deletion_requests (reason) values (''leaving'')') $$, 'user requests account deletion');
select is(tests.num_as(tests.id('sg'), 'select count(*) from public.account_deletion_requests'), 1::bigint, 'SG (reg 3) sees deletion requests');
select is(tests.num_as(tests.id('mo'), 'select count(*) from public.account_deletion_requests'), 0::bigint, 'Membership Officer (reg 2) does not');
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'update public.account_deletion_requests set status = ''Approved''') $$, '42501', null, 'user cannot approve own deletion');

-- audit: staff/audit level 1 reads, members do not
select ok(tests.num_as(tests.id('auditor'), 'select count(*) from public.audit_log') > 0, 'Auditor reads the audit log');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.audit_log'), 0::bigint, 'members cannot read the audit log');
select is(tests.num_as(tests.id('mo'), 'select count(*) from public.audit_log'), 0::bigint, 'staff without staff/audit level cannot read it');

select * from finish();
