-- Platform-wide security invariants: RLS everywhere, no FOR ALL policies, SECURITY DEFINER hardening, no default
-- client privileges, private schema closed, append-only audit, numbering. Findings F-06, F-10, F-11, F-12, F-13, F-14, F-21.
select no_plan();

-- NT-60 (F-06): every table in public and private has row-level security enabled
select is_empty($$
  select n.nspname || '.' || c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public','private') and c.relkind = 'r' and not c.relrowsecurity
$$, 'NT-60 every table has RLS enabled');

-- NT-61 (F-10 / A5): no FOR ALL policy anywhere (separate per-command policies with explicit WITH CHECK)
select is_empty($$ select schemaname || '.' || tablename || ' ' || policyname from pg_policies
                   where schemaname in ('public','private','storage') and cmd = 'ALL' $$, 'NT-61 no FOR ALL policies');

-- T-S1 (F-14): every SECURITY DEFINER function pins its search_path
select is_empty($$
  select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public','private','api') and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
$$, 'T-S1 every SECURITY DEFINER function sets search_path');

-- Default privileges revoked: anon may only SELECT, and only where granted explicitly
select is_empty($$ select table_name || ' ' || privilege_type from information_schema.role_table_grants
                   where grantee = 'anon' and table_schema = 'public' and privilege_type <> 'SELECT' $$,
  'anon has no write privilege on any public table');

-- authenticated has table-level UPDATE/DELETE/TRUNCATE only where the design says so (column grants are separate)
select results_eq($$
  select (table_name::text || ':' || privilege_type::text) collate "default" from information_schema.role_table_grants
  where grantee = 'authenticated' and table_schema = 'public' and privilege_type in ('UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES')
  order by 1 $$,
  $$ values ('application_partners:DELETE'), ('device_tokens:DELETE') $$,
  'authenticated: table-wide UPDATE nowhere, DELETE only on partners (draft) and own device tokens');

-- authenticated may INSERT table-wide nowhere (inserts are column-scoped or go through api.*)
select is_empty($$ select table_name from information_schema.role_table_grants
                   where grantee = 'authenticated' and table_schema = 'public' and privilege_type = 'INSERT' $$,
  'authenticated: no table-wide INSERT (column grants only)');

-- private schema: no table privileges for any API role
select is_empty($$ select table_name || ' ' || grantee from information_schema.role_table_grants
                   where table_schema = 'private' and grantee in ('anon','authenticated','service_role') $$,
  'private tables are closed to API roles');

-- NT-26 (F-21): one-time codes unreachable for every API role
select throws_ok($$ select tests.exec_as(tests.id('owner_e'), 'select count(*) from private.endorsement_otps') $$, '42501', null, 'NT-26 endorser cannot read OTP hashes');
select throws_ok($$ select tests.exec_as(null, 'select count(*) from private.endorsement_otps', 'service_role') $$, '42501', null, 'NT-26 service role cannot read OTP hashes');
-- F-21 database part: attempts are capped at 5 by a constraint
select throws_ok($$ insert into private.endorsement_otps (endorsement_id, code_hash, salt, expires_at, attempts)
                    values (tests.id('endorsement_1'), 'h', 's', now(), 6) $$, '23514', null, 'F-21 a 6th attempt cannot be recorded');

-- NT-45 (F-11): membership numbers cannot be allocated by API roles
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select private.next_member_no(''Corporate'')') $$, '42501', null, 'NT-45 staff cannot call next_member_no');
select throws_ok($$ select tests.exec_as(null, 'select private.next_member_no(''Corporate'')', 'service_role') $$, '42501', null, 'NT-45 service role cannot call next_member_no');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select nextval(''public.member_no_c'')') $$, '42501', null, 'NT-45 sequences are not usable directly');

-- NT-42 (F-12): audit log is append-only, for everyone including the owner
select ok((select count(*) from public.audit_log) > 0, 'seed changes were audited by triggers');
select throws_ok($$ update public.audit_log set action = action $$, '42501', 'audit_log is append-only', 'NT-42 owner cannot update audit rows');
select throws_ok($$ delete from public.audit_log $$, '42501', 'audit_log is append-only', 'NT-42 owner cannot delete audit rows');
select throws_ok($$ truncate public.audit_log $$, '42501', 'audit_log is append-only', 'NT-42 owner cannot truncate the audit log');
select throws_ok($$ select tests.exec_as(null, 'delete from public.audit_log', 'service_role') $$, '42501', null, 'NT-42 service role cannot delete audit rows');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'insert into public.audit_log (action) values (''forged'')') $$, '42501', null, 'NT-42 nobody inserts audit rows directly');

-- API surface: anon cannot call member functions; private helpers are not callable by anon
select throws_ok($$ select tests.exec_as(null, 'select * from api.app_create(tests.id(''company_a''))') $$, '42501', null, 'anon cannot call api.app_create');
select throws_ok($$ select tests.exec_as(null, 'select private.staff_level(''mem'')') $$, '42501', null, 'anon cannot use private helpers');

-- T-Q1 (F-13): QR codes have 10 random characters and do not collide
select matches((select code from public.documents where id = tests.id('cert_b')), '^MCCI-QR-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$', 'T-Q1 QR code format');
select is((select count(distinct private.new_qr_code()) from generate_series(1, 5000)), 5000::bigint, 'T-Q1 5000 codes, no collision');

-- T-F1 (F-11 / decision 6): counters never truncate and never reset; year segment is the Asia/Karachi year
select setval('public.app_seq', 9999, false);
insert into public.applications (company_id, created_by) values (tests.id('company_a'), tests.id('owner_a')), (tests.id('company_a'), tests.id('owner_a'));
select results_eq($$ select right(token, 6) from public.applications where token like '%-M-9999' or token like '%-M-10000' order by 1 $$,
  $$ values ('-10000'), ('M-9999') $$, 'T-F1 token 10000 is not cut to 1000');
select is(private.pkt_year(), to_char(now() at time zone 'Asia/Karachi', 'YYYY'), 'token year uses Asia/Karachi');

select * from finish();
