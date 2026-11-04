-- Server tools for the owner (0660 demo accounts, 0670 pre-launch clean-up): only the service role may call them;
-- demo staff and demo members are made with an audit reason, a missing designation is skipped, removal deactivates
-- staff; the clean-up marks only companies without anything real and marks nothing when one is refused.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

create function pg_temp.svc(q text) returns bigint language sql as $$ select tests.num_as(null, q, 'service_role') $$;

-- ───────── only the service role ─────────
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.demo_accounts_setup(''{}'')') $$, '42501', null, 'staff cannot make demo accounts');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select * from api.launch_cleanup_candidates()') $$, '42501', null, 'staff cannot list clean-up candidates');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.launch_cleanup_mark(''{}'', true)') $$, '42501', null, 'members cannot mark companies');

-- ───────── demo accounts ─────────
-- two new sign-in accounts (a staff account may not belong to a member company)
create temp table t_u on commit drop as select gen_random_uuid() as staff_user, gen_random_uuid() as other;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', x.id, 'authenticated', 'authenticated', x.email, '{}', now(), now()
  from (select staff_user as id, 'demo.staff@demo.mcci.test' as email from t_u
        union all select other, 'demo.member@demo.mcci.test' from t_u) x;
grant select on t_u to service_role;
select is(pg_temp.svc($$ select jsonb_array_length(api.demo_accounts_setup(jsonb_build_object(
  'staff', jsonb_build_array(jsonb_build_object('user', (select staff_user from t_u), 'designation', 'Accounts Officer'),
                             jsonb_build_object('user', (select other from t_u), 'designation', 'Vice President')),
  'companies', jsonb_build_array(jsonb_build_object('user', (select other from t_u), 'company', 'Proposer X', 'class', 'Corporate', 'rep', 'Rep X'))
)))::bigint $$), 3::bigint, 'two staff entries and one company reported');
select is((select designation from public.staff where user_id = (select staff_user from t_u)), 'Accounts Officer', 'an existing designation is given');
select is((select count(*) from public.staff where user_id = (select other from t_u)), 0::bigint, 'a missing designation is skipped');
select results_eq($$ select c.demo, m.status::text, m.member_no like 'DEMO-C-%' from public.companies c join public.members m on m.company_id = c.id
                     where c.name = 'DEMO — Proposer X' $$, $$ values (true, 'Permanent', true) $$, 'a demo member company with a DEMO number');
select ok(exists (select 1 from public.audit_log where reason like 'demo account (owner%'), 'made with an audit reason');
select is(pg_temp.svc($$ select cardinality(api.demo_accounts_remove(array[(select staff_user from t_u), (select other from t_u)]))::bigint $$), 1::bigint,
  'removal returns the demo company for the purge');
select is((select active from public.staff where user_id = (select staff_user from t_u)), false, 'demo staff deactivated, kept for the audit log');

-- ───────── clean-up ─────────
insert into public.companies (id, name, biz_type) values ('cccc0000-0000-0000-0000-000000000001', 'Test leftover', 'prop');
select throws_ok($$ select tests.num_as(null, 'select count(*) from api.launch_cleanup_mark(array[''cccc0000-0000-0000-0000-000000000001''::uuid, tests.id(''company_a'')], true)', 'service_role') $$,
  'P0001', null, 'a company with real records refuses the whole batch');
select is((select demo from public.companies where id = 'cccc0000-0000-0000-0000-000000000001'), false, 'nothing was marked by the refused batch');
select is(pg_temp.svc($$ select count(*) from api.launch_cleanup_mark(array['cccc0000-0000-0000-0000-000000000001'::uuid], true) $$), 1::bigint,
  'a leftover without anything real is accepted');
select is((select demo from public.companies where id = 'cccc0000-0000-0000-0000-000000000001'), true, 'and marked demo for the purge');

select * from finish();
rollback;
