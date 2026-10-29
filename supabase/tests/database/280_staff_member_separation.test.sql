-- Staff and member accounts are separate (migration 0470): a staff account sees no member company's data and cannot
-- join a company; a company user cannot be made active staff; a member keeps their own company.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

select throws_ok(
  $$ insert into public.company_users (company_id, user_id, role) values ('a0000000-0000-0000-0000-00000000000a', tests.id('mo'), 'Viewer') $$,
  'P0001', null, 'an active staff member cannot join a member company');

-- the Membership Officer leaves the staff, joins company A as a Viewer, then is to be made staff again
update public.staff set active = false, deactivated_at = now() where user_id = tests.id('mo');
select lives_ok(
  $$ insert into public.company_users (company_id, user_id, role) values ('a0000000-0000-0000-0000-00000000000a', tests.id('mo'), 'Viewer') $$,
  'a person who is not staff can join a company');
select is(tests.num_as(tests.id('mo'), $$select jsonb_array_length(api.my_access() -> 'companies')$$), 1::bigint,
  'and then sees that company');
select throws_ok($$ update public.staff set active = true where user_id = tests.id('mo') $$, 'P0001', null,
  'a company user cannot be made active staff');

-- an old link from before 0470 (as on production): staff and company user at once
alter table public.staff disable trigger staff_not_member;
update public.staff set active = true where user_id = tests.id('mo');
alter table public.staff enable trigger staff_not_member;
select is(tests.num_as(tests.id('mo'), $$select jsonb_array_length(api.my_access() -> 'companies')$$), 0::bigint,
  'a staff account lists no member company');
select is(tests.num_as(tests.id('mo'), $$select count(*) from private.my_company_ids()$$), 0::bigint,
  'and the member policies see no company for it');
select is(tests.num_as(tests.id('mo'), $$select count(*) from public.company_users where user_id = auth.uid() and private.company_level(company_id, 'mship') > 0$$), 0::bigint,
  'nor any member-area level');
select is(tests.num_as(tests.id('mo'), $$select count(*) from (select api.my_access() -> 'staff' s) x where s is not null$$), 1::bigint,
  'it is still staff');
select is(tests.num_as(tests.id('owner_a'), $$select jsonb_array_length(api.my_access() -> 'companies')$$), 1::bigint,
  'a member keeps their own company');

select * from finish();
rollback;
