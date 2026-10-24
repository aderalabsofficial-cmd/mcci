-- Invitations and role assignments (migration 0280). Personas from supabase/seed.sql.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(32);

-- helper: run one statement as a user and keep its single text result (tests.num_as returns numbers only)
create function pg_temp.text_as(p_uid uuid, p_sql text) returns text language plpgsql as $$
declare v text;
begin
  perform tests._become(p_uid, 'authenticated');
  execute p_sql into v;
  perform tests._restore();
  return v;
exception when others then
  perform tests._restore();
  raise;
end $$;

-- ───────── who may invite ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.invite_staff(''new.officer@test.local'', ''New'', ''Membership Officer'')') $$,
  '42501', null, 'a Membership Officer (staff level 0) cannot invite staff');
select throws_ok($$ select tests.exec_as(null, 'select api.invite_staff(''x@test.local'', ''X'', ''Membership Officer'')') $$,
  '42501', null, 'anonymous cannot invite');
select throws_ok($$ select tests.exec_as(tests.id('manager_a'), 'select api.invite_company_user(tests.id(''company_a''), ''c1@test.local'', ''C1'', ''Viewer'')') $$,
  '42501', null, 'a Manager cannot invite colleagues (Owner only, docs/06)');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.invite_company_user(tests.id(''company_a''), ''c1@test.local'', ''C1'', ''Viewer'')') $$,
  '42501', null, 'another company''s Owner cannot invite to company A');

-- ───────── staff invitation by the Secretary General ─────────
select ok(length(pg_temp.text_as(tests.id('sg'), 'select token from api.invite_staff(''new.officer@test.local'', ''New Officer'', ''Membership Officer'')')) >= 40,
  'the SG gets a long random token once');
select is((select status::text from public.invitations where email = 'new.officer@test.local'), 'Invited', 'invitation stored as Invited');
select is((select length(token_hash) from public.invitations where email = 'new.officer@test.local'), 64, 'only a sha256 hash is stored');
select ok((select expires_at between now() + interval '6 days 23 hours' and now() + interval '7 days 1 minute'
           from public.invitations where email = 'new.officer@test.local'), 'valid for 7 days');
select throws_ok($$ select pg_temp.text_as(tests.id('sg'), 'select token from api.invite_staff(''new.officer@test.local'', ''Again'', ''Membership Officer'')') $$,
  'P0001', 'already invited', 'a second open invitation for the same email is refused');
select throws_ok($$ select pg_temp.text_as(tests.id('sg'), 'select token from api.invite_staff(''mo@test.local'', ''MO'', ''Membership Officer'')') $$,
  'P0001', 'already staff', 'an active staff member cannot be invited again');
select throws_ok($$ select pg_temp.text_as(tests.id('sg'), 'select token from api.invite_staff(''x@test.local'', ''X'', ''Chief Wizard'')') $$,
  'P0001', 'unknown designation', 'unknown designation refused');
select is(tests.num_as(tests.id('mo'), 'select count(*) from public.invitations'), 0::bigint, 'staff below level 3 see no invitations');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select token_hash from public.invitations') $$,
  '42501', null, 'the token hash is not readable by clients (F-17)');
select ok(not exists (select 1 from public.audit_log where object = 'invitations' and (new_value ? 'token_hash' or old_value ? 'token_hash')),
  'the audit log never holds the token hash');

-- ───────── accept (trusted server = service_role) ─────────
select ok(not has_function_privilege('authenticated', 'api.invite_accept(text, uuid)', 'execute'), 'clients cannot call invite_accept');
select ok(not has_function_privilege('anon', 'api.invite_lookup(text)', 'execute'), 'clients cannot call invite_lookup');

-- a fresh invitation for the seed user "fresh" (no company, not staff), as company Viewer of A, with a known token
create temp table _t (token text) on commit drop;
insert into _t select pg_temp.text_as(tests.id('owner_a'),
  'select token from api.invite_company_user(tests.id(''company_a''), ''fresh@test.local'', ''Fresh'', ''Viewer'')');
select is((select status::text from api.invite_lookup((select token from _t))), 'Invited', 'lookup by token finds it');
select throws_ok($$ select api.invite_accept((select token from _t), tests.id('owner_b')) $$,
  'P0001', 'account email does not match', 'another account cannot accept it');
select lives_ok($$ select api.invite_accept((select token from _t), tests.id('fresh')) $$, 'the invited account accepts');
select is((select role::text from public.company_users where company_id = tests.id('company_a') and user_id = tests.id('fresh')),
  'Viewer', 'the colleague now belongs to company A as Viewer');
select is(tests.num_as(tests.id('fresh'), 'select count(*) from public.companies where id = tests.id(''company_a'')'), 1::bigint,
  'and can read company A through RLS');
select throws_ok($$ select api.invite_accept((select token from _t), tests.id('fresh')) $$,
  'P0001', 'invitation not valid', 'a used link cannot be used again');

-- resend replaces the token; revoke and expiry close the invitation
create temp table _r (old text, new text) on commit drop;
insert into _r (old) select pg_temp.text_as(tests.id('owner_a'),
  'select token from api.invite_company_user(tests.id(''company_a''), ''later@test.local'', ''Later'', ''Accounts'')');
update _r set new = pg_temp.text_as(tests.id('owner_a'),
  format('select api.invite_resend(%L)', (select id from public.invitations where email = 'later@test.local')));
select ok((select old <> new from _r), 'resend issues a new token');
select is((select count(*)::int from api.invite_lookup((select old from _r))), 0, 'the old link no longer resolves');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), format('select api.invite_revoke(%L)', (select id from public.invitations where email = 'later@test.local'))) $$,
  'the Owner cancels the invitation');
select is((select status::text from public.invitations where email = 'later@test.local'), 'Revoked', 'status Revoked');
update public.invitations set status = 'Invited', expires_at = now() - interval '1 minute' where email = 'new.officer@test.local';
-- (two statements: invite_lookup is STABLE and would not see a token written by the same statement)
create temp table _e (token text) on commit drop;
insert into _e select pg_temp.text_as(tests.id('sg'), format('select api.invite_resend(%L)', id))
  from public.invitations where email = 'new.officer@test.local';
select is((select status::text from api.invite_lookup((select token from _e))), 'Invited',
  'an expired invitation can be sent again with a new 7-day link');

-- ───────── role assignments ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), format('select api.staff_update(%L, ''Auditor (read-only)'', true)', tests.id('accounts_staff'))) $$,
  '42501', null, 'only staff level 3 change staff records');
select throws_ok($$ select tests.exec_as(tests.id('sg'), format('select api.staff_update(%L, ''Membership Officer'', true)', tests.id('sg'))) $$,
  'P0001', 'cannot change your own staff record', 'nobody changes their own staff record');
select lives_ok($$ select tests.exec_as(tests.id('sg'), format('select api.staff_update(%L, ''Membership Officer'', false)', tests.id('mo'))) $$,
  'the SG deactivates the Membership Officer');
select is(tests.num_as(tests.id('mo'), 'select private.staff_level(''mem'')'), 0::bigint, 'a deactivated officer keeps no access (F-08)');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), format('select api.company_user_update(%L, %L, ''Viewer'', true)', tests.id('company_a'), tests.id('owner_a'))) $$,
  '23514', null, 'the last active Owner cannot demote themselves (F-20)');

select * from finish();
rollback;
