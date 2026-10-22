-- 0190 · QR document registry, temporary memberships, printing, member cards (docs/03 §4, docs/08 "QR")
-- Findings: F-13 (guessable QR codes), F-09 / A4 (view-only staff edited print batches), print_items keyed by member
-- (one print item per member ever — blocks duplicates, docs/16 C4).

-- 10 random characters from a 32-letter alphabet without look-alikes (I, O, 0, 1): 2^50 combinations.
-- Spec example MCCI-QR-T7K2-0231 had 4 random characters + a sequence; format change noted in docs/17.
create function private.new_qr_code() returns text
  language plpgsql volatile set search_path = ''
  as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(10);
  c text := '';
begin
  for i in 0..9 loop
    c := c || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    if i = 4 then c := c || '-'; end if;
  end loop;
  return 'MCCI-QR-' || c;
end $$;
grant execute on function private.new_qr_code() to service_role;

create table public.documents (                  -- everything MCCI issues, verifiable by QR
  id uuid primary key default gen_random_uuid(),
  code text not null unique default private.new_qr_code() check (code ~ '^MCCI-QR-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$'),
  kind public.doc_kind not null,
  company_id uuid references public.companies,
  member_id uuid references public.members,
  title text not null,
  path text,                                     -- PDF in storage (certificates / service-docs buckets)
  status public.qr_status not null default 'Valid',
  superseded_by uuid references public.documents,
  valid_to date,
  scans int not null default 0,
  revoked_reason text,
  created_at timestamptz not null default now()
);
create index documents_company on public.documents (company_id);

create table public.temp_memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members on delete cascade,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  extended_days int not null default 0,
  extensions smallint not null default 0,
  extend_reason text,
  status public.temp_status not null default 'active',
  certificate_doc uuid references public.documents,
  alerts_sent smallint[] not null default '{}'
);
create index temp_memberships_member on public.temp_memberships (member_id, status);

create table public.print_batches (
  id text primary key,                           -- e.g. PB-2026-07
  printer text not null,                         -- security printer: decision D-M5 / docs/14 #5
  status public.batch_status not null default 'Draft',
  sent_at timestamptz,
  received_at timestamptz,
  created_by uuid references public.profiles,
  created_at timestamptz not null default now()
);

create table public.print_items (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members,
  reason text not null default 'new' check (reason in ('new','duplicate')),   -- duplicate flow: decision D-M4
  batch_id text references public.print_batches,
  serial text unique,                            -- serial format: decision D-M5
  status public.print_status not null default 'queued',
  scan_path text,
  received_at timestamptz,
  converted_at timestamptz,
  courier text,
  tracking text,                                 -- typed by staff (no courier API this phase, docs/00)
  delivery_mode text check (delivery_mode in ('collect','courier')),
  created_at timestamptz not null default now()
);
create index print_items_member on public.print_items (member_id);
create index print_items_batch on public.print_items (batch_id);

create table public.serial_spoilage (            -- a spoiled serial is never reused (docs/03 §4)
  serial text primary key,
  reason text not null,
  at timestamptz not null default now(),
  by_user uuid references public.profiles
);

create table public.member_cards (               -- docs/16 A6 (card.request), C3 digital card; columns grow in M6/M7
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members on delete cascade,
  company_id uuid not null references public.companies,
  holder_name text not null,
  kind text not null check (kind in ('digital','printed')),
  document_id uuid references public.documents,  -- live QR (docs/15 §6)
  status text not null default 'Requested',
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;
alter table public.temp_memberships enable row level security;
alter table public.print_batches enable row level security;
alter table public.print_items enable row level security;
alter table public.serial_spoilage enable row level security;
alter table public.member_cards enable row level security;

-- Read only for clients. Public verification uses /api/verify (service role, minimal projection, rate-limited).
-- Writes go through api.temp_* / api.batch_* / api.cert_* / api.qr_revoke (M6).
grant select on public.documents, public.temp_memberships, public.print_batches, public.print_items,
  public.serial_spoilage, public.member_cards to authenticated;

create policy documents_select on public.documents for select to authenticated
  using (private.company_level(company_id, 'docs') >= 1 or (select private.staff_level('docs')) >= 1);
create policy temp_select on public.temp_memberships for select to authenticated
  using (member_id in (select private.my_member_ids()) or (select private.staff_level('temp')) >= 1);
create policy print_items_select on public.print_items for select to authenticated
  using (member_id in (select private.my_member_ids()) or (select private.staff_level('temp')) >= 1);
create policy print_batches_select on public.print_batches for select to authenticated using ((select private.staff_level('temp')) >= 1);
create policy spoilage_select on public.serial_spoilage for select to authenticated using ((select private.staff_level('temp')) >= 1);
create policy member_cards_select on public.member_cards for select to authenticated
  using (private.company_level(company_id, 'mship') >= 1 or (select private.staff_level('temp')) >= 1 or (select private.staff_level('reg')) >= 1);
