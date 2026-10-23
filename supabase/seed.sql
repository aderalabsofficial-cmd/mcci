-- seed.sql · LOCAL + CI ONLY (loaded by `supabase db reset`). Never run in staging or production.
-- Test personas and fixtures for the pgTAP security tests in supabase/tests/database. Reference data is NOT here; it
-- lives in migration 0140 so every environment gets it. The prototype demo world goes in a separate file (docs/13).

-- ───────── test helpers: run one statement as a given user (role switch + JWT claims, both GUC styles) ─────────
create schema if not exists tests;

create function tests._become(p_uid uuid, p_role text) returns void
  language plpgsql
  as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  perform set_config('request.jwt.claim.role', p_role, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  perform set_config('role', p_role, true);
end $$;

create function tests._restore() returns void
  language plpgsql
  as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', '', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- execute a statement as the user (p_uid null = anonymous); errors propagate to throws_ok / lives_ok
create function tests.exec_as(p_uid uuid, p_sql text, p_role text default null) returns void
  language plpgsql
  as $$
begin
  perform tests._become(p_uid, coalesce(p_role, case when p_uid is null then 'anon' else 'authenticated' end));
  begin
    execute p_sql;
  exception when others then
    perform tests._restore();
    raise;
  end;
  perform tests._restore();
end $$;

-- run a query returning one number as the user, e.g. 'select count(*) from public.members'
create function tests.num_as(p_uid uuid, p_sql text, p_role text default null) returns bigint
  language plpgsql
  as $$
declare n bigint;
begin
  perform tests._become(p_uid, coalesce(p_role, case when p_uid is null then 'anon' else 'authenticated' end));
  begin
    execute p_sql into n;
  exception when others then
    perform tests._restore();
    raise;
  end;
  perform tests._restore();
  return n;
end $$;

-- fixture ids by name, so tests read like the matrix in docs/17 §8
create function tests.id(p_name text) returns uuid
  language sql immutable
  as $$
    select (case p_name
      when 'owner_a'          then '11111111-0000-0000-0000-000000000001'
      when 'manager_a'        then '11111111-0000-0000-0000-000000000002'
      when 'services_a'       then '11111111-0000-0000-0000-000000000003'
      when 'accounts_a'       then '11111111-0000-0000-0000-000000000004'
      when 'viewer_a'         then '11111111-0000-0000-0000-000000000005'
      when 'owner_b'          then '11111111-0000-0000-0000-000000000006'
      when 'owner_e'          then '11111111-0000-0000-0000-000000000007'
      when 'fresh'            then '11111111-0000-0000-0000-000000000008'
      when 'sg'               then '22222222-0000-0000-0000-000000000001'
      when 'president'        then '22222222-0000-0000-0000-000000000002'
      when 'mo'               then '22222222-0000-0000-0000-000000000003'
      when 'auditor'          then '22222222-0000-0000-0000-000000000004'
      when 'cs'               then '22222222-0000-0000-0000-000000000005'
      when 'accounts_staff'   then '22222222-0000-0000-0000-000000000006'
      when 'inactive_mo'      then '22222222-0000-0000-0000-000000000007'
      when 'so'               then '22222222-0000-0000-0000-000000000008'
      when 'company_a'        then 'a0000000-0000-0000-0000-00000000000a'
      when 'company_b'        then 'b0000000-0000-0000-0000-00000000000b'
      when 'company_e'        then 'e0000000-0000-0000-0000-00000000000e'
      when 'member_b'         then 'b1000000-0000-0000-0000-0000000000b1'
      when 'member_e'         then 'e1000000-0000-0000-0000-0000000000e1'
      when 'app_a_draft'      then 'a1000000-0000-0000-0000-0000000000d1'
      when 'app_a_review'     then 'a1000000-0000-0000-0000-0000000000a2'
      when 'app_b_draft'      then 'b2000000-0000-0000-0000-0000000000d1'
      when 'doc_a_draft'      then 'd1000000-0000-0000-0000-000000000001'
      when 'doc_a_review'     then 'd1000000-0000-0000-0000-000000000002'
      when 'endorsement_1'    then 'e2000000-0000-0000-0000-000000000001'
      when 'voucher_a_unpaid' then 'f1000000-0000-0000-0000-000000000001'
      when 'voucher_a_paid'   then 'f1000000-0000-0000-0000-000000000002'
      when 'svc_a_issued'     then '5e000000-0000-0000-0000-000000000001'
      when 'svc_a_returned'   then '5e000000-0000-0000-0000-000000000002'
      when 'cert_b'           then '0d000000-0000-0000-0000-000000000001'
    end)::uuid
  $$;

grant usage on schema tests to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;

-- ───────── personas ─────────
-- companies: A = applicant company, B = another member company, E = endorser company
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner.a@test.local',    '{"full_name":"Owner A"}',    now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'manager.a@test.local',  '{"full_name":"Manager A"}',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'services.a@test.local', '{"full_name":"Services A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'accounts.a@test.local', '{"full_name":"Accounts A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'viewer.a@test.local',   '{"full_name":"Viewer A"}',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'owner.b@test.local',    '{"full_name":"Owner B"}',    now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'owner.e@test.local',    '{"full_name":"Owner E"}',    now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'fresh@test.local',      '{"full_name":"Fresh"}',      now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'sg@test.local',         '{"full_name":"SG"}',         now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'president@test.local',  '{"full_name":"President"}',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'mo@test.local',         '{"full_name":"Membership Officer"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'auditor@test.local',    '{"full_name":"Auditor"}',    now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'cs@test.local',         '{"full_name":"Committee Secretary"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'accounts@test.local',   '{"full_name":"Accounts Officer"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'inactive@test.local',   '{"full_name":"Inactive Officer"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'so@test.local',         '{"full_name":"Services Officer"}', now(), now());

-- GoTrue reads these token columns as non-null strings: NULL makes its admin user list fail for the whole instance
-- ("Database error finding users", seen on the self-hosted stack). Rows Auth creates itself hold ''. The columns
-- exist only after GoTrue's own migrations (not in the bare image used by scripts/db/dry-run.sh), hence the check.
do $$
declare
  col text;
begin
  foreach col in array array['confirmation_token', 'recovery_token', 'email_change_token_new', 'email_change'] loop
    if exists (select 1 from information_schema.columns
               where table_schema = 'auth' and table_name = 'users' and column_name = col) then
      execute format('update auth.users set %1$I = coalesce(%1$I, %2$L) where email like %3$L', col, '', '%@test.local');
    end if;
  end loop;
end $$;

insert into public.staff (user_id, designation) values
  ('22222222-0000-0000-0000-000000000001', 'Secretary General'),
  ('22222222-0000-0000-0000-000000000002', 'President (Signatory)'),
  ('22222222-0000-0000-0000-000000000003', 'Membership Officer'),
  ('22222222-0000-0000-0000-000000000004', 'Auditor (read-only)'),
  ('22222222-0000-0000-0000-000000000005', 'Committee Secretary'),
  ('22222222-0000-0000-0000-000000000006', 'Accounts Officer'),
  ('22222222-0000-0000-0000-000000000008', 'Services Officer');
insert into public.staff (user_id, designation, active, deactivated_at) values
  ('22222222-0000-0000-0000-000000000007', 'Membership Officer', false, now());
insert into public.staff_permission_overrides (user_id, module, level, reason) values
  ('22222222-0000-0000-0000-000000000007', 'mem', 3, 'test: override must not survive deactivation');

insert into public.companies (id, name, biz_type, ntn) values
  ('a0000000-0000-0000-0000-00000000000a', 'Company A (applicant)', 'pvt', 'NTN-A'),
  ('b0000000-0000-0000-0000-00000000000b', 'Company B (member)',    'pvt', 'NTN-B'),
  ('e0000000-0000-0000-0000-00000000000e', 'Company E (endorser)',  'pvt', 'NTN-E');

insert into public.company_users (company_id, user_id, role) values
  ('a0000000-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000001', 'Owner'),
  ('a0000000-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000002', 'Manager'),
  ('a0000000-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000003', 'Services'),
  ('a0000000-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000004', 'Accounts'),
  ('a0000000-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000005', 'Viewer'),
  ('b0000000-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-000000000006', 'Owner'),
  ('e0000000-0000-0000-0000-00000000000e', '11111111-0000-0000-0000-000000000007', 'Owner');

insert into public.members (id, member_no, company_id, class, status, rep_name, since, valid_to, public_listing) values
  ('b1000000-0000-0000-0000-0000000000b1', 'MCCI-C-9001', 'b0000000-0000-0000-0000-00000000000b', 'Corporate', 'Permanent', 'Rep B', '2020-04-01', '2027-03-31', false),
  ('e1000000-0000-0000-0000-0000000000e1', 'MCCI-C-9002', 'e0000000-0000-0000-0000-00000000000e', 'Corporate', 'Permanent', 'Rep E', '2019-04-01', '2027-03-31', true);

-- applications of company A: one draft, one in review; one draft of company B
insert into public.applications (id, company_id, created_by, stage) values
  ('a1000000-0000-0000-0000-0000000000d1', 'a0000000-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000001', 'draft'),
  ('a1000000-0000-0000-0000-0000000000a2', 'a0000000-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000001', 'review'),
  ('b2000000-0000-0000-0000-0000000000d1', 'b0000000-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-000000000006', 'draft');

insert into public.application_documents (id, application_id, key, path, file_name) values
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-0000000000d1', 'cnic', 'a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000d1/cnic.pdf', 'cnic.pdf'),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-0000000000a2', 'cnic', 'a0000000-0000-0000-0000-00000000000a/applications/a1000000-0000-0000-0000-0000000000a2/cnic.pdf', 'cnic.pdf');

insert into public.application_partners (application_id, position, name, cnic) values
  ('a1000000-0000-0000-0000-0000000000a2', 1, 'Partner One', '36302-0000000-1');

insert into public.endorsements (id, application_id, role, endorser_member_id, expires_at) values
  ('e2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-0000000000a2', 'proposer', 'e1000000-0000-0000-0000-0000000000e1', now() + interval '7 days');

insert into public.payment_vouchers (id, company_id, ref_type, ref_id, lines, amount, due_at) values
  ('f1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'membership', 'a1000000-0000-0000-0000-0000000000a2',
   '[{"label":"Admission","amount":5000},{"label":"Subscription","amount":12000},{"label":"Card","amount":500}]', 17500, now() + interval '7 days');
insert into public.payment_vouchers (id, company_id, ref_type, ref_id, lines, amount, status, due_at) values
  ('f1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a', 'service', 'a1000000-0000-0000-0000-0000000000a2',
   '[{"label":"E-BIL","amount":2000}]', 2000, 'Paid', now() + interval '7 days');

insert into public.service_requests (id, company_id, service_key, status, sla_due_at) values
  ('5e000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'ebil', 'Issued',   now() + interval '24 hours'),
  ('5e000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a', 'visa', 'Returned', now() + interval '24 hours');

insert into public.notifications (company_id, area, title, body) values
  ('a0000000-0000-0000-0000-00000000000a', 'pay', 'Voucher due', 'A payment voucher is waiting'),
  ('a0000000-0000-0000-0000-00000000000a', 'svc', 'Service update', 'Your request moved');

insert into public.invitations (kind, email, company_id, company_role, token_hash) values
  ('company_user', 'new.user@test.local', 'a0000000-0000-0000-0000-00000000000a', 'Viewer', 'test-token-hash-not-real');

insert into public.meetings (id, committee) values ('MC-TEST-1', 'Membership Committee');
insert into public.print_batches (id, printer) values ('PB-TEST-1', 'Test printer');

insert into public.documents (id, kind, company_id, member_id, title) values
  ('0d000000-0000-0000-0000-000000000001', 'certificate', 'b0000000-0000-0000-0000-00000000000b', 'b1000000-0000-0000-0000-0000000000b1', 'Certificate B');
