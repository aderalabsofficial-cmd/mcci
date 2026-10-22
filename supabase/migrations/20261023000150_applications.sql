-- 0150 · membership applications (docs/02, docs/03 §1, docs/05 M3, docs/08)
-- Findings: F-01 / A1 (insert into another company), F-04 (applicant approves own documents), F-05 (applicant edits
-- class / review / member_id), F-07 (partners editable after submission), F-11 (token truncation, UTC year).

create sequence public.app_seq start 231;        -- MCCI-2026-M-0231 (CLAUDE.md §6); never reset (decision 6)

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('MCCI-' || private.pkt_year() || '-M-' || private.pad4(nextval('public.app_seq'))),
  company_id uuid not null references public.companies,
  created_by uuid not null references public.profiles,
  kind text not null default 'new' check (kind in ('new','renewal')),
  stage public.app_stage not null default 'draft',
  class public.member_class,                     -- computed by the class rule at submit; SG override with reason
  women boolean not null default false,
  form jsonb not null default '{}',              -- page-2 particulars (keys: docs/catalogue/reference-data.md)
  field_confidence jsonb not null default '{}',  -- AI confidence per field, written by the extraction handler
  photo_path text, sign_path text, stamp_path text,
  decl1 boolean not null default false,
  decl2 boolean not null default false,
  jurisdiction_ok boolean,
  address_matches_ntn boolean,
  submitted_at timestamptz,
  decided_at timestamptz,
  member_id uuid references public.members,
  return_note text,
  reject_note text,
  review jsonb not null default '{}',            -- officer checklist
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index applications_stage on public.applications (stage, submitted_at);
create index applications_company on public.applications (company_id);

create table public.application_partners (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  position smallint not null,
  name text not null,
  cnic text,                                     -- protection at rest: decision D-M7
  mobile text,
  extra_card boolean not null default false
);
create index application_partners_app on public.application_partners (application_id);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  key text not null,                             -- document_requirements.key or 'photo'
  path text not null,
  file_name text, mime text, size_bytes int check (size_bytes between 1 and 10485760),
  status public.doc_status not null default 'pending',
  reject_reason text,
  ai_extract jsonb,
  uploaded_by uuid default auth.uid() references public.profiles,
  reviewed_by uuid references public.profiles,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (application_id, key)
);

-- Every file ever uploaded for a slot, so a review decision always refers to the exact file reviewed.
create table public.application_document_versions (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.application_documents on delete cascade,
  application_id uuid not null references public.applications on delete cascade,
  key text not null,
  path text not null,
  file_name text, mime text, size_bytes int,
  sha256 text,                                   -- filled by the upload handler when known
  uploaded_by uuid references public.profiles,
  uploaded_at timestamptz not null default now()
);
create index application_document_versions_doc on public.application_document_versions (document_id);

-- Official form PDF at submit / resubmit; its sha256 is what endorsers sign (docs/02 "Form snapshot", docs/04)
create table public.application_form_snapshots (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  pdf_path text not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  reason text not null check (reason in ('submit','resubmit')),
  created_at timestamptz not null default now()
);

create table public.application_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications on delete cascade,
  at timestamptz not null default now(),
  step text not null,
  note text,
  by_name text,
  by_user uuid references public.profiles
);
create index application_history_app on public.application_history (application_id, at);

-- ───────── helpers ─────────
create function private.my_app_ids() returns setof uuid
  language sql stable security definer set search_path = ''
  as $$ select a.id from public.applications a where a.company_id in (select private.my_company_ids()) $$;

-- may the current user edit this application's own content (draft / returned, company mship >= 2)
create function private.app_editable(p_app uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.applications a
                   where a.id = p_app and a.stage in ('draft','returned')
                     and private.company_level(a.company_id, 'mship') >= 2)
  $$;
grant execute on function private.my_app_ids(), private.app_editable(uuid) to authenticated, service_role;

-- Uploads by applicants always enter review as 'pending'; replacing a file resets the review (F-04).
-- These BEFORE triggers run with the caller's rights (not SECURITY DEFINER), so current_user is the API role here.
-- Review decisions are made only by api.doc_review (0250), which runs as the table owner and is not reset.
create function private.app_doc_reset_review() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  if current_user in ('authenticated', 'anon') and (tg_op = 'INSERT' or new.path is distinct from old.path) then
    new.status := 'pending';
    new.reject_reason := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.ai_extract := null;
    new.uploaded_by := auth.uid();
  end if;
  return new;
end $$;
create trigger application_documents_reset_review before insert or update on public.application_documents
  for each row execute function private.app_doc_reset_review();

-- Version history is written by the owner (clients have no privilege on the versions table).
create function private.app_doc_version() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  insert into public.application_document_versions (document_id, application_id, key, path, file_name, mime, size_bytes, uploaded_by)
  values (new.id, new.application_id, new.key, new.path, new.file_name, new.mime, new.size_bytes, new.uploaded_by);
  return null;
end $$;
create trigger application_documents_version_insert after insert on public.application_documents
  for each row execute function private.app_doc_version();
create trigger application_documents_version_update after update of path on public.application_documents
  for each row when (old.path is distinct from new.path) execute function private.app_doc_version();

create function private.touch_updated_at() returns trigger
  language plpgsql set search_path = ''
  as $$ begin new.updated_at := now(); return new; end $$;
create trigger applications_touch before update on public.applications
  for each row execute function private.touch_updated_at();

-- ───────── RLS + grants ─────────
alter table public.applications enable row level security;
alter table public.application_partners enable row level security;
alter table public.application_documents enable row level security;
alter table public.application_document_versions enable row level security;
alter table public.application_form_snapshots enable row level security;
alter table public.application_history enable row level security;

-- applications: no INSERT grant (only api.app_create, F-01); UPDATE limited to the applicant's own content (F-05)
grant select on public.applications to authenticated;
grant update (form, photo_path, sign_path, stamp_path, decl1, decl2, jurisdiction_ok, women) on public.applications to authenticated;
create policy applications_select on public.applications for select to authenticated
  using (company_id in (select private.my_company_ids()) or (select private.staff_level('mem')) >= 1);
create policy applications_update_applicant on public.applications for update to authenticated
  using (private.app_editable(id)) with check (private.app_editable(id));
-- Endorsers do not read applications directly: api.endorsement_view (M4) returns the summary + form only (docs/04).

grant select, delete on public.application_partners to authenticated;
grant insert (application_id, position, name, cnic, mobile, extra_card) on public.application_partners to authenticated;
grant update (position, name, cnic, mobile, extra_card) on public.application_partners to authenticated;
create policy partners_select on public.application_partners for select to authenticated
  using (application_id in (select private.my_app_ids()) or (select private.staff_level('mem')) >= 1);
create policy partners_insert on public.application_partners for insert to authenticated with check (private.app_editable(application_id));
create policy partners_update on public.application_partners for update to authenticated
  using (private.app_editable(application_id)) with check (private.app_editable(application_id));
create policy partners_delete on public.application_partners for delete to authenticated using (private.app_editable(application_id));

grant select on public.application_documents to authenticated;
grant insert (application_id, key, path, file_name, mime, size_bytes) on public.application_documents to authenticated;
grant update (path, file_name, mime, size_bytes) on public.application_documents to authenticated;
create policy app_docs_select on public.application_documents for select to authenticated
  using (application_id in (select private.my_app_ids()) or (select private.staff_level('mem')) >= 1);
create policy app_docs_insert on public.application_documents for insert to authenticated with check (private.app_editable(application_id));
create policy app_docs_update on public.application_documents for update to authenticated
  using (private.app_editable(application_id)) with check (private.app_editable(application_id));

grant select on public.application_document_versions, public.application_form_snapshots, public.application_history to authenticated;
create policy app_doc_versions_select on public.application_document_versions for select to authenticated
  using (application_id in (select private.my_app_ids()) or (select private.staff_level('mem')) >= 1);
create policy app_snapshots_select on public.application_form_snapshots for select to authenticated
  using (application_id in (select private.my_app_ids()) or (select private.staff_level('mem')) >= 1);
create policy app_history_select on public.application_history for select to authenticated
  using (application_id in (select private.my_app_ids()) or (select private.staff_level('mem')) >= 1);

grant usage on sequence public.app_seq to service_role;
