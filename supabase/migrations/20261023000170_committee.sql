-- 0170 · committee desk, meetings, membership numbers (docs/03 §1, docs/05 M5)
-- Findings: F-09 / A3 (view-only staff wrote committee decisions), F-11 (anyone could call next_member_no).

create table public.meetings (
  id text primary key,                           -- e.g. MC-2026-11 (entered by the Committee Secretary)
  committee text not null,
  held_on date,
  status text not null default 'Pending',
  minutes_path text,
  created_at timestamptz not null default now()
);

-- Draft keyed items by application only, so a deferral overwrote the earlier meeting. One row per (application, meeting).
create table public.committee_items (
  application_id uuid not null references public.applications on delete cascade,
  meeting_id text not null references public.meetings,
  item_no int,
  decision text check (decision in ('Approved','Deferred','Rejected')),
  note text,
  decided_at timestamptz,
  decided_by uuid references public.profiles,
  primary key (application_id, meeting_id)
);

-- Membership numbers (CLAUDE.md §6: MCCI-C-1134 / MCCI-A-2205). Global, never reset (decision 6).
-- After the legacy member import, the sequences must be moved past the highest imported number (docs/13; import step).
-- Gapless numbering is decision D-M2: sequences can skip a number when a transaction rolls back.
create sequence public.member_no_c start 1134;
create sequence public.member_no_a start 2205;

create function private.next_member_no(p_class public.member_class) returns text
  language sql volatile security definer set search_path = ''
  as $$
    select case when p_class = 'Corporate' then 'MCCI-C-' || nextval('public.member_no_c')
                else 'MCCI-A-' || nextval('public.member_no_a') end
  $$;
-- Only called inside api.* committee functions (owner rights). No API role may execute it (F-11).
revoke all on function private.next_member_no(public.member_class) from public, anon, authenticated, service_role;
revoke all on sequence public.member_no_c, public.member_no_a from public, anon, authenticated, service_role;

alter table public.meetings enable row level security;
alter table public.committee_items enable row level security;
-- Reads for committee viewers; writes only through api.cmt_* (cmt >= 2 for meetings/minutes, >= 3 for decisions).
grant select on public.meetings, public.committee_items to authenticated;
create policy meetings_select on public.meetings for select to authenticated using ((select private.staff_level('cmt')) >= 1);
-- the applicant sees their own agenda item (prototype member "With the Membership Committee · agenda, item")
create policy committee_items_select on public.committee_items for select to authenticated
  using ((select private.staff_level('cmt')) >= 1 or application_id in (select private.my_app_ids()));
