-- 0210 · notifications, complaints, events, news, trade opportunities, change requests, reminders
-- (docs/02, docs/05 M9–M10, docs/15 §6, docs/16 A6, B4, B6). Finding F-19 (company-wide notifications visible to every
-- company user). Open decisions: D-M11 (who sees company notifications), D-M12 (event registration per company or
-- per person), D-M17 (moderation of member trade posts).

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,   -- one recipient …
  company_id uuid references public.companies on delete cascade, -- … or all users of a company with access to `area`
  area text check (area in ('mship','svc','docs','pay','events','profile')),
  title text not null,
  body text not null,
  link text,
  channel text not null default 'Email + Portal',
  read_at timestamptz,                           -- for user rows; per-user read state of company rows: gap, docs/17
  created_at timestamptz not null default now(),
  check (user_id is not null or (company_id is not null and area is not null))
);
create index notifications_user on public.notifications (user_id, read_at);
create index notifications_company on public.notifications (company_id, created_at);

create sequence public.ticket_seq start 1;
create table public.tickets (
  id text primary key default ('TK-' || private.pkt_year() || '-' || private.pad4(nextval('public.ticket_seq'))),
  public_ref text not null unique default replace(gen_random_uuid()::text, '-', ''),  -- complaint tracking (B6), 122 random bits
  company_id uuid references public.companies,
  created_by uuid default auth.uid() references public.profiles,
  name text,
  email extensions.citext,
  subject text not null check (length(subject) between 1 and 200),
  body text not null check (length(body) between 1 and 8000),
  status public.ticket_status not null default 'Open',
  assigned_to uuid references public.profiles,
  created_at timestamptz not null default now()
);

create table public.ticket_messages (
  id bigint generated always as identity primary key,
  ticket_id text not null references public.tickets on delete cascade,
  by_user uuid default auth.uid() references public.profiles,
  by_name text,
  body text not null check (length(body) between 1 and 8000),
  at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_ur text,
  type text,
  starts_at timestamptz not null,
  venue text,
  seats int check (seats is null or seats >= 0),
  body text,
  body_ur text,
  published boolean not null default false
);

create table public.event_registrations (        -- per company as in the draft until D-M12
  event_id uuid not null references public.events on delete cascade,
  company_id uuid not null references public.companies,
  user_id uuid default auth.uid() references public.profiles,
  ticket_code text not null unique default replace(gen_random_uuid()::text, '-', ''),  -- docs/15 §6 check-in QR
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles,
  at timestamptz not null default now(),
  primary key (event_id, company_id)
);

create table public.posts (                      -- news / notices / circulars (B4); Urdu is first-class (CLAUDE.md)
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  category text,
  title text not null,
  title_ur text,
  body text not null,
  body_ur text,
  status text not null default 'Draft' check (status in ('Draft','Live','Archived')),
  published_at timestamptz
);

create table public.opportunities (              -- docs/16 A6 "Trade opportunities"; columns grow in M8
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('inquiry','requirement')),   -- MCCI buyer inquiry / member requirement
  company_id uuid references public.companies,   -- null when shared by MCCI
  title text not null,
  body text not null,
  sector text,
  status text not null default 'Pending' check (status in ('Pending','Published','Closed')),  -- D-M17
  created_by uuid default auth.uid() references public.profiles,
  created_at timestamptz not null default now()
);

create table public.opportunity_replies (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities on delete cascade,
  company_id uuid not null references public.companies,
  body text not null check (length(body) between 1 and 4000),
  created_by uuid default auth.uid() references public.profiles,
  created_at timestamptz not null default now()
);

create table public.change_requests (            -- change of particulars, approved by MCCI (docs/05, form note 4)
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies,
  field text not null,
  old_value text,
  new_value text not null,
  reason text,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  requested_by uuid default auth.uid() references public.profiles,
  decided_by uuid references public.profiles,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reminders (                  -- docs/16 A6 (renew.remind); written by api / cron
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  member_id uuid references public.members,
  company_id uuid references public.companies,
  sent_at timestamptz not null default now(),
  sent_by uuid references public.profiles
);

alter table public.notifications enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.posts enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_replies enable row level security;
alter table public.change_requests enable row level security;
alter table public.reminders enable row level security;

-- notifications: own rows; company rows only with access to that area (F-19, default for D-M11)
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) or (user_id is null and private.company_level(company_id, area) >= 1));
create policy notifications_mark_read on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- tickets: members open tickets for their company; the public contact form uses a trusted, rate-limited handler
grant select on public.tickets to authenticated;
grant insert (company_id, subject, body) on public.tickets to authenticated;
create policy tickets_select on public.tickets for select to authenticated
  using (created_by = (select auth.uid()) or company_id in (select private.my_company_ids()) or (select private.staff_level('eng')) >= 1);
create policy tickets_insert on public.tickets for insert to authenticated
  with check (created_by = (select auth.uid()) and (company_id is null or company_id in (select private.my_company_ids())));

grant select on public.ticket_messages to authenticated;
grant insert (ticket_id, body) on public.ticket_messages to authenticated;
create policy ticket_messages_select on public.ticket_messages for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_id));   -- visibility follows tickets_select
create policy ticket_messages_insert on public.ticket_messages for insert to authenticated
  with check (by_user = (select auth.uid()) and exists (
    select 1 from public.tickets t where t.id = ticket_id
      and (t.created_by = (select auth.uid()) or t.company_id in (select private.my_company_ids()) or private.staff_level('eng') >= 2)));

grant select on public.events, public.posts to anon, authenticated;
create policy events_select on public.events for select to anon, authenticated
  using (published or (select private.staff_level('eng')) >= 1);
create policy posts_select on public.posts for select to anon, authenticated
  using (status = 'Live' or (select private.staff_level('eng')) >= 1);

grant select on public.event_registrations to authenticated;
grant insert (event_id, company_id) on public.event_registrations to authenticated;
create policy registrations_select on public.event_registrations for select to authenticated
  using (private.company_level(company_id, 'events') >= 1 or (select private.staff_level('eng')) >= 1);
create policy registrations_insert on public.event_registrations for insert to authenticated
  with check (private.company_level(company_id, 'events') >= 2 and user_id = (select auth.uid())
              and exists (select 1 from public.events e where e.id = event_id and e.published));

grant select on public.opportunities, public.opportunity_replies to authenticated;
grant insert (kind, company_id, title, body, sector) on public.opportunities to authenticated;
grant insert (opportunity_id, company_id, body) on public.opportunity_replies to authenticated;
create policy opportunities_select on public.opportunities for select to authenticated
  using (status = 'Published' or company_id in (select private.my_company_ids()) or (select private.staff_level('eng')) >= 1);
create policy opportunities_insert on public.opportunities for insert to authenticated
  with check (kind = 'requirement' and status = 'Pending' and created_by = (select auth.uid())
              and private.company_level(company_id, 'events') >= 2);
create policy replies_select on public.opportunity_replies for select to authenticated
  using (company_id in (select private.my_company_ids())
         or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.company_id in (select private.my_company_ids()))
         or (select private.staff_level('eng')) >= 1);
create policy replies_insert on public.opportunity_replies for insert to authenticated
  with check (created_by = (select auth.uid()) and private.company_level(company_id, 'events') >= 2
              and exists (select 1 from public.opportunities o where o.id = opportunity_id and o.status = 'Published'));

-- change requests: only the Owner (docs/06 profile.change → profile 3)
grant select on public.change_requests to authenticated;
grant insert (company_id, field, old_value, new_value, reason) on public.change_requests to authenticated;
create policy change_requests_select on public.change_requests for select to authenticated
  using (company_id in (select private.my_company_ids()) or (select private.staff_level('reg')) >= 1);
create policy change_requests_insert on public.change_requests for insert to authenticated
  with check (requested_by = (select auth.uid()) and status = 'Pending' and private.company_level(company_id, 'profile') >= 3);

grant select on public.reminders to authenticated;
create policy reminders_select on public.reminders for select to authenticated using ((select private.staff_level('reg')) >= 1);

grant usage on sequence public.ticket_seq to authenticated, service_role;
