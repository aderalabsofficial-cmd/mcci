-- 0600 · Accounts (owner's list of 1 Nov 2026 and MCCI's own Profit & Loss statement, docs/31): receipts and expenses on
-- MCCI's chart, membership and service fees fetched from verified vouchers, bank balances, maker-checker verification,
-- month closing, and the figures behind the Profit & Loss statement and the Trial Balance.
--
-- Amounts are kept in paisa (bigint): MCCI's statement carries paisa, for example on bank charges. This is the one
-- exception to the whole-rupee rule (CLAUDE.md §6). Voucher amounts stay whole rupees and are multiplied here.
--
-- Nothing is deleted or edited: an entry is voided with a reason and entered again. fin: 1 view, 2 record, 3 verify and
-- close a month.

create table public.fin_groups (
  code text primary key,
  kind text not null check (kind in ('receipt', 'expense')),
  name_en text not null,
  name_ur text,
  sort int not null default 0
);

create table public.fin_accounts (
  id uuid primary key default gen_random_uuid(),
  group_code text not null references public.fin_groups on update cascade,
  name_en text not null check (length(name_en) between 2 and 200),
  name_ur text,
  auto_source text check (auto_source in ('membership', 'visa', 'attestation')),
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (group_code, name_en)
);

create table public.fin_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 2 and 120),
  is_default boolean not null default false,
  opening_paisa bigint not null default 0,
  sort int not null default 0,
  active boolean not null default true
);
create unique index fin_banks_one_default on public.fin_banks (is_default) where is_default;

-- the balance on the bank's own statement at a month end; compared with the books, never replacing them
create table public.fin_bank_balances (
  bank_id uuid not null references public.fin_banks on delete cascade,
  month date not null check (extract(day from month) = 1),
  balance_paisa bigint not null,
  note text,
  entered_by uuid default auth.uid() references public.profiles on delete set null,
  entered_at timestamptz not null default now(),
  primary key (bank_id, month)
);

create sequence public.fin_entry_seq;

create table public.fin_entries (
  id uuid primary key default gen_random_uuid(),
  entry_no text not null unique,
  account_id uuid not null references public.fin_accounts,
  amount_paisa bigint not null check (amount_paisa > 0),
  on_date date not null,
  bank_id uuid references public.fin_banks,    -- null: paid in cash
  party text check (party is null or length(party) <= 200),
  reference text check (reference is null or length(reference) <= 120),
  note text check (note is null or length(note) <= 1000),
  attachment_path text,
  attachment_name text,
  status text not null default 'Recorded' check (status in ('Recorded', 'Verified', 'Voided')),
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  verified_by uuid references public.profiles on delete set null,
  verified_at timestamptz,
  void_reason text,
  voided_by uuid references public.profiles on delete set null,
  voided_at timestamptz
);
create index fin_entries_date on public.fin_entries (on_date) where status <> 'Voided';
create index fin_entries_account on public.fin_entries (account_id, on_date);

create table public.fin_closed_months (
  month date primary key check (extract(day from month) = 1),
  closed_by uuid default auth.uid() references public.profiles on delete set null,
  closed_at timestamptz not null default now(),
  note text
);

alter table public.fin_groups enable row level security;
alter table public.fin_accounts enable row level security;
alter table public.fin_banks enable row level security;
alter table public.fin_bank_balances enable row level security;
alter table public.fin_entries enable row level security;
alter table public.fin_closed_months enable row level security;

do $$
declare t text;
begin
  foreach t in array array['fin_groups', 'fin_accounts', 'fin_banks', 'fin_bank_balances', 'fin_entries', 'fin_closed_months'] loop
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.staff_level(''fin'')) >= 1)', t || '_select', t);
    execute format('create trigger audit_row after insert or update or delete on public.%I for each row execute function private.audit_row()', t);
  end loop;
end $$;

-- ───────── MCCI's chart, as on its statement (spellings corrected); staff with fin ≥ 3 add more ─────────
insert into public.fin_groups (code, kind, name_en, name_ur, sort) values
  ('R', 'receipt', 'Receipts', 'وصولیاں', 0),
  ('A', 'expense', 'Administrative Expense', 'انتظامی اخراجات', 10),
  ('A-1', 'expense', 'Vehicle Maintenance', 'گاڑیوں کی مرمت', 20),
  ('A-2', 'expense', 'Vehicle Fuel', 'گاڑیوں کا ایندھن', 30),
  ('A-3', 'expense', 'Generator Maintenance', 'جنریٹر کی مرمت', 40),
  ('A-4', 'expense', 'Generator Fuel', 'جنریٹر کا ایندھن', 50),
  ('A-5', 'expense', 'Vehicle Insurance', 'گاڑیوں کا بیمہ', 60),
  ('A-6', 'expense', 'Entertainment', 'تواضع', 70),
  ('A-7', 'expense', 'Utilities', 'یوٹیلیٹیز', 80),
  ('B', 'expense', 'Legal', 'قانونی', 90),
  ('C', 'expense', 'Taxes', 'ٹیکس', 100),
  ('D', 'expense', 'Bank Charges', 'بینک چارجز', 110);

insert into public.fin_accounts (group_code, name_en, auto_source, sort)
select v.g, v.n, v.a, v.s from (values
  ('R', 'Membership Fee: Admission - Annual Subscription - Renewal - Card', 'membership', 1),
  ('R', 'Visa Recommendation Letters Fee: Electronic (E-BIL) - Manual - Other Recommendations/VGL', 'visa', 2),
  ('R', 'Attestation Fee: Certificate of Origin (C.O) - Contracts - Other', 'attestation', 3),
  ('R', 'Contribution - Donation', null, 4),
  ('R', 'Miscellaneous Income', null, 5),
  ('R', 'Rental (Hall Charges)', null, 6),
  ('R', 'Bank Profit: Bank Al-Habib Ltd.', null, 7),
  ('R', 'Bank Profit: U Microfinance Bank', null, 8),
  ('R', 'Bank Profit: Habib Bank Ltd.', null, 9)
) as v(g, n, a, s);

insert into public.fin_accounts (group_code, name_en, sort)
select v.g, v.n, v.s from (values
  ('A', 'Staff Monthly Salaries', 1), ('A', 'Staff Leaves Encashment', 2), ('A', 'Staff Annual Bonus', 3),
  ('A', 'Staff Benefits', 4), ('A', 'Staff Eidee (Upper Staff)', 5), ('A', 'Staff Eidee (Lower Staff)', 6),
  ('A', 'Stipend', 7), ('A', 'Daily Allowance', 8), ('A', 'Travelling & Conveyance', 9),
  ('A', 'Printing & Stationery', 10), ('A', 'Printing of Back Drop', 11),
  ('A', 'Blank Membership Certificate Books From FPCCI', 12), ('A', 'Newspapers & Periodicals', 13),
  ('A', 'Media Coordination Charges (Sarfraz Ali Photographer)', 14),
  ('A', 'Media Coordination Charges (Mirza Ihtisham Daily Jang)', 15), ('A', 'Print Media (Specific Fund)', 16),
  ('A', 'Courier Charges: TCS Courier Services', 17), ('A', 'Courier Charges: Leopards Courier Services', 18),
  ('A', 'Advertisement', 19), ('A', 'Shields & Gifts', 20), ('A', 'Crockery & Cutlery', 21),
  ('A', 'Computers & Printers', 22), ('A', 'I.T Services Annual Contract', 23), ('A', 'First Aid', 24),
  ('A', 'Repair & Maintenance: Building', 25), ('A', 'Repair & Maintenance: Electric', 26), ('A', 'Miscellaneous', 27),
  ('A', 'Staff Uniforms', 28), ('A', 'Accounting Software: Monthly Service Charges', 29),
  ('A', 'Taxation And Corporate Compliance (Waqas & Co)', 30),
  ('A-1', 'Toyota Corolla GLi Car (MNE-502)', 1), ('A-1', 'Honda Motorcycle CD-70 (MNK 427)', 2),
  ('A-2', 'Toyota Corolla GLi Car (MNE-502)', 1), ('A-2', 'Honda Motorcycle CD-70 (MNK 427)', 2),
  ('A-3', '50 Kv Diesel Gen.Set', 1), ('A-3', '5 Kv Petrol Gen.Set', 2),
  ('A-4', '50 Kv Diesel Gen.Set', 1), ('A-4', '5 Kv Petrol Gen.Set', 2),
  ('A-5', 'Toyota Corolla GLi Car (MNE-502)', 1), ('A-5', 'Honda Motorcycle CD-70 (MNK 427)', 2),
  ('A-6', 'Office', 1), ('A-6', 'Events', 2),
  ('A-7', 'Telephone', 1), ('A-7', 'Internet', 2), ('A-7', 'Website', 3), ('A-7', 'Electricity', 4), ('A-7', 'WASA', 5),
  ('A-7', 'Sui Gas', 6), ('A-7', 'LPG Gas', 7), ('A-7', 'Mobile Phone (Monthly Call Packages)', 8),
  ('B', 'Legal Fee (Legal Advisor)', 1), ('B', 'EOBI', 2), ('B', 'Punjab Employees Social Security Institution (PESSI)', 3),
  ('B', 'Annual Subscription FPCCI', 4), ('B', 'Auqaf Property Rent (Backland Adjacent to MCCI Building)', 5),
  ('B', 'Corporate Compliance - SECP Fee', 6), ('B', 'Audit Fee Expense', 7), ('B', 'Annual Audit Fee (Shiwing Hameed Ch & Co.)', 8),
  ('C', 'Professional', 1), ('C', 'Property', 2),
  ('D', 'Bank Al Habib Ltd.', 1), ('D', 'Habib Bank Ltd.', 2), ('D', 'U Microfinance Bank', 3)
) as v(g, n, s);

insert into public.fin_banks (name, is_default, sort) values
  ('Bank Al-Habib Ltd.', true, 1), ('U Microfinance Bank', false, 2), ('Habib Bank Ltd.', false, 3);

-- service fees land on the statement's visa or attestation line
alter table public.service_types add column fin_auto text not null default 'visa' check (fin_auto in ('visa', 'attestation'));
update public.service_types set fin_auto = 'attestation' where key in ('co', 'att');

-- TODO(MCCI): the financial year's first month. The statement says "Year 2026-2027"; July is assumed.
insert into private.settings (key, value) values ('finance', '{"yearStartMonth":7,"openingOn":"2026-07-01"}'::jsonb)
on conflict (key) do nothing;

-- ───────── what staff do ─────────
create function private.fin_month_open(p_day date) returns void
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if exists (select 1 from public.fin_closed_months c where c.month = date_trunc('month', p_day)::date) then
    raise exception 'this month is closed' using errcode = 'P0001', hint = 'month_closed';
  end if;
end $$;
revoke all on function private.fin_month_open(date) from public, anon, authenticated, service_role;

create function api.fin_entry_add(p_account uuid, p_paisa bigint, p_date date, p_bank uuid, p_party text,
                                  p_reference text, p_note text, p_path text, p_name text) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_no text;
  v_year text;
begin
  if auth.uid() is null or private.staff_level('fin') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_paisa is null or p_paisa <= 0 or p_paisa > 100000000000 then
    raise exception 'amount' using errcode = 'P0001', hint = 'amount';
  end if;
  if p_date is null or p_date > (now() at time zone 'Asia/Karachi')::date or p_date < date '2000-01-01' then
    raise exception 'date' using errcode = 'P0001', hint = 'date';
  end if;
  if not exists (select 1 from public.fin_accounts a where a.id = p_account and a.active) then
    raise exception 'account' using errcode = 'P0001', hint = 'account';
  end if;
  if p_bank is not null and not exists (select 1 from public.fin_banks b where b.id = p_bank and b.active) then
    raise exception 'bank' using errcode = 'P0001', hint = 'bank';
  end if;
  if p_path is not null and (p_path like '%..%' or p_path !~ '^[0-9a-f-]{36}/entries/') then
    raise exception 'attachment' using errcode = 'P0001', hint = 'attachment';
  end if;
  perform private.fin_month_open(p_date);
  v_year := to_char(p_date, 'YYYY');
  v_no := 'FE-' || v_year || '-' || lpad(nextval('public.fin_entry_seq')::text, 5, '0');
  perform private.set_reason('entry recorded');
  insert into public.fin_entries (entry_no, account_id, amount_paisa, on_date, bank_id, party, reference, note, attachment_path, attachment_name)
  values (v_no, p_account, p_paisa, p_date, p_bank, nullif(btrim(p_party), ''), nullif(btrim(p_reference), ''),
          nullif(btrim(p_note), ''), p_path, nullif(left(btrim(coalesce(p_name, '')), 200), ''));
  return v_no;
end $$;

-- the person who recorded an entry cannot verify it
create function api.fin_entry_verify(p_id uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare e public.fin_entries;
begin
  if auth.uid() is null or private.staff_level('fin') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into e from public.fin_entries x where x.id = p_id for update;
  if e.id is null or e.status <> 'Recorded' then raise exception 'state' using errcode = 'P0001', hint = 'state'; end if;
  if e.created_by = auth.uid() then
    raise exception 'someone else verifies it' using errcode = 'P0001', hint = 'own_entry';
  end if;
  perform private.set_reason('entry verified');
  update public.fin_entries set status = 'Verified', verified_by = auth.uid(), verified_at = now() where id = p_id;
end $$;

create function api.fin_entry_void(p_id uuid, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare e public.fin_entries;
begin
  if auth.uid() is null or private.staff_level('fin') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into e from public.fin_entries x where x.id = p_id for update;
  if e.id is null or e.status = 'Voided' then raise exception 'state' using errcode = 'P0001', hint = 'state'; end if;
  perform private.fin_month_open(e.on_date);
  perform private.set_reason('entry voided: ' || left(btrim(p_reason), 400));
  update public.fin_entries set status = 'Voided', void_reason = left(btrim(p_reason), 1000), voided_by = auth.uid(), voided_at = now() where id = p_id;
end $$;

create function api.fin_account_add(p_group text, p_name text, p_name_ur text) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_id uuid;
begin
  if auth.uid() is null or private.staff_level('fin') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.fin_groups g where g.code = p_group) or coalesce(length(btrim(p_name)), 0) < 2 then
    raise exception 'fields' using errcode = 'P0001', hint = 'fields';
  end if;
  if exists (select 1 from public.fin_accounts a where a.group_code = p_group and lower(a.name_en) = lower(btrim(p_name))) then
    raise exception 'exists' using errcode = 'P0001', hint = 'exists';
  end if;
  perform private.set_reason('account added');
  insert into public.fin_accounts (group_code, name_en, name_ur, sort)
  values (p_group, btrim(p_name), nullif(btrim(p_name_ur), ''),
          (select coalesce(max(a.sort), 0) + 1 from public.fin_accounts a where a.group_code = p_group))
  returning id into v_id;
  return v_id;
end $$;

create function api.fin_bank_balance_save(p_bank uuid, p_month date, p_paisa bigint, p_note text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('fin') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_month is null or extract(day from p_month) <> 1 or p_paisa is null then
    raise exception 'fields' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.fin_month_open(p_month);
  perform private.set_reason('bank balance entered');
  insert into public.fin_bank_balances (bank_id, month, balance_paisa, note) values (p_bank, p_month, p_paisa, nullif(btrim(p_note), ''))
  on conflict (bank_id, month) do update set balance_paisa = excluded.balance_paisa, note = excluded.note,
    entered_by = auth.uid(), entered_at = now();
end $$;

-- opening balances are the starting point of the books: fin ≥ 3, with a reason
create function api.fin_bank_opening_save(p_bank uuid, p_paisa bigint, p_opening_on date, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('fin') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  if p_paisa is null or p_opening_on is null then raise exception 'fields' using errcode = 'P0001', hint = 'fields'; end if;
  perform private.set_reason('opening balance: ' || left(btrim(p_reason), 400));
  update public.fin_banks set opening_paisa = p_paisa where id = p_bank;
  update private.settings set value = value || jsonb_build_object('openingOn', p_opening_on), updated_at = now() where key = 'finance';
end $$;

create function api.fin_month_set(p_month date, p_closed boolean, p_note text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('fin') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_month is null or extract(day from p_month) <> 1 then raise exception 'fields' using errcode = 'P0001', hint = 'fields'; end if;
  if coalesce(length(btrim(p_note)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason(case when p_closed then 'month closed: ' else 'month reopened: ' end || left(btrim(p_note), 400));
  if p_closed then
    insert into public.fin_closed_months (month, note) values (p_month, btrim(p_note)) on conflict (month) do nothing;
  else
    delete from public.fin_closed_months where month = p_month;
  end if;
end $$;

-- ───────── the figures ─────────
-- One row per account and month. Fee receipts come from verified vouchers (the day Accounts verified them), demo
-- companies excluded; everything else from entries that are not voided.
create function api.fin_figures(p_from date, p_to date, p_verified_only boolean default false)
  returns table (account_id uuid, month date, paisa bigint)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('fin') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'dates' using errcode = 'P0001', hint = 'date';
  end if;
  return query
    with moved as (
      select e.account_id as a, e.on_date as d, e.amount_paisa as p
        from public.fin_entries e
       where e.status <> 'Voided' and e.on_date between p_from and p_to
         and (not p_verified_only or e.status = 'Verified')
      union all
      select fa.id, (v.paid_at at time zone 'Asia/Karachi')::date, v.amount::bigint * 100
        from public.payment_vouchers v
        join public.companies c on c.id = v.company_id and not c.demo
        left join public.service_requests sr on v.ref_type = 'service' and sr.id = v.ref_id
        left join public.service_types st on st.key = sr.service_key
        join public.fin_accounts fa on fa.auto_source =
             case when v.ref_type = 'service' then coalesce(st.fin_auto, 'visa') else 'membership' end
       where v.status = 'Paid' and (v.paid_at at time zone 'Asia/Karachi')::date between p_from and p_to
    )
    select m.a, date_trunc('month', m.d)::date, sum(m.p)::bigint from moved m group by 1, 2;
end $$;

-- membership receipts by category and class, for the statement's breakdown and the Payments filters
create function api.fin_membership_breakdown(p_from date, p_to date)
  returns table (category text, class text, vouchers bigint, paisa bigint)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or (private.staff_level('fin') < 1 and private.staff_level('pay') < 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select v.ref_type, coalesce(m.class::text, a.class::text, 'Unknown'), count(*), sum(v.amount)::bigint * 100
      from public.payment_vouchers v
      join public.companies c on c.id = v.company_id and not c.demo
      left join public.applications a on v.ref_type = 'membership' and a.id = v.ref_id
      left join lateral (select x.class from public.members x where x.company_id = v.company_id order by x.created_at desc limit 1) m on true
     where v.status = 'Paid' and v.ref_type in ('membership', 'renewal', 'restoration', 'extra_card')
       and (v.paid_at at time zone 'Asia/Karachi')::date between p_from and p_to
     group by 1, 2;
end $$;

-- The books per bank up to a day: opening + receipts - expenses. Fee receipts are taken to the default bank. A null
-- bank is cash in hand. Before the opening date nothing counts: the opening balances already hold it.
create function api.fin_books(p_to date)
  returns table (bank_id uuid, paisa bigint)
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  v_open date := coalesce((select (s.value ->> 'openingOn')::date from private.settings s where s.key = 'finance'), date '2000-01-01');
  v_default uuid := (select b.id from public.fin_banks b where b.is_default limit 1);
begin
  if auth.uid() is null or private.staff_level('fin') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    with moved as (
      select b.id as bank, b.opening_paisa as p from public.fin_banks b
      union all
      select e.bank_id, case when g.kind = 'receipt' then e.amount_paisa else -e.amount_paisa end
        from public.fin_entries e
        join public.fin_accounts a on a.id = e.account_id
        join public.fin_groups g on g.code = a.group_code
       where e.status <> 'Voided' and e.on_date between v_open and p_to
      union all
      select v_default, v.amount::bigint * 100
        from public.payment_vouchers v
        join public.companies c on c.id = v.company_id and not c.demo
       where v.status = 'Paid' and (v.paid_at at time zone 'Asia/Karachi')::date between v_open and p_to
    )
    select m.bank, sum(m.p)::bigint from moved m group by 1;
end $$;

create function api.fin_settings() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('fin') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return (select s.value from private.settings s where s.key = 'finance');
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('finance-docs', 'finance-docs', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

do $$
begin
  execute replace(replace(pg_get_functiondef('api.file_access(text,text,text)'::regprocedure),
    '''form-snapshots'', ''member-docs'')', '''form-snapshots'', ''member-docs'', ''finance-docs'')'),
    'when p_bucket = ''member-docs'' then',
    'when p_bucket = ''finance-docs'' then private.staff_level(''fin'') >= 1
    when p_bucket = ''member-docs'' then');
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'api.fin_entry_add(uuid,bigint,date,uuid,text,text,text,text,text)', 'api.fin_entry_verify(uuid)',
    'api.fin_entry_void(uuid,text)', 'api.fin_account_add(text,text,text)',
    'api.fin_bank_balance_save(uuid,date,bigint,text)', 'api.fin_bank_opening_save(uuid,bigint,date,text)',
    'api.fin_month_set(date,boolean,text)', 'api.fin_figures(date,date,boolean)',
    'api.fin_membership_breakdown(date,date)', 'api.fin_books(date)', 'api.fin_settings()'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
