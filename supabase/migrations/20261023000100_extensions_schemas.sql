-- 0100 · extensions, schemas, default privileges, enums
-- Review proposal (docs/17-database-architecture.md). Target: supabase/postgres 17.6.1.136 (self-hosted) and the
-- CLI local image 17.11.0.004. pg_cron / pg_net are added later with the cron migration (they are preloaded in both).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- private: helpers and internal tables, never exposed by PostgREST (PGRST_DB_SCHEMAS = public, api)
-- api:     the only functions clients may call (RPC); each checks permission inside the database
create schema if not exists private;
create schema if not exists api;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;  -- RLS policies call private.* helpers
grant usage on schema api to anon, authenticated, service_role;

-- Supabase images grant ALL on new tables and EXECUTE on new functions in public to anon/authenticated by default.
-- This project grants explicitly per object instead (docs/17 §B3).
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema api revoke execute on functions from public, anon, authenticated;

-- ───────── enums (docs/02, docs/03; values pending an MCCI decision are NOT added yet, see docs/17 §12) ─────────
create type public.biz_type        as enum ('prop','aop','pvt','mnc','public');
create type public.member_class    as enum ('Corporate','Associate');
create type public.app_stage       as enum ('draft','submitted','review','returned','proposer','committee','payment','temp','permanent','rejected','withdrawn');
create type public.doc_status      as enum ('pending','ok','rejected');
create type public.endorse_role    as enum ('proposer','seconder');
create type public.endorse_status  as enum ('Pending','Approved','Declined','Expired','Withdrawn');
create type public.member_status   as enum ('Temporary','Permanent','Expired','Suspended','Revoked','TempExpired');
create type public.temp_status     as enum ('active','expired','converted','revoked');
create type public.print_status    as enum ('none','queued','sent','printing','received','converted');
create type public.batch_status    as enum ('Draft','Sent to printer','Printing','Received','Closed');
-- 'Refund due' / 'Refunded' from docs/16 D3 (an "Add" item, not a decision); approval level is decision D-M14
create type public.voucher_status  as enum ('Unpaid','Receipt uploaded','Paid','Rejected','Cancelled','Expired','Refund due','Refunded');
create type public.receipt_status  as enum ('Submitted','Accepted','Rejected');
-- no 'Draft' until decision D-M10
create type public.svc_status      as enum ('Submitted','In review','Returned','Ready to sign','Issued','Rejected','Cancelled');
create type public.company_role    as enum ('Owner','Manager','Services','Accounts','Viewer');
create type public.invite_status   as enum ('Invited','Active','Expired','Revoked');
create type public.ticket_status   as enum ('Open','In progress','Resolved','Closed');
create type public.doc_kind        as enum ('temp_certificate','certificate','letter','voucher','form','receipt');
-- 'Replaced' for duplicate certificates waits for decision D-M4
create type public.qr_status       as enum ('Valid','Temporary','Superseded','Expired','Revoked');
create type public.deletion_status as enum ('Requested','Approved','Completed','Rejected');

-- ───────── identifiers (docs/17 §counters) ─────────
-- Counters are global and never reset. The year segment is the year of creation in Asia/Karachi and is informational;
-- uniqueness comes from the counter alone. lpad never truncates (draft used lpad(...,4), which cut 10000 → '1000').
create function private.pad4(n bigint) returns text
  language sql immutable parallel safe set search_path = ''
  as $$ select lpad(n::text, greatest(4, length(n::text)), '0') $$;

create function private.pkt_year() returns text
  language sql stable parallel safe set search_path = ''
  as $$ select to_char(now() at time zone 'Asia/Karachi', 'YYYY') $$;

-- pure formatting helpers used in column defaults (tickets are inserted by members)
grant execute on function private.pad4(bigint), private.pkt_year() to authenticated, service_role;
