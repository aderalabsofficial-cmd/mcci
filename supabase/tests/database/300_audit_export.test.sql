-- Audit Trail export (migration 0500): the IT Convener only; every attempt is logged; others get nothing.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(7);

update public.staff set designation = 'IT Convener' where user_id = tests.id('so');
insert into public.audit_log (user_name, action, object, object_id, reason) values ('Tester', 'UPDATE', 'members', 'MCCI-C-9', 'audit export test');

select is(tests.num_as(tests.id('sg'), $$select count(*) from api.audit_export(30, 'audit export test')$$), 0::bigint, 'the Secretary General cannot export the audit log');
select is(tests.num_as(tests.id('owner_a'), $$select count(*) from api.audit_export(30, null)$$), 0::bigint, 'nor a member');
select is(tests.num_as(tests.id('so'), $$select count(*) from api.audit_export(30, 'audit export test')$$), 1::bigint, 'the IT Convener exports it, filtered');
select is(tests.num_as_aal1(tests.id('so'), $$select count(*) from api.audit_export(30, 'audit export test')$$), 0::bigint, 'only with the 2-step login');
select ok(tests.num_as(tests.id('so'), $$select count(*) from public.audit_log where reason = 'audit export test'$$) = 1, 'the IT Convener reads the audit log on screen');
select is(tests.num_as(tests.id('mo'), $$select count(*) from public.audit_log where reason = 'audit export test'$$), 0::bigint, 'staff without Staff & Audit access do not');
select ok((select count(*) from public.file_access_log where bucket = 'audit' and not allowed) >= 3
      and (select count(*) from public.file_access_log where bucket = 'audit' and allowed) >= 1, 'every attempt is logged');

select * from finish();
rollback;
