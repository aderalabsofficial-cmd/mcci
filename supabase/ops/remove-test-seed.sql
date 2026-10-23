-- Removes the pgTAP test personas and fixtures of supabase/seed.sql from a database where the seed was applied for
-- testing (the self-hosted staging stack after T-V3). Deletes ONLY the seed's fixed ids, and only after checking that
-- each one still carries the seed's identifying values (@test.local email, company name, member number, …) and that
-- nothing that is not seed data hangs off a seed company or user — otherwise it raises and deletes nothing.
-- One transaction. Afterwards the pgTAP suite cannot run on this database until the seed is applied again.
-- Not removed (by design): audit_log rows written while seeding (append-only), and sequence positions.
--   MCCI_SELFHOST_RUNTIME=<dir> scripts/selfhost/compose.sh psql-file supabase/ops/remove-test-seed.sql
begin;

create temp table _seed_users (id uuid primary key, email text not null) on commit drop;
insert into _seed_users values
  ('11111111-0000-0000-0000-000000000001', 'owner.a@test.local'),
  ('11111111-0000-0000-0000-000000000002', 'manager.a@test.local'),
  ('11111111-0000-0000-0000-000000000003', 'services.a@test.local'),
  ('11111111-0000-0000-0000-000000000004', 'accounts.a@test.local'),
  ('11111111-0000-0000-0000-000000000005', 'viewer.a@test.local'),
  ('11111111-0000-0000-0000-000000000006', 'owner.b@test.local'),
  ('11111111-0000-0000-0000-000000000007', 'owner.e@test.local'),
  ('11111111-0000-0000-0000-000000000008', 'fresh@test.local'),
  ('22222222-0000-0000-0000-000000000001', 'sg@test.local'),
  ('22222222-0000-0000-0000-000000000002', 'president@test.local'),
  ('22222222-0000-0000-0000-000000000003', 'mo@test.local'),
  ('22222222-0000-0000-0000-000000000004', 'auditor@test.local'),
  ('22222222-0000-0000-0000-000000000005', 'cs@test.local'),
  ('22222222-0000-0000-0000-000000000006', 'accounts@test.local'),
  ('22222222-0000-0000-0000-000000000007', 'inactive@test.local'),
  ('22222222-0000-0000-0000-000000000008', 'so@test.local');
create temp table _seed_companies (id uuid primary key, name text not null) on commit drop;
insert into _seed_companies values
  ('a0000000-0000-0000-0000-00000000000a', 'Company A (applicant)'),
  ('b0000000-0000-0000-0000-00000000000b', 'Company B (member)'),
  ('e0000000-0000-0000-0000-00000000000e', 'Company E (endorser)');

do $$
declare
  problems text[] := array[]::text[];
begin
  -- every seed id that still exists must still look like seed data
  if exists (select 1 from auth.users u join _seed_users s using (id) where u.email is distinct from s.email) then
    problems := problems || 'a seed user id carries another email'::text;
  end if;
  if exists (select 1 from public.companies c join _seed_companies s using (id) where c.name <> s.name) then
    problems := problems || 'a seed company id carries another name'::text;
  end if;
  if exists (select 1 from public.members m where m.id in ('b1000000-0000-0000-0000-0000000000b1', 'e1000000-0000-0000-0000-0000000000e1')
             and m.member_no not in ('MCCI-C-9001', 'MCCI-C-9002')) then
    problems := problems || 'a seed member id carries another member number'::text;
  end if;
  -- nothing that is not seed data may be attached to seed companies or users
  if exists (select 1 from public.company_users cu where cu.company_id in (select id from _seed_companies)
             and cu.user_id not in (select id from _seed_users)) then
    problems := problems || 'a non-seed user belongs to a seed company'::text;
  end if;
  if exists (select 1 from public.company_users cu where cu.user_id in (select id from _seed_users)
             and cu.company_id not in (select id from _seed_companies)) then
    problems := problems || 'a seed user belongs to a non-seed company'::text;
  end if;
  if exists (select 1 from public.applications a where (a.company_id in (select id from _seed_companies)
               or a.created_by in (select id from _seed_users))
             and a.id not in ('a1000000-0000-0000-0000-0000000000d1', 'a1000000-0000-0000-0000-0000000000a2',
                              'b2000000-0000-0000-0000-0000000000d1')) then
    problems := problems || 'a non-seed application belongs to a seed company or user'::text;
  end if;
  if exists (select 1 from public.payment_vouchers v where v.company_id in (select id from _seed_companies)
             and v.id not in ('f1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002')) then
    problems := problems || 'a non-seed voucher belongs to a seed company'::text;
  end if;
  if exists (select 1 from public.service_requests r where r.company_id in (select id from _seed_companies)
             and r.id not in ('5e000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000002')) then
    problems := problems || 'a non-seed service request belongs to a seed company'::text;
  end if;
  if exists (select 1 from storage.objects o where private.path_company(o.name) in (select id from _seed_companies)) then
    problems := problems || 'storage objects exist under a seed company prefix'::text;
  end if;
  if cardinality(problems) > 0 then
    raise exception 'not removing the test seed: %', problems;
  end if;
end $$;

-- company-owned rows (children cascade from these: partners, documents, receipts, service files and messages)
delete from public.notifications where company_id in (select id from _seed_companies)
  or user_id in (select id from _seed_users);
delete from public.invitations where company_id in (select id from _seed_companies) and email = 'new.user@test.local';
delete from public.endorsements where id = 'e2000000-0000-0000-0000-000000000001';
delete from public.payment_vouchers where id in ('f1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002');
delete from public.service_requests where id in ('5e000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000002');
delete from public.documents where id = '0d000000-0000-0000-0000-000000000001';
delete from public.application_history where application_id in ('a1000000-0000-0000-0000-0000000000d1',
  'a1000000-0000-0000-0000-0000000000a2', 'b2000000-0000-0000-0000-0000000000d1');
delete from public.applications where id in ('a1000000-0000-0000-0000-0000000000d1', 'a1000000-0000-0000-0000-0000000000a2',
  'b2000000-0000-0000-0000-0000000000d1');
delete from public.members where id in ('b1000000-0000-0000-0000-0000000000b1', 'e1000000-0000-0000-0000-0000000000e1');
delete from public.meetings where id = 'MC-TEST-1';
delete from public.print_batches where id = 'PB-TEST-1';
-- companies before users: company_users go with their company, so the last-Owner guard (F-20) does not fire
delete from public.companies where id in (select id from _seed_companies);
delete from public.staff_permission_overrides where user_id in (select id from _seed_users);
delete from public.staff where user_id in (select id from _seed_users);
delete from auth.users where id in (select s.id from _seed_users s join auth.users u on u.id = s.id and u.email = s.email);
drop schema if exists tests cascade;

do $$
begin
  if exists (select 1 from auth.users where id in (select id from _seed_users))
     or exists (select 1 from public.profiles where id in (select id from _seed_users))
     or exists (select 1 from public.companies where id in (select id from _seed_companies)) then
    raise exception 'seed rows remain after removal';
  end if;
end $$;
select 'test seed removed; @test.local users left: ' || count(*) from auth.users where email like '%@test.local';
commit;
