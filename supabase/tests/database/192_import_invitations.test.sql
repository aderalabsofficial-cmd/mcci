-- Invitations for imported members (migration 0406): after a committed import every member it created or updated is
-- invited as Owner, in batches; no email → noted, someone already signed in → not invited again; a failed email is
-- sent again only when asked; only reg ≥ 2 with the 2-step login.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);

-- three members as a committed import created them: with an email, without one, and one whose company has a user
insert into public.companies (id, name, biz_type, email) values
  ('e1000000-0000-0000-0000-0000000000c1', 'Inv One', 'prop', null),
  ('e1000000-0000-0000-0000-0000000000c2', 'Inv Two', 'prop', null),
  ('e1000000-0000-0000-0000-0000000000c3', 'Inv Three', 'prop', 'three@test.local');
insert into public.members (id, member_no, company_id, class, status, rep_name, since, valid_to, imported) values
  ('e1000000-0000-0000-0000-0000000000a1', 'MCCI-A-0811', 'e1000000-0000-0000-0000-0000000000c1', 'Associate', 'Permanent', 'Rep One', '2016-04-01', '2027-03-31', true),
  ('e1000000-0000-0000-0000-0000000000a2', 'MCCI-A-0812', 'e1000000-0000-0000-0000-0000000000c2', 'Associate', 'Permanent', 'Rep Two', '2016-04-01', '2027-03-31', true),
  ('e1000000-0000-0000-0000-0000000000a3', 'MCCI-A-0813', 'e1000000-0000-0000-0000-0000000000c3', 'Associate', 'Permanent', 'Rep Three', '2016-04-01', '2027-03-31', true);
insert into public.company_users (company_id, user_id, role) values ('e1000000-0000-0000-0000-0000000000c3', tests.id('fresh'), 'Owner');
insert into public.imports (id, status, file_name, source) values
  ('e1000000-0000-0000-0000-00000000000f', 'committed', 'm.csv', 'csv'),
  ('e1000000-0000-0000-0000-00000000000e', 'preview', 'p.csv', 'csv');
insert into public.import_rows (import_id, row_no, data, match, decision, result, created_member) values
  ('e1000000-0000-0000-0000-00000000000f', 1, '{"membership_no":"MCCI-A-0811","email":"One@Test.local"}', 'new', 'create', 'created', 'e1000000-0000-0000-0000-0000000000a1'),
  ('e1000000-0000-0000-0000-00000000000f', 2, '{"membership_no":"MCCI-A-0812","email":""}', 'new', 'create', 'created', 'e1000000-0000-0000-0000-0000000000a2'),
  ('e1000000-0000-0000-0000-00000000000f', 3, '{"membership_no":"MCCI-A-0813"}', 'new', 'create', 'created', 'e1000000-0000-0000-0000-0000000000a3'),
  ('e1000000-0000-0000-0000-00000000000f', 4, '{"membership_no":"MCCI-A-0814","email":"four@test.local"}', 'new', 'skip', 'skipped', null);

-- who may
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.import_invite_next(''e1000000-0000-0000-0000-00000000000f'')') $$, '42501', null, 'members cannot send import invitations');
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select * from api.import_invite_next(''e1000000-0000-0000-0000-00000000000f'')') $$, '42501', null, 'read-only staff cannot');
select throws_ok($$ select tests.exec_as_aal1(tests.id('mo'), 'select * from api.import_invite_next(''e1000000-0000-0000-0000-00000000000f'')') $$, '42501', null, 'not without the 2-step login');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.import_invite_next(''e1000000-0000-0000-0000-00000000000e'')') $$, 'P0001', null, 'only a committed import sends invitations');

-- the first batch
create temp table t_batch (row_no int, email text, full_name text, company text, token text) on commit drop;
grant insert, select on t_batch to authenticated;
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'insert into t_batch select * from api.import_invite_next(''e1000000-0000-0000-0000-00000000000f'', 10)') $$, 'the Membership Officer takes the first batch');
select results_eq($$ select row_no, email, full_name, company, token is not null from t_batch $$,
  $$ values (1, 'one@test.local', 'Rep One', 'Inv One', true) $$, 'one invitation: the member with an email, as in the file (lower case), with a one-time token');
select results_eq($$ select row_no, invite_status from public.import_rows where import_id = 'e1000000-0000-0000-0000-00000000000f' order by row_no $$,
  $$ values (1, 'sending'), (2, 'no_email'), (3, 'has_account'), (4, null) $$, 'no email → noted; already signed in → not invited again; skipped rows untouched');
select results_eq($$ select i.company_role::text, i.status::text, i.expires_at > now() + interval '29 days', i.token_hash <> (select token from t_batch)
                     from public.invitations i where i.company_id = 'e1000000-0000-0000-0000-0000000000c1' $$,
  $$ values ('Owner', 'Invited', true, true) $$, 'an Owner invitation valid 30 days; only the hash is stored');
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.import_invite_next(''e1000000-0000-0000-0000-00000000000f'', 10)'), 0::bigint, 'a second call does not send it twice');

-- the email failed: sent again only when asked
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.import_invite_mark(''e1000000-0000-0000-0000-00000000000f'', 1, false)') $$, 'the app records the failed email');
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.import_invite_next(''e1000000-0000-0000-0000-00000000000f'', 10)'), 0::bigint, 'not retried on its own (no loop)');
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.import_invite_next(''e1000000-0000-0000-0000-00000000000f'', 10, true)'), 1::bigint, 'retried when asked');
select results_eq($$ select status::text, count(*) from public.invitations where company_id = 'e1000000-0000-0000-0000-0000000000c1' group by 1 order by 1 $$,
  $$ values ('Invited', 1::bigint), ('Revoked', 1::bigint) $$, 'the earlier invitation is replaced (revoked), one live invitation');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.import_invite_mark(''e1000000-0000-0000-0000-00000000000f'', 1, true)') $$, 'the app records the sent email');
select is((select invite_status from public.import_rows where import_id = 'e1000000-0000-0000-0000-00000000000f' and row_no = 1), 'sent', 'sent');

select ok(not has_function_privilege('anon', 'api.import_invite_next(uuid,int,boolean)', 'execute')
      and not has_function_privilege('anon', 'api.import_invite_mark(uuid,int,boolean)', 'execute')
      and not has_function_privilege('authenticated', 'private.import_row_member(public.import_rows)', 'execute')
      and not has_function_privilege('authenticated', 'private.email_or_null(text)', 'execute'),
  'grants: no anonymous execute; the helpers are private');

select * from finish();
rollback;
