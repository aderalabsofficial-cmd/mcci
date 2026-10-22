-- 0200 · the seven chamber services (docs/03 §5, docs/05 M8 / milestone M7)
-- Finding F-07 (service files changeable after issue, writable by view-only staff). A 'Draft' state and the moment the
-- 24-hour SLA starts (submit vs fee verified) are decision D-M10; the request is created at submit by api.svc_submit.

create sequence public.svc_seq start 10482;      -- MCCI-2026-10482 (CLAUDE.md §6); never reset (decision 6)

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('MCCI-' || private.pkt_year() || '-' || private.pad4(nextval('public.svc_seq'))),
  company_id uuid not null references public.companies,
  service_key text not null references public.service_types,
  status public.svc_status not null default 'Submitted',
  data jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  sla_due_at timestamptz not null,               -- basis (wall clock vs business hours) is decision D-M10 / A10
  assigned_to uuid references public.profiles,
  issued_doc uuid references public.documents,
  return_note text,
  created_by uuid references public.profiles
);
create index service_requests_company on public.service_requests (company_id, status);
create index service_requests_sla on public.service_requests (status, sla_due_at);

create table public.service_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests on delete cascade,
  key text not null,
  path text not null,
  file_name text,
  uploaded_by uuid default auth.uid() references public.profiles,
  created_at timestamptz not null default now()
);
create index service_documents_request on public.service_documents (request_id);

create table public.service_messages (           -- actions.md svc.msg ("messages" table did not exist)
  id bigint generated always as identity primary key,
  request_id uuid not null references public.service_requests on delete cascade,
  by_user uuid not null default auth.uid() references public.profiles,
  body text not null check (length(body) between 1 and 4000),
  at timestamptz not null default now()
);
create index service_messages_request on public.service_messages (request_id, at);

-- may the current member company add files to this request (Submitted / Returned, company svc >= 2)
create function private.svc_editable(p_request uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.service_requests r
                   where r.id = p_request and r.status in ('Submitted','Returned')
                     and private.company_level(r.company_id, 'svc') >= 2)
  $$;
create function private.svc_visible(p_request uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.service_requests r
                   where r.id = p_request and (private.company_level(r.company_id, 'svc') >= 1 or private.staff_level('svc') >= 1))
  $$;
grant execute on function private.svc_editable(uuid), private.svc_visible(uuid) to authenticated, service_role;

alter table public.service_requests enable row level security;
alter table public.service_documents enable row level security;
alter table public.service_messages enable row level security;

-- requests: read only; created and moved only by api.svc_* (submit, start, return, approve, sign, cancel)
grant select on public.service_requests to authenticated;
create policy svc_requests_select on public.service_requests for select to authenticated
  using (private.company_level(company_id, 'svc') >= 1 or (select private.staff_level('svc')) >= 1);

grant select on public.service_documents to authenticated;
grant insert (request_id, key, path, file_name) on public.service_documents to authenticated;
create policy svc_docs_select on public.service_documents for select to authenticated using (private.svc_visible(request_id));
create policy svc_docs_insert on public.service_documents for insert to authenticated with check (private.svc_editable(request_id));

-- messages: member (svc >= 2, docs/06 "svc.* → svc 2") or staff (svc >= 2, svc.msg) on a request they can see
grant select on public.service_messages to authenticated;
grant insert (request_id, body) on public.service_messages to authenticated;
create policy svc_messages_select on public.service_messages for select to authenticated using (private.svc_visible(request_id));
create policy svc_messages_insert on public.service_messages for insert to authenticated
  with check (by_user = (select auth.uid()) and exists (
    select 1 from public.service_requests r where r.id = request_id
      and (private.company_level(r.company_id, 'svc') >= 2 or private.staff_level('svc') >= 2)));

grant usage on sequence public.svc_seq to service_role;
