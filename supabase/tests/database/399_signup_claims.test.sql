-- Sign-up and existing members' claims (migration 0680): the name and mobile saved (one account per mobile), a claim
-- matched to the register by number (with or without leading zeros) or by company name, one waiting claim per person,
-- no new application meanwhile, staff of the register approve (the account joins the member's company) or reject with
-- a reason, the person is told; members see only their own claims.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(20);

-- two new people who just confirmed their email code
create temp table t_u on commit drop as select gen_random_uuid() as a, gen_random_uuid() as b;
grant select on t_u to authenticated;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', x.id, 'authenticated', 'authenticated', x.email, '{"signup_started": true}', now(), now()
  from (select a as id, 'claim.a@test.local' as email from t_u union all select b, 'claim.b@test.local' from t_u) x;
create function pg_temp.as_a(q text) returns void language sql as $$ select tests.exec_as((select a from t_u), q) $$;
create function pg_temp.as_b(q text) returns void language sql as $$ select tests.exec_as((select b from t_u), q) $$;

-- ───────── finishing sign-up ─────────
select lives_ok($$ select pg_temp.as_a('select api.signup_finish(''Asif Claimant'', ''03211234567'')') $$, 'name and mobile saved');
select results_eq($$ select full_name, mobile from public.profiles where id = (select a from t_u) $$,
  $$ values ('Asif Claimant', '03211234567') $$, 'on the profile');
select throws_ok($$ select pg_temp.as_b('select api.signup_finish(''Bilal'', ''03211234567'')') $$, 'P0001', null, 'a mobile with an account is refused');
select throws_ok($$ select pg_temp.as_b('select api.signup_finish(''Bilal'', ''12345'')') $$, 'P0001', null, 'not a mobile number');
select lives_ok($$ select pg_temp.as_b('select api.signup_finish(''Bilal Claimant'', ''03211234568'')') $$, 'another mobile is fine');

-- ───────── the claim ─────────
-- member B of the seed is MCCI-C-9001: typed as 9001 (and as 09001) it matches
select throws_ok($$ select pg_temp.as_a('select api.claim_submit(''Corporate'', ''90a1'', null)') $$, 'P0001', null, 'digits only');
select throws_ok($$ select pg_temp.as_a('select api.claim_submit(''Corporate'', null, '' '')') $$, 'P0001', null, 'a number or a company name');
select lives_ok($$ select pg_temp.as_a('select api.claim_submit(''Corporate'', ''09001'', null)') $$, 'claimed by number');
select results_eq($$ select member_no, match_member = tests.id('member_b'), status from public.membership_claims where user_id = (select a from t_u) $$,
  $$ values ('MCCI-C-09001', true, 'pending') $$, 'matched to member B (leading zero ignored)');
select throws_ok($$ select pg_temp.as_a('select api.claim_submit(''Corporate'', ''9001'', null)') $$, 'P0001', null, 'one waiting claim per person');
select throws_ok($$ select pg_temp.as_a('select * from api.app_start()') $$, 'P0001', null, 'no new application while the claim waits');
select lives_ok($$ select pg_temp.as_b('select api.claim_submit(''Corporate'', null, ''Company B (member)'')') $$, 'claimed by company name');
select ok((select match_member = tests.id('member_b') from public.membership_claims where user_id = (select b from t_u)), 'matched by a close company name');

-- who sees what
select is(tests.num_as((select a from t_u), 'select count(*) from public.membership_claims'), 1::bigint, 'a person sees only their own claim');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.membership_claims'), 0::bigint, 'a member sees none of these');

-- ───────── decisions ─────────
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), format('select api.claim_decide(%%L, true)', %L)) $$,
  (select id from public.membership_claims where user_id = (select a from t_u))), '42501', null, 'members cannot decide');
select lives_ok(format($$ select tests.exec_as(tests.id('mo'), format('select api.claim_decide(%%L, true, null, ''Owner'', null)', %L)) $$,
  (select id from public.membership_claims where user_id = (select a from t_u))), 'the Membership Officer approves with the match');
select ok(exists (select 1 from public.company_users cu join public.members m on m.company_id = cu.company_id
                   where cu.user_id = (select a from t_u) and m.id = tests.id('member_b') and cu.role = 'Owner'), 'the account joined member B''s company');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), format('select api.claim_decide(%%L, false, null, ''Owner'', '' '')', %L)) $$,
  (select id from public.membership_claims where user_id = (select b from t_u))), 'P0001', null, 'a rejection needs a reason');
select lives_ok(format($$ select tests.exec_as(tests.id('mo'), format('select api.claim_decide(%%L, false, null, ''Owner'', ''Not in our register under this name'')', %L)) $$,
  (select id from public.membership_claims where user_id = (select b from t_u))), 'rejected with a reason');

select * from finish();
rollback;
