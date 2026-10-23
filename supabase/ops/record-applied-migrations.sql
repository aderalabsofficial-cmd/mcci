-- Records the 17 MCCI migrations as applied in the Supabase CLI's history table, for a database where they were
-- applied with `scripts/selfhost/compose.sh psql-file` (one file at a time, as postgres) instead of the CLI — the
-- self-hosted staging stack. Without this, `supabase migration list` shows them as not applied and `supabase db push`
-- / `migration up` would run every one of them again (they are not idempotent: create table / create policy fail).
--
-- Mirrors exactly what the CLI 2.121 does for `supabase migration repair --status applied` (statements taken from
-- the CLI binary): create schema/table if missing, add the statements and name columns, insert (version, name,
-- statements). `statements` stays NULL: the CLI only reads `version` to decide what is pending.
--
-- Safety: one transaction; before recording anything it checks that an object created by EACH migration exists, so it
-- cannot mark migrations applied on a database that does not have them. Idempotent (on conflict do nothing).
-- Validated against a throwaway database with the real CLI (deploy/selfhost/README.md §3a). Run with:
--   MCCI_SELFHOST_RUNTIME=<dir> scripts/selfhost/compose.sh psql-file supabase/ops/record-applied-migrations.sql
-- When migrations are added later, apply them with the CLI (or extend this file in the same commit).
begin;

do $$
declare
  missing text[] := array[]::text[];
begin
  if to_regnamespace('private') is null or to_regnamespace('api') is null then missing := missing || '20261023000100'::text; end if;
  if to_regclass('public.audit_log') is null then missing := missing || '20261023000110'::text; end if;
  if to_regclass('public.profiles') is null
     or not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    missing := missing || '20261023000120'::text;
  end if;
  if to_regclass('public.companies') is null or to_regclass('public.members') is null then missing := missing || '20261023000130'::text; end if;
  if to_regclass('public.public_settings') is null or to_regprocedure('api.settings_for_server()') is null then
    missing := missing || '20261023000140'::text;
  end if;
  if to_regclass('public.applications') is null then missing := missing || '20261023000150'::text; end if;
  if to_regclass('public.endorsements') is null or to_regclass('private.endorsement_otps') is null then missing := missing || '20261023000160'::text; end if;
  if to_regclass('public.committee_items') is null then missing := missing || '20261023000170'::text; end if;
  if to_regclass('public.payment_vouchers') is null then missing := missing || '20261023000180'::text; end if;
  if to_regclass('public.temp_memberships') is null then missing := missing || '20261023000190'::text; end if;
  if to_regclass('public.service_requests') is null then missing := missing || '20261023000200'::text; end if;
  if to_regclass('public.notifications') is null then missing := missing || '20261023000210'::text; end if;
  if to_regclass('public.email_log') is null then missing := missing || '20261023000220'::text; end if;
  if (select count(*) from storage.buckets where id in ('application-docs', 'form-snapshots', 'receipts', 'certificates',
        'service-docs', 'imports', 'cms')) <> 7
     or not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'app_docs_upload') then
    missing := missing || '20261023000230'::text;
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'audit_row') then missing := missing || '20261023000240'::text; end if;
  if to_regprocedure('api.app_create(uuid)') is null and not exists (
       select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'api' and p.proname = 'app_create') then
    missing := missing || '20261023000250'::text;
  end if;
  if (select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'
        and tablename in ('notifications', 'applications', 'endorsements', 'service_requests', 'payment_vouchers')) <> 5 then
    missing := missing || '20261023000260'::text;
  end if;
  if cardinality(missing) > 0 then
    raise exception 'not recording history: objects of these migrations are missing: %', missing;
  end if;
end $$;

create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key);
alter table supabase_migrations.schema_migrations add column if not exists statements text[];
alter table supabase_migrations.schema_migrations add column if not exists name text;

insert into supabase_migrations.schema_migrations (version, name, statements) values
  ('20261023000100', 'extensions_schemas', null),
  ('20261023000110', 'audit_core', null),
  ('20261023000120', 'identity_staff', null),
  ('20261023000130', 'companies_members', null),
  ('20261023000140', 'settings_reference', null),
  ('20261023000150', 'applications', null),
  ('20261023000160', 'endorsements', null),
  ('20261023000170', 'committee', null),
  ('20261023000180', 'payments', null),
  ('20261023000190', 'temp_print_documents', null),
  ('20261023000200', 'services', null),
  ('20261023000210', 'engagement', null),
  ('20261023000220', 'ops_ai_ratelimit', null),
  ('20261023000230', 'storage', null),
  ('20261023000240', 'audit_attach', null),
  ('20261023000250', 'api_reference', null),
  ('20261023000260', 'realtime_publication', null)
on conflict (version) do nothing;

select 'recorded migrations: ' || count(*) from supabase_migrations.schema_migrations;
commit;
