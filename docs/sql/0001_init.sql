-- SUPERSEDED (23 Oct 2026) by supabase/migrations/* and docs/17-database-architecture.md. Kept as history only;
-- it contains the security defects listed in docs/16 (A1–A6) and docs/17 §6. Do not apply.
-- 0001_init.sql — MCCI Digital Platform, this phase.
-- Starting point for supabase/migrations. Review names against docs/02-data-model.md before applying.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ───────────────────────── enums ─────────────────────────
create type biz_type        as enum ('prop','aop','pvt','mnc','public');
create type member_class    as enum ('Corporate','Associate');
create type app_stage       as enum ('draft','submitted','review','returned','proposer','committee','payment','temp','permanent','rejected','withdrawn');
create type doc_status      as enum ('pending','ok','rejected');
create type endorse_role    as enum ('proposer','seconder');
create type endorse_status  as enum ('Pending','Approved','Declined','Expired','Withdrawn');
create type member_status   as enum ('Temporary','Permanent','Expired','Suspended','Revoked','TempExpired');
create type temp_status     as enum ('active','expired','converted','revoked');
create type print_status    as enum ('none','queued','sent','printing','received','converted');
create type batch_status    as enum ('Draft','Sent to printer','Printing','Received','Closed');
create type voucher_status  as enum ('Unpaid','Receipt uploaded','Paid','Rejected','Cancelled','Expired');
create type svc_status      as enum ('Submitted','In review','Returned','Ready to sign','Issued','Rejected','Cancelled');
create type company_role    as enum ('Owner','Manager','Services','Accounts','Viewer');
create type invite_status   as enum ('Invited','Active','Expired','Revoked');
create type ticket_status   as enum ('Open','In progress','Resolved','Closed');
create type doc_kind        as enum ('temp_certificate','certificate','letter','voucher','form','receipt');
create type qr_status       as enum ('Valid','Temporary','Superseded','Expired','Revoked');

-- ───────────────────────── people ─────────────────────────
create table profiles (                         -- 1:1 with auth.users
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  email citext not null unique,
  mobile text,
  cnic text,                                    -- encrypted at rest via pgcrypto in lib if MCCI requires
  lang text not null default 'en' check (lang in ('en','ur')),
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create table staff (
  user_id uuid primary key references profiles on delete cascade,
  designation text not null,                    -- see docs/06-roles-permissions.md
  seniority smallint not null check (seniority between 1 and 5),
  active boolean not null default true,
  totp_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table role_permissions (                 -- defaults per designation, editable by Secretary General
  designation text not null,
  module text not null,                         -- dash, mem, cmt, temp, reg, svc, docs, pay, eng, rep, staff, plat
  level smallint not null check (level between 0 and 3),
  primary key (designation, module)
);

create table staff_permission_overrides (       -- optional per-person override
  user_id uuid references staff on delete cascade,
  module text not null,
  level smallint not null check (level between 0 and 3),
  primary key (user_id, module)
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('staff','company_user')),
  email citext not null,
  full_name text,
  designation text,                             -- staff
  company_id uuid,                              -- company_user
  company_role company_role,
  token_hash text not null,                     -- sha256 of the emailed token
  status invite_status not null default 'Invited',
  invited_by uuid references profiles,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

-- ───────────────────────── companies & members ─────────────────────────
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  biz_type biz_type not null,
  address text, ntn text, gst text, tel text, fax text, email citext, web text,
  particulars text, nature_sector text, nature_items text[],
  established date,
  manufacturing boolean default false, sales_tax boolean default false, turnover_50m boolean default false,
  sector text,
  created_at timestamptz not null default now()
);

create table company_users (
  company_id uuid references companies on delete cascade,
  user_id uuid references profiles on delete cascade,
  role company_role not null,
  status invite_status not null default 'Active',
  primary key (company_id, user_id)
);

create table members (                          -- one row per membership number
  id uuid primary key default gen_random_uuid(),
  member_no text not null unique,               -- MCCI-C-1134 / MCCI-A-2205
  company_id uuid not null references companies,
  class member_class not null,
  women boolean not null default false,
  status member_status not null,
  rep_name text not null,
  since date not null,
  valid_to date not null,                       -- 31 March of membership year
  serial text,                                  -- printed certificate serial
  public_listing boolean not null default true,
  imported boolean not null default false,      -- from MCCI Excel
  created_at timestamptz not null default now()
);
create index on members (status, class);

-- ───────────────────────── applications ─────────────────────────
create sequence app_seq start 231;
create table applications (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('MCCI-' || extract(year from now())::int || '-M-' || lpad(nextval('app_seq')::text, 4, '0')),
  company_id uuid not null references companies,
  created_by uuid not null references profiles,
  kind text not null default 'new' check (kind in ('new','renewal')),
  stage app_stage not null default 'draft',
  class member_class,                            -- computed by rule, overridable by SG with reason
  women boolean not null default false,
  form jsonb not null default '{}',              -- page-2 particulars snapshot (keys: docs/catalogue/reference-data.md)
  field_confidence jsonb not null default '{}',  -- AI confidence per field 0..100
  photo_path text, sign_path text, stamp_path text,
  decl1 boolean not null default false, decl2 boolean not null default false,
  jurisdiction_ok boolean, address_matches_ntn boolean,
  submitted_at timestamptz, decided_at timestamptz,
  member_id uuid references members,
  return_note text, reject_note text,
  review jsonb not null default '{}',            -- officer checklist {docs,identity,ntn,address,proposers}
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on applications (stage);
create index on applications (company_id);

create table application_partners (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  position smallint not null,
  name text not null, cnic text, mobile text,
  extra_card boolean not null default false
);

create table document_requirements (            -- seed from docs/catalogue/reference-data.md
  biz_type biz_type not null,
  key text not null,
  label_en text not null, label_ur text,
  required boolean not null default true,
  sort smallint not null,
  primary key (biz_type, key)
);

create table application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  key text not null,                             -- document_requirements.key or 'photo'
  path text not null, file_name text, mime text, size_bytes int,
  status doc_status not null default 'pending',
  reject_reason text,
  ai_extract jsonb,                              -- raw structured output
  uploaded_by uuid references profiles,
  reviewed_by uuid references profiles, reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (application_id, key)
);

create table application_history (
  id bigserial primary key,
  application_id uuid not null references applications on delete cascade,
  at timestamptz not null default now(),
  step text not null, note text, by_name text, by_user uuid
);

-- ───────────────────────── endorsements (proposer & seconder) ─────────────────────────
create table endorsements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  role endorse_role not null,
  endorser_member_id uuid not null references members,
  status endorse_status not null default 'Pending',
  message text,                                  -- applicant's personal note
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  reminders smallint not null default 0,
  last_reminded_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references profiles,           -- the endorser's user (Owner of that member company)
  decline_reason text,
  -- signing evidence
  declaration_text text,
  signature_path text,
  otp_verified_at timestamptz,
  ip inet, user_agent text,
  doc_hash text,                                 -- sha256 of the application form snapshot at signing time
  ref text unique                                -- short human reference printed on the form
);
-- only one live request per role per application
create unique index endorsements_one_live on endorsements (application_id, role) where status in ('Pending','Approved');
create index on endorsements (endorser_member_id, status);

create table endorsement_otps (
  endorsement_id uuid primary key references endorsements on delete cascade,
  code_hash text not null, expires_at timestamptz not null, attempts smallint not null default 0
);

-- ───────────────────────── committee ─────────────────────────
create table meetings (
  id text primary key,                           -- MC-2026-11
  committee text not null, held_on date, status text not null default 'Pending',
  minutes_path text, created_at timestamptz not null default now()
);
create table committee_items (
  application_id uuid primary key references applications on delete cascade,
  meeting_id text references meetings,
  item_no int, decision text check (decision in ('Approved','Deferred','Rejected')), note text,
  decided_at timestamptz, decided_by uuid references profiles
);

-- ───────────────────────── payments ─────────────────────────
create sequence pv_seq start 1;
create table payment_vouchers (
  id uuid primary key default gen_random_uuid(),
  voucher_no text not null unique default ('PV-' || extract(year from now())::int || '-' || lpad(nextval('pv_seq')::text, 4, '0')),
  company_id uuid not null references companies,
  ref_type text not null check (ref_type in ('membership','renewal','service','extra_card')),
  ref_id uuid not null,
  lines jsonb not null,                          -- [{label, amount}]
  amount int not null check (amount >= 0),       -- PKR
  status voucher_status not null default 'Unpaid',
  due_at timestamptz not null,
  receipt_path text, receipt_uploaded_at timestamptz,
  paid_at timestamptz, verified_by uuid references profiles, reject_reason text,
  provider text not null default 'manual',       -- 'manual' this phase; 'onebill'/'card' later
  created_at timestamptz not null default now()
);

-- ───────────────────────── temporary / permanent / printing ─────────────────────────
create table temp_memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members on delete cascade,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  extended_days int not null default 0, extensions smallint not null default 0, extend_reason text,
  status temp_status not null default 'active',
  certificate_doc uuid,                          -- documents.id
  alerts_sent smallint[] not null default '{}'   -- days-left alerts already sent (15, 7)
);
create table print_batches (
  id text primary key,                           -- PB-2026-07
  printer text not null,
  status batch_status not null default 'Draft',
  sent_at timestamptz, received_at timestamptz,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table print_items (
  member_id uuid primary key references members,
  batch_id text references print_batches,
  serial text unique,
  status print_status not null default 'queued',
  scan_path text, received_at timestamptz, converted_at timestamptz,
  courier text, tracking text, delivery_mode text check (delivery_mode in ('collect','courier'))
);
create table serial_spoilage (
  serial text primary key, reason text not null, at timestamptz not null default now(), by_user uuid references profiles
);

-- ───────────────────────── services ─────────────────────────
create sequence svc_seq start 10482;
create table service_types (
  key text primary key, name_en text not null, name_ur text, fee int not null default 0,
  docs jsonb not null, fields jsonb not null, sla_hours int not null default 24, active boolean not null default true
);
create table service_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('MCCI-' || extract(year from now())::int || '-' || nextval('svc_seq')),
  company_id uuid not null references companies,
  service_key text not null references service_types,
  status svc_status not null default 'Submitted',
  data jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  sla_due_at timestamptz not null,
  assigned_to uuid references profiles,
  issued_doc uuid, return_note text,
  created_by uuid references profiles
);
create table service_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests on delete cascade,
  key text not null, path text not null, file_name text, created_at timestamptz not null default now()
);

-- ───────────────────────── documents & QR registry ─────────────────────────
create table documents (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                     -- MCCI-QR-T7K2-0231 (printed + in QR)
  kind doc_kind not null,
  company_id uuid references companies,
  member_id uuid references members,
  title text not null,
  path text,                                     -- PDF in storage
  status qr_status not null default 'Valid',
  superseded_by uuid references documents,
  valid_to date,
  scans int not null default 0,
  revoked_reason text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── engagement ─────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade, -- recipient user
  company_id uuid references companies,               -- or all users of a company
  title text not null, body text not null, link text,
  channel text not null default 'Email + Portal',
  read_at timestamptz, created_at timestamptz not null default now()
);
create index on notifications (user_id, read_at);
create table email_templates (
  key text primary key, event text not null, subject_en text not null, subject_ur text,
  body_en text not null, body_ur text, active boolean not null default true, updated_at timestamptz default now()
);
create table email_log (
  id bigserial primary key, template_key text, to_email citext, status text, provider_id text, at timestamptz default now()
);
create table tickets (
  id text primary key, company_id uuid references companies, name text, email citext, subject text not null,
  body text not null, status ticket_status not null default 'Open', assigned_to uuid references profiles,
  created_at timestamptz not null default now()
);
create table ticket_messages (id bigserial primary key, ticket_id text references tickets on delete cascade, by_user uuid, by_name text, body text not null, at timestamptz default now());
create table events (id uuid primary key default gen_random_uuid(), title text not null, type text, starts_at timestamptz not null, venue text, seats int, body text, published boolean default true);
create table event_registrations (event_id uuid references events on delete cascade, company_id uuid references companies, user_id uuid references profiles, at timestamptz default now(), primary key (event_id, company_id));
create table posts (id uuid primary key default gen_random_uuid(), title text not null, body text not null, type text, status text not null default 'Draft', published_at timestamptz);
create table change_requests (id uuid primary key default gen_random_uuid(), company_id uuid references companies, field text not null, old_value text, new_value text not null, reason text, status text not null default 'Pending', decided_by uuid, decided_at timestamptz, created_at timestamptz default now());
create table imports (id uuid primary key default gen_random_uuid(), file_path text, rows_total int, rows_ok int, rows_error int, report jsonb, by_user uuid, at timestamptz default now());

-- ───────────────────────── settings & audit ─────────────────────────
create table settings (key text primary key, value jsonb not null, updated_by uuid, updated_at timestamptz default now());
create table audit_log (
  id bigserial primary key, at timestamptz not null default now(),
  user_id uuid, user_name text, action text not null, object text, detail text,
  old_value jsonb, new_value jsonb, ip inet, result text not null default 'Success'
);
create index on audit_log (at desc);

-- member numbers: per class sequences
create sequence member_no_c start 1134;
create sequence member_no_a start 2205;
create or replace function next_member_no(c member_class) returns text language sql as $$
  select case when c = 'Corporate' then 'MCCI-C-' || nextval('member_no_c') else 'MCCI-A-' || nextval('member_no_a') end
$$;
