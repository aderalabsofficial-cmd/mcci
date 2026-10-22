-- 0160 · proposer & seconder endorsements (docs/04, docs/03 §2)
-- Finding F-21: one-time codes must be unreadable and brute-force limited. All writes go through api.end_* (M4).

create table public.endorsements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  role public.endorse_role not null,
  endorser_member_id uuid not null references public.members,
  status public.endorse_status not null default 'Pending',
  message text,                                  -- applicant's personal note
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  reminders smallint not null default 0,
  last_reminded_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.profiles,    -- Owner / Manager of the endorser company
  decline_reason text,
  declaration_text text,
  signature_path text,
  otp_verified_at timestamptz,
  ip inet,
  user_agent text,
  doc_hash text check (doc_hash is null or doc_hash ~ '^[0-9a-f]{64}$'),
  ref text unique                                -- short reference printed on the form
);
create unique index endorsements_one_live on public.endorsements (application_id, role) where status in ('Pending','Approved');
create index endorsements_endorser on public.endorsements (endorser_member_id, status);

-- private: never reachable through the API (F-21). docs/04: sha256 + per-row salt, 10 min, 5 attempts, resend 60 s.
create table private.endorsement_otps (
  endorsement_id uuid primary key references public.endorsements on delete cascade,
  code_hash text not null,
  salt text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0 check (attempts between 0 and 5),
  last_sent_at timestamptz not null default now()
);
alter table private.endorsement_otps enable row level security;
revoke all on private.endorsement_otps from public, anon, authenticated, service_role;

-- members my user may act for as endorser: companies where I am Owner or Manager (docs/06 "Endorsement signing")
create function private.my_endorser_member_ids() returns setof uuid
  language sql stable security definer set search_path = ''
  as $$
    select m.id from public.members m
    join public.company_users cu on cu.company_id = m.company_id
    where cu.user_id = auth.uid() and cu.status = 'Active' and cu.role in ('Owner','Manager')
  $$;
grant execute on function private.my_endorser_member_ids() to authenticated, service_role;

alter table public.endorsements enable row level security;
grant select on public.endorsements to authenticated;
create policy endorsements_select on public.endorsements for select to authenticated
  using (endorser_member_id in (select private.my_endorser_member_ids())
         or application_id in (select private.my_app_ids())
         or (select private.staff_level('mem')) >= 1);
