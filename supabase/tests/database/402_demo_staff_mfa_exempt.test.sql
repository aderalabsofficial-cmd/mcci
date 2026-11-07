-- Demo staff 2-step exemption (0710): only active staff at @demo.mcci.test, only until mfa_exempt_until, never real
-- staff; staff cannot set it themselves; the change is audited.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

-- the membership officer persona plays a demo staff account; the Secretary General stays a real one
update auth.users set email = 'demo.mo@demo.mcci.test' where id = tests.id('mo');

select is(tests.num_as_aal1(tests.id('mo'), 'select private.staff_level(''mem'')'), 0::bigint,
  'without an exemption a password-only session has no staff level');

select private.set_reason('test: demo staff exemption');
update public.staff set mfa_exempt_until = now() + interval '1 day' where user_id in (tests.id('mo'), tests.id('sg'));

select ok(tests.num_as_aal1(tests.id('mo'), 'select private.staff_level(''mem'')') > 0,
  'an exempted demo staff account has its staff level with a password-only session');
select is(tests.num_as_aal1(tests.id('mo'), 'select api.my_mfa_exempt()::int'), 1::bigint, 'and the app is told so');
select is(tests.num_as_aal1(tests.id('sg'), 'select private.staff_level(''plat'')'), 0::bigint,
  'a real staff account is never exempted, whatever the column says');
select is(tests.num_as_aal1(tests.id('sg'), 'select api.my_mfa_exempt()::int'), 0::bigint, 'and the app is told so');
select is(tests.num_as(tests.id('sg'), 'select private.staff_level(''plat'')'), 3::bigint,
  'real staff with the authenticator are unaffected');

update public.staff set mfa_exempt_until = now() - interval '1 minute' where user_id = tests.id('mo');
select is(tests.num_as_aal1(tests.id('mo'), 'select private.staff_level(''mem'')'), 0::bigint, 'an expired exemption counts for nothing');

update public.staff set mfa_exempt_until = now() + interval '1 day', active = false, deactivated_at = now() where user_id = tests.id('mo');
select is(tests.num_as_aal1(tests.id('mo'), 'select api.my_mfa_exempt()::int'), 0::bigint, 'nor for an inactive staff row');

select throws_ok($$ select tests.exec_as(tests.id('sg'), 'update public.staff set mfa_exempt_until = now() + interval ''9 days'' where user_id = auth.uid()') $$,
  '42501', null, 'staff cannot exempt themselves over the API');
select ok(exists (select 1 from public.audit_log where object = 'staff' and reason = 'test: demo staff exemption'
                   and new_value ? 'mfa_exempt_until'), 'the exemption is in the audit log');

select * from finish();
rollback;
