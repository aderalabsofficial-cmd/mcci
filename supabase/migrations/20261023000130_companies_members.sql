-- 0130 · companies (tenants), company users, members, directory (docs/02, docs/06)
-- Findings: F-03 / A2 (members readable by any account), F-20 (last Owner removal).

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  biz_type public.biz_type not null,
  address text, ntn text, gst text, tel text, fax text, email extensions.citext, web text,
  particulars text, nature_sector text, nature_items text[],
  established date,
  manufacturing boolean not null default false,
  sales_tax boolean not null default false,
  turnover_50m boolean not null default false,
  sector text,
  created_at timestamptz not null default now()
);
-- NTN uniqueness is decision D-M8: indexed, not unique
create index companies_ntn on public.companies (ntn);
create index companies_name_trgm on public.companies using gin (name extensions.gin_trgm_ops);

create table public.company_users (
  company_id uuid not null references public.companies on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  role public.company_role not null,
  status public.invite_status not null default 'Active',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
create index company_users_user on public.company_users (user_id) where status = 'Active';

alter table public.invitations add constraint invitations_company_fk foreign key (company_id) references public.companies on delete cascade;

create table public.members (                    -- one row per membership number
  id uuid primary key default gen_random_uuid(),
  member_no text not null unique,                -- MCCI-C-1134 / MCCI-A-2205; allocated in 0170 or imported
  company_id uuid not null references public.companies,
  class public.member_class not null,
  women boolean not null default false,
  status public.member_status not null,
  rep_name text not null,
  since date not null,
  valid_to date not null,                        -- 31 March of the membership year (docs/02)
  serial text,                                   -- printed certificate serial
  public_listing boolean not null default true,
  imported boolean not null default false,
  suspended_reason text,
  created_at timestamptz not null default now()
);
create index members_status_class on public.members (status, class);
create index members_company on public.members (company_id);
create index members_rep_trgm on public.members using gin (rep_name extensions.gin_trgm_ops);

-- ───────── tenant helpers ─────────
create function private.my_company_ids() returns setof uuid
  language sql stable security definer set search_path = ''
  as $$ select cu.company_id from public.company_users cu where cu.user_id = auth.uid() and cu.status = 'Active' $$;

create function private.my_company_role(p_company uuid) returns public.company_role
  language sql stable security definer set search_path = ''
  as $$ select cu.role from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = p_company and cu.status = 'Active' $$;

-- Member company role matrix, docs/06 "Member company roles" (areas: mship, svc, docs, pay, events, profile)
create function private.company_role_level(p_role public.company_role, p_area text) returns smallint
  language sql immutable set search_path = ''
  as $$
    select (case p_role
      when 'Owner'    then 3
      when 'Manager'  then case p_area when 'profile' then 1 else 2 end
      when 'Services' then case p_area when 'svc' then 2 when 'pay' then 0 else 1 end
      when 'Accounts' then case p_area when 'pay' then 2 when 'events' then 0 else 1 end
      when 'Viewer'   then 1
      else 0 end)::smallint
  $$;

create function private.company_level(p_company uuid, p_area text) returns smallint
  language sql stable security definer set search_path = ''
  as $$ select coalesce(private.company_role_level(private.my_company_role(p_company), p_area), 0)::smallint $$;

create function private.my_member_ids() returns setof uuid
  language sql stable security definer set search_path = ''
  as $$ select m.id from public.members m where m.company_id in (select private.my_company_ids()) $$;

grant execute on function private.my_company_ids(), private.my_company_role(uuid), private.company_role_level(public.company_role, text),
  private.company_level(uuid, text), private.my_member_ids() to authenticated, service_role;

-- ───────── last Owner protection (F-20) ─────────
create function private.keep_one_owner() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if old.role = 'Owner' and old.status = 'Active'
     and (tg_op = 'DELETE' or new.role <> 'Owner' or new.status <> 'Active')
     and exists (select 1 from public.companies c where c.id = old.company_id)
     and not exists (select 1 from public.company_users cu
                     where cu.company_id = old.company_id and cu.user_id <> old.user_id
                       and cu.role = 'Owner' and cu.status = 'Active') then
    raise exception 'a company must keep at least one active Owner' using errcode = '23514';
  end if;
  return coalesce(new, old);
end $$;
create trigger company_users_keep_owner before update or delete on public.company_users
  for each row execute function private.keep_one_owner();

-- ───────── RLS + grants (no client writes: changes go through api.* functions, docs/17 §B3) ─────────
alter table public.companies enable row level security;
alter table public.company_users enable row level security;
alter table public.members enable row level security;

grant select on public.companies, public.company_users, public.members to authenticated;

create policy companies_select on public.companies for select to authenticated
  using (id in (select private.my_company_ids()) or (select private.staff_level('reg')) >= 1 or (select private.staff_level('mem')) >= 1);

create policy company_users_select on public.company_users for select to authenticated
  using (company_id in (select private.my_company_ids()) or (select private.staff_level('reg')) >= 1);

-- A2 / F-03: no "any signed-in user" branch. Endorser search is a separate api function (M4) that returns only
-- eligible members and public fields.
create policy members_select on public.members for select to authenticated
  using (company_id in (select private.my_company_ids()) or (select private.staff_level('reg')) >= 1 or (select private.staff_level('mem')) >= 1);

-- company Owner sees invitations of their company (columns already exclude token_hash)
create policy invitations_select_company on public.invitations for select to authenticated
  using (kind = 'company_user' and private.company_level(company_id, 'profile') >= 3);

-- Public directory (docs/02, docs/05 M2). Runs with the owner's rights on purpose; fixed public columns only.
create view public.public_directory with (security_invoker = false) as
  select m.member_no, c.name as company, m.class, c.sector, m.status, m.valid_to
  from public.members m join public.companies c on c.id = m.company_id
  where m.public_listing and m.status in ('Permanent','Temporary');
grant select on public.public_directory to anon, authenticated;
