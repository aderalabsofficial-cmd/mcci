-- Realtime publication: exactly the five approved tables, RLS on, no anonymous access, no client DELETE (delete
-- events are not RLS-checked), sensitive tables excluded, endorsement evidence (ip, user_agent) unreadable by clients.
-- Runs in its own transaction and rolls back (supabase test db / pg_prove run each file in a separate session).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(17);

-- membership: exactly the five tables of docs/01 §Live updates
select results_eq(
  $$ select (schemaname || '.' || tablename)::text collate "default" from pg_publication_tables where pubname = 'supabase_realtime' order by 1 $$,
  $$ values ('public.applications'), ('public.endorsements'), ('public.notifications'), ('public.payment_vouchers'), ('public.service_requests') $$,
  'supabase_realtime publishes exactly the five approved tables');

-- every published table enforces RLS (Realtime runs the subscriber's RLS check for inserts and updates)
select is_empty($$ select t.tablename from pg_publication_tables t join pg_class c on c.oid = (t.schemaname || '.' || t.tablename)::regclass
                   where t.pubname = 'supabase_realtime' and not c.relrowsecurity $$,
  'every published table has RLS enabled');

-- anonymous subscribers can read nothing from published tables
select is_empty($$ select t.tablename from pg_publication_tables t
                   where t.pubname = 'supabase_realtime'
                     and (has_table_privilege('anon', (t.schemaname || '.' || t.tablename)::regclass, 'SELECT')
                          or exists (select 1 from information_schema.column_privileges p
                                     where p.grantee = 'anon' and p.table_schema = t.schemaname and p.table_name = t.tablename)) $$,
  'anon has no table or column SELECT on any published table');

-- DELETE events reach every subscriber (primary key only), so clients must not be able to delete published rows
select is_empty($$ select t.tablename from pg_publication_tables t
                   where t.pubname = 'supabase_realtime'
                     and (has_table_privilege('authenticated', (t.schemaname || '.' || t.tablename)::regclass, 'DELETE')
                          or has_table_privilege('anon', (t.schemaname || '.' || t.tablename)::regclass, 'DELETE')) $$,
  'no client DELETE privilege on a published table');

-- sensitive / internal tables are never published
select is_empty($$ select schemaname || '.' || tablename from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname <> 'public' $$,
  'no private, auth or storage table is published');
select is_empty($$ select tablename from pg_publication_tables
                   where pubname = 'supabase_realtime' and tablename in (
                     'invitations','audit_log','profiles','staff','staff_permission_overrides','role_permissions','device_tokens',
                     'consents','ai_conversations','ai_extractions','account_deletion_requests','payment_receipts',
                     'application_documents','application_document_versions','application_partners','application_form_snapshots',
                     'companies','company_users','members','imports','email_log','push_log','job_runs','tickets','ticket_messages') $$,
  'tables with credentials, personal data or internal logs are not published');

-- endorsement evidence: not readable by clients, so absent from REST and from Realtime payloads
select ok(not has_column_privilege('authenticated', 'public.endorsements', 'ip', 'SELECT'), 'authenticated cannot read endorsements.ip');
select ok(not has_column_privilege('authenticated', 'public.endorsements', 'user_agent', 'SELECT'), 'authenticated cannot read endorsements.user_agent');
select ok(not has_table_privilege('authenticated', 'public.endorsements', 'SELECT'), 'no table-wide SELECT on endorsements any more (column grants only)');
-- every other column stays readable (and a column added later is not exposed until it is granted on purpose)
select results_eq(
  $$ select a.attname::text collate "default" from pg_attribute a
     where a.attrelid = 'public.endorsements'::regclass and a.attnum > 0 and not a.attisdropped
       and has_column_privilege('authenticated', 'public.endorsements', a.attname, 'SELECT')
     order by a.attnum $$,
  $$ values ('id'), ('application_id'), ('role'), ('endorser_member_id'), ('status'), ('message'), ('requested_at'),
            ('expires_at'), ('reminders'), ('last_reminded_at'), ('decided_at'), ('decided_by'), ('decline_reason'),
            ('declaration_text'), ('signature_path'), ('otp_verified_at'), ('doc_hash'), ('ref') $$,
  'endorsements: clients read exactly the non-evidence columns');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select ip from public.endorsements') $$, '42501', null, 'applicant cannot read the endorser''s IP');
select throws_ok($$ select tests.exec_as(tests.id('owner_e'), 'select user_agent from public.endorsements') $$, '42501', null, 'even the endorser reads evidence only through api.* (M4)');
select is(tests.num_as(tests.id('owner_a'), 'select count(id) from public.endorsements'), 1::bigint, 'applicant still sees the request status of their own application');
select is(tests.num_as(tests.id('owner_b'), 'select count(id) from public.endorsements'), 0::bigint, 'other companies still see nothing (RLS unchanged)');
select is(tests.num_as(tests.id('mo'), 'select count(id) from public.endorsements'), 1::bigint, 'staff (mem >= 1) still read endorsement rows');

-- Realtime internals (only where the Realtime service has installed them; the bare Postgres image has none)
select ok(
  coalesce(pg_get_functiondef(to_regprocedure('realtime.apply_rls(jsonb,integer)')) like '%has_column_privilege%', true),
  'Realtime builds payloads from column privileges (checked when realtime.apply_rls is installed)');
select ok(
  to_regclass('realtime.messages') is null
  or ((select relrowsecurity from pg_class where oid = to_regclass('realtime.messages'))
      and not exists (select 1 from pg_policies where schemaname = 'realtime' and tablename = 'messages')),
  'private broadcast channels stay closed: realtime.messages has RLS and no policy (checked when installed)');

select * from finish();
rollback;
