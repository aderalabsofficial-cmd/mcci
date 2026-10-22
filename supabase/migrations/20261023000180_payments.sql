-- 0180 · payment vouchers and receipts (docs/03 §3, docs/05 M6; manual payment provider only, docs/00)
-- Findings: F-02 (member edited voucher amount/lines), F-23 (one bank slip for two vouchers; receipts overwritten).

create sequence public.pv_seq start 1;           -- PV-2026-0001 (CLAUDE.md §6); never reset (decision 6)

create table public.payment_vouchers (
  id uuid primary key default gen_random_uuid(),
  voucher_no text not null unique default ('PV-' || private.pkt_year() || '-' || private.pad4(nextval('public.pv_seq'))),
  company_id uuid not null references public.companies,
  ref_type text not null check (ref_type in ('membership','renewal','service','extra_card')),
  ref_id uuid not null,
  lines jsonb not null,                          -- [{label, amount}] copied at creation (docs/02 "Fees")
  amount int not null check (amount >= 0),       -- PKR
  status public.voucher_status not null default 'Unpaid',
  due_at timestamptz not null,
  paid_at timestamptz,
  verified_by uuid references public.profiles,
  reject_reason text,
  provider text not null default 'manual' check (provider = 'manual'),   -- only 'manual' this phase (docs/00)
  created_at timestamptz not null default now()
);
create index payment_vouchers_company on public.payment_vouchers (company_id, status);
create index payment_vouchers_ref on public.payment_vouchers (ref_type, ref_id);

-- One row per uploaded receipt; a rejected receipt is kept as evidence, never overwritten.
create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.payment_vouchers on delete cascade,
  company_id uuid not null references public.companies,
  path text not null,
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  bank_ref text,                                 -- uniqueness is decision D-M9 (indexed, not unique yet)
  status public.receipt_status not null default 'Submitted',
  uploaded_by uuid references public.profiles,
  uploaded_at timestamptz not null default now(),
  decided_by uuid references public.profiles,
  decided_at timestamptz,
  reason text
);
create index payment_receipts_voucher on public.payment_receipts (voucher_id);
create index payment_receipts_bank_ref on public.payment_receipts (bank_ref) where bank_ref is not null;

-- Money fields are fixed at creation for everyone, including staff functions (F-02). Corrections = cancel + new voucher.
create function private.voucher_immutable() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  if new.amount is distinct from old.amount or new.lines is distinct from old.lines
     or new.ref_type is distinct from old.ref_type or new.ref_id is distinct from old.ref_id
     or new.company_id is distinct from old.company_id or new.voucher_no is distinct from old.voucher_no then
    raise exception 'voucher amount, lines and reference cannot change after creation' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger payment_vouchers_immutable before update on public.payment_vouchers
  for each row execute function private.voucher_immutable();

alter table public.payment_vouchers enable row level security;
alter table public.payment_receipts enable row level security;

-- Read only for clients; receipt upload, verify, reject, cancel, refund go through api.pay_* (M6).
grant select on public.payment_vouchers, public.payment_receipts to authenticated;
create policy vouchers_select on public.payment_vouchers for select to authenticated
  using (private.company_level(company_id, 'pay') >= 1 or (select private.staff_level('pay')) >= 1);
create policy receipts_select on public.payment_receipts for select to authenticated
  using (private.company_level(company_id, 'pay') >= 1 or (select private.staff_level('pay')) >= 1);

grant usage on sequence public.pv_seq to service_role;
