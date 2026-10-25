-- 0360 · Existing-member directory import (docs/13 "Member Excel import", admin/import; actions imp.*).
--
-- upload (CSV / Excel / PDF) → parsed in the app → api.import_stage: every row re-validated here, matched against the
-- register (same membership number = "exists", same NTN or same company name = "possible"), default decision chosen
-- conservatively (anything not clearly new, or read by AI with low certainty, is skipped) → preview → per-row decisions (api.import_decide) → explicit
-- confirmation (api.import_commit with the word IMPORT) → one transaction, audited per row.
-- Rules: membership numbers and statuses are kept exactly as given, never allocated; an existing member is never
-- overwritten unless an admin chose "update" for that row; nobody is treated as a new applicant; after a commit the
-- official number sequences move past the highest imported number (docs/17 §6). Rows created by an import can be
-- rolled back while nothing refers to them; updates are not reverted (old values are in the audit log).
-- Who: preview, decisions, commit reg ≥ 2 (docs/06 imp.*); roll back reg ≥ 3. Files: private bucket `imports`.

alter table public.imports
  add column status text not null default 'preview' check (status in ('preview', 'committed', 'discarded', 'rolled_back')),
  add column file_name text,
  add column source text check (source in ('csv', 'xlsx', 'xls', 'pdf')),
  add column ai boolean not null default false,
  add column committed_at timestamptz,
  add column committed_by uuid references public.profiles on delete set null;
-- removing a staff account never fails because of an import it ran (the audit log keeps who did it)
alter table public.imports
  drop constraint imports_by_user_fkey,
  add constraint imports_by_user_fkey foreign key (by_user) references public.profiles on delete set null;

create table public.import_rows (
  import_id uuid not null references public.imports on delete cascade,
  row_no int not null,
  data jsonb not null,                           -- normalised fields (see lib/import/normalize.ts)
  raw jsonb,                                     -- the cells as read, for the preview
  issues jsonb not null default '[]',            -- [{field, level: error|warning, code}]
  confidence numeric check (confidence is null or confidence between 0 and 1),
  match text not null check (match in ('new', 'exists', 'possible')),
  match_member uuid references public.members on delete set null,
  decision text not null check (decision in ('create', 'update', 'skip')),
  result text,                                   -- created / updated / skipped / error: … / rolled back
  created_member uuid references public.members on delete set null,
  primary key (import_id, row_no)
);

alter table public.import_rows enable row level security;
grant select on public.imports, public.import_rows to authenticated;
create policy import_rows_select on public.import_rows for select to authenticated using ((select private.staff_level('reg')) >= 2);
-- a person's decision on a row is audited (the rows themselves are a staging copy of the uploaded file)
create trigger audit_row_decision after update of decision on public.import_rows
  for each row execute function private.audit_row('data', 'raw', 'issues');

-- the bucket also takes the old Excel format and PDF (scanned directories)
update storage.buckets
   set allowed_mime_types = array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv',
                                  'application/vnd.ms-excel', 'application/pdf']
 where id = 'imports';

-- ───────── helpers ─────────

create function private.import_norm_name(p text) returns text
  language sql immutable set search_path = ''
  as $$ select regexp_replace(lower(coalesce(p, '')), '\m(private|pvt|limited|ltd|smc|the|and|co|company)\M|[^a-z0-9]', '', 'g') $$;
revoke all on function private.import_norm_name(text) from public, anon, authenticated, service_role;

-- server-side check of one normalised row (the app's checks are repeated, never trusted)
create function private.import_row_errors(d jsonb) returns jsonb
  language plpgsql immutable set search_path = ''
  as $$
declare
  e jsonb := '[]';
begin
  if coalesce(d ->> 'membership_no', '') !~ '^MCCI-[CA]-[0-9]{1,6}$' then
    e := e || jsonb_build_object('field', 'membership_no', 'level', 'error', 'code', 'membership_no');
  end if;
  if coalesce(btrim(d ->> 'company_name'), '') = '' then
    e := e || jsonb_build_object('field', 'company_name', 'level', 'error', 'code', 'required');
  end if;
  if coalesce(btrim(d ->> 'representative_name'), '') = '' then
    e := e || jsonb_build_object('field', 'representative_name', 'level', 'error', 'code', 'required');
  end if;
  if coalesce(d ->> 'class', '') not in ('Corporate', 'Associate') then
    e := e || jsonb_build_object('field', 'class', 'level', 'error', 'code', 'class');
  end if;
  if coalesce(d ->> 'status', '') not in ('Permanent', 'Expired', 'Suspended') then
    e := e || jsonb_build_object('field', 'status', 'level', 'error', 'code', 'status');
  end if;
  if coalesce(d ->> 'valid_to', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    e := e || jsonb_build_object('field', 'valid_to', 'level', 'error', 'code', 'date');
  end if;
  if coalesce(d ->> 'member_since', '') <> '' and d ->> 'member_since' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    e := e || jsonb_build_object('field', 'member_since', 'level', 'error', 'code', 'date');
  end if;
  if coalesce(d ->> 'business_type', 'prop') not in ('prop', 'aop', 'pvt', 'mnc', 'public') then
    e := e || jsonb_build_object('field', 'business_type', 'level', 'error', 'code', 'business_type');
  end if;
  if coalesce(d ->> 'email', '') <> '' and d ->> 'email' !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    e := e || jsonb_build_object('field', 'email', 'level', 'error', 'code', 'email');
  end if;
  return e;
end $$;
revoke all on function private.import_row_errors(jsonb) from public, anon, authenticated, service_role;

-- ───────── stage, decide, commit, discard, roll back ─────────

create function api.import_stage(p_file_path text, p_file_name text, p_source text, p_ai boolean, p_rows jsonb)
  returns table (import_id uuid, rows_total int, rows_new int, rows_exists int, rows_possible int, rows_error int)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_import uuid;
  r jsonb;
  d jsonb;
  v_no int := 0;
  v_issues jsonb;
  v_member uuid;
  v_match text;
  v_seen text[] := '{}';
  v_err boolean;
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'no rows found in the file' using errcode = 'P0001', hint = 'empty';
  end if;
  if jsonb_array_length(p_rows) > 5000 then
    raise exception 'at most 5000 rows per import' using errcode = 'P0001', hint = 'too_many';
  end if;
  if p_file_path is null or not exists (select 1 from storage.objects o where o.bucket_id = 'imports' and o.name = p_file_path) then
    raise exception 'upload the file first' using errcode = 'P0001', hint = 'file';
  end if;
  perform private.set_reason('member import previewed: ' || left(coalesce(p_file_name, ''), 120));
  insert into public.imports (file_path, file_name, source, ai, by_user, status)
  values (p_file_path, left(p_file_name, 200), p_source, coalesce(p_ai, false), auth.uid(), 'preview')
  returning id into v_import;
  for r in select * from jsonb_array_elements(p_rows) loop
    v_no := v_no + 1;
    d := coalesce(r -> 'data', '{}');
    -- the app's issues (warnings and errors) plus this function's own checks
    -- the same problem found by both is listed once (as an error if either says so), in the order found
    select coalesce(jsonb_agg(s.e order by s.n), '[]') into v_issues
      from (select distinct on (t.e ->> 'field', t.e ->> 'code') t.e, t.n
              from jsonb_array_elements(coalesce(r -> 'issues', '[]') || private.import_row_errors(d)) with ordinality t(e, n)
             order by t.e ->> 'field', t.e ->> 'code', t.e ->> 'level' = 'error' desc, t.n) s;
    if d ->> 'membership_no' = any (v_seen) then
      v_issues := v_issues || jsonb_build_object('field', 'membership_no', 'level', 'error', 'code', 'duplicate_in_file');
    end if;
    v_seen := v_seen || coalesce(d ->> 'membership_no', '');
    select m.id into v_member from public.members m where m.member_no = d ->> 'membership_no';
    if v_member is not null then
      v_match := 'exists';
    else
      select m.id into v_member from public.members m join public.companies c on c.id = m.company_id
       where not c.demo
         and ((coalesce(d ->> 'ntn', '') <> '' and c.ntn = d ->> 'ntn')
              or (private.import_norm_name(c.name) <> '' and private.import_norm_name(c.name) = private.import_norm_name(d ->> 'company_name')))
       limit 1;
      v_match := case when v_member is null then 'new' else 'possible' end;
    end if;
    v_err := exists (select 1 from jsonb_array_elements(v_issues) i where i ->> 'level' = 'error');
    insert into public.import_rows (import_id, row_no, data, raw, issues, confidence, match, match_member, decision)
    values (v_import, v_no, d, r -> 'raw', v_issues,
            case when r ? 'confidence' then least(1, greatest(0, (r ->> 'confidence')::numeric)) end,
            v_match, v_member,
            -- conservative default: only a clean, clearly new row is created; everything else waits for a person
            case when v_match = 'new' and not v_err
                  and not exists (select 1 from jsonb_array_elements(v_issues) i where i ->> 'code' = 'low_confidence')
                 then 'create' else 'skip' end);
  end loop;
  update public.imports i
     set rows_total = v_no,
         rows_error = (select count(*) from public.import_rows x where x.import_id = v_import
                         and exists (select 1 from jsonb_array_elements(x.issues) e where e ->> 'level' = 'error')),
         report = (select jsonb_build_object('new', count(*) filter (where x.match = 'new'),
                                             'exists', count(*) filter (where x.match = 'exists'),
                                             'possible', count(*) filter (where x.match = 'possible'))
                     from public.import_rows x where x.import_id = v_import)
   where i.id = v_import;
  return query
    select v_import, v_no,
           (select count(*)::int from public.import_rows x where x.import_id = v_import and x.match = 'new'),
           (select count(*)::int from public.import_rows x where x.import_id = v_import and x.match = 'exists'),
           (select count(*)::int from public.import_rows x where x.import_id = v_import and x.match = 'possible'),
           (select count(*)::int from public.import_rows x where x.import_id = v_import
              and exists (select 1 from jsonb_array_elements(x.issues) i where i ->> 'level' = 'error'));
end $$;

create function api.import_decide(p_import uuid, p_row int, p_decision text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  x public.import_rows;
  v_err boolean;
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if (select i.status from public.imports i where i.id = p_import) is distinct from 'preview' then
    raise exception 'this import is not open for changes' using errcode = 'P0001', hint = 'closed';
  end if;
  select * into x from public.import_rows r where r.import_id = p_import and r.row_no = p_row for update;
  if x.import_id is null then
    raise exception 'row not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  v_err := exists (select 1 from jsonb_array_elements(x.issues) i where i ->> 'level' = 'error');
  if p_decision = 'create' and (x.match <> 'new' and x.match <> 'possible' or v_err) then
    raise exception 'only a valid row that is not already in the register can be created' using errcode = 'P0001', hint = 'cannot_create';
  end if;
  if p_decision = 'update' and (x.match <> 'exists' or v_err) then
    raise exception 'only a valid row with the same membership number can update a member' using errcode = 'P0001', hint = 'cannot_update';
  end if;
  -- a member the platform itself issued or manages (committee decision, temporary membership) is never changed by a file
  if p_decision = 'update' and not exists (select 1 from public.members m where m.id = x.match_member and m.imported
                                             and m.status in ('Permanent', 'Expired', 'Suspended')) then
    raise exception 'this member is managed on the platform; change it on the member record' using errcode = 'P0001', hint = 'platform_member';
  end if;
  if p_decision not in ('create', 'update', 'skip') then
    raise exception 'unknown decision' using errcode = 'P0001', hint = 'decision';
  end if;
  update public.import_rows set decision = p_decision where import_id = p_import and row_no = p_row;
end $$;

create function api.import_commit(p_import uuid, p_confirm text)
  returns table (created int, updated int, skipped int, failed int)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  x public.import_rows;
  d jsonb;
  v_company uuid;
  v_member uuid;
  n_created int := 0;
  n_updated int := 0;
  n_skipped int := 0;
  n_failed int := 0;
  v_max bigint;
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_confirm is distinct from 'IMPORT' then
    raise exception 'type IMPORT to confirm' using errcode = 'P0001', hint = 'confirm';
  end if;
  if (select i.status from public.imports i where i.id = p_import for update) is distinct from 'preview' then
    raise exception 'this import is not open for changes' using errcode = 'P0001', hint = 'closed';
  end if;
  perform private.set_reason('member import committed');
  for x in select * from public.import_rows r where r.import_id = p_import order by r.row_no loop
    d := x.data;
    if x.decision = 'skip' then
      update public.import_rows set result = 'skipped' where import_id = p_import and row_no = x.row_no;
      n_skipped := n_skipped + 1;
      continue;
    end if;
    begin
      if x.decision = 'create' then
        -- checked again at commit time: the register may have changed since the preview
        if exists (select 1 from public.members m where m.member_no = d ->> 'membership_no') then
          raise exception 'membership number already in the register';
        end if;
        insert into public.companies (name, biz_type, address, ntn, gst, tel, email, nature_sector)
        values (btrim(d ->> 'company_name'), coalesce(nullif(d ->> 'business_type', ''), 'prop')::public.biz_type,
                nullif(btrim(d ->> 'address'), ''), nullif(btrim(d ->> 'ntn'), ''), nullif(btrim(d ->> 'gst'), ''),
                nullif(btrim(d ->> 'mobile'), ''),
                nullif(btrim(d ->> 'email'), '')::extensions.citext, nullif(btrim(d ->> 'sector'), ''))
        returning id into v_company;
        -- not listed in the public directory until MCCI decides to list imported members (docs/14; TODO(MCCI))
        insert into public.members (member_no, company_id, class, women, status, rep_name, since, valid_to, serial, imported, public_listing)
        values (d ->> 'membership_no', v_company, (d ->> 'class')::public.member_class, coalesce((d ->> 'women')::boolean, false),
                (d ->> 'status')::public.member_status, btrim(d ->> 'representative_name'),
                coalesce(nullif(d ->> 'member_since', '')::date, (now() at time zone 'Asia/Karachi')::date),
                (d ->> 'valid_to')::date, nullif(btrim(d ->> 'certificate_serial'), ''), true, false)
        returning id into v_member;
        update public.import_rows set result = 'created', created_member = v_member where import_id = p_import and row_no = x.row_no;
        n_created := n_created + 1;
      else
        -- "update" was chosen by an admin for this row: the member with this number takes the file's values
        update public.members m
           set class = (d ->> 'class')::public.member_class, women = coalesce((d ->> 'women')::boolean, m.women),
               status = (d ->> 'status')::public.member_status, rep_name = btrim(d ->> 'representative_name'),
               valid_to = (d ->> 'valid_to')::date, serial = coalesce(nullif(btrim(d ->> 'certificate_serial'), ''), m.serial)
         where m.member_no = d ->> 'membership_no' and m.imported and m.status in ('Permanent', 'Expired', 'Suspended')
        returning m.id into v_member;
        if v_member is null then
          raise exception 'member no longer in the register, or now managed on the platform';
        end if;
        update public.import_rows set result = 'updated' where import_id = p_import and row_no = x.row_no;
        n_updated := n_updated + 1;
      end if;
    exception when others then
      update public.import_rows set result = 'error: ' || left(sqlerrm, 200) where import_id = p_import and row_no = x.row_no;
      n_failed := n_failed + 1;
    end;
  end loop;
  -- the official number sequences continue after the highest imported number (never handing it out again)
  select max(substring(m.member_no from '^MCCI-C-([0-9]+)$')::bigint) into v_max from public.members m;
  if v_max is not null and v_max >= (select last_value from public.member_no_c) then
    perform setval('public.member_no_c', v_max, true);
  end if;
  select max(substring(m.member_no from '^MCCI-A-([0-9]+)$')::bigint) into v_max from public.members m;
  if v_max is not null and v_max >= (select last_value from public.member_no_a) then
    perform setval('public.member_no_a', v_max, true);
  end if;
  update public.imports
     set status = 'committed', committed_at = now(), committed_by = auth.uid(),
         rows_ok = n_created + n_updated,
         report = coalesce(report, '{}') || jsonb_build_object('created', n_created, 'updated', n_updated, 'skipped', n_skipped, 'failed', n_failed)
   where id = p_import;
  return query select n_created, n_updated, n_skipped, n_failed;
end $$;

create function api.import_discard(p_import uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('member import discarded');
  update public.imports set status = 'discarded' where id = p_import and status = 'preview';
  if not found then
    raise exception 'this import is not open for changes' using errcode = 'P0001', hint = 'closed';
  end if;
end $$;

-- rows this import created are removed while nothing refers to them; updates stay (old values in the audit log)
create function api.import_rollback(p_import uuid) returns table (removed int, kept int)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  x public.import_rows;
  v_company uuid;
  n_removed int := 0;
  n_kept int := 0;
begin
  if auth.uid() is null or private.staff_level('reg') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if (select i.status from public.imports i where i.id = p_import for update) is distinct from 'committed' then
    raise exception 'only a committed import can be rolled back' using errcode = 'P0001', hint = 'closed';
  end if;
  perform private.set_reason('member import rolled back');
  for x in select * from public.import_rows r where r.import_id = p_import and r.created_member is not null loop
    select m.company_id into v_company from public.members m where m.id = x.created_member;
    -- in use since the import (someone signed in for it, it endorsed, paid, holds a document or a temporary
    -- membership): kept, and the row says so
    if v_company is null
       or exists (select 1 from public.company_users cu where cu.company_id = v_company)
       or exists (select 1 from public.applications a where a.member_id = x.created_member or a.company_id = v_company)
       or exists (select 1 from public.endorsements e where e.endorser_member_id = x.created_member)
       or exists (select 1 from public.documents dd where dd.member_id = x.created_member or dd.company_id = v_company)
       or exists (select 1 from public.temp_memberships t where t.member_id = x.created_member)
       or exists (select 1 from public.payment_vouchers v where v.company_id = v_company) then
      update public.import_rows set result = 'kept (in use)' where import_id = p_import and row_no = x.row_no;
      n_kept := n_kept + 1;
      continue;
    end if;
    begin
      update public.import_rows set created_member = null, result = 'rolled back' where import_id = p_import and row_no = x.row_no;
      delete from public.members m where m.id = x.created_member;
      delete from public.companies c where c.id = v_company
        and not exists (select 1 from public.members m where m.company_id = v_company);
      n_removed := n_removed + 1;
    exception when foreign_key_violation then
      -- anything else that refers to it keeps it (the block's changes are undone)
      update public.import_rows set result = 'kept (in use)' where import_id = p_import and row_no = x.row_no;
      n_kept := n_kept + 1;
    end;
  end loop;
  update public.imports
     set status = 'rolled_back', report = coalesce(report, '{}') || jsonb_build_object('removed', n_removed, 'kept', n_kept)
   where id = p_import;
  return query select n_removed, n_kept;
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.import_stage(text,text,text,boolean,jsonb)', 'api.import_decide(uuid,int,text)',
                           'api.import_commit(uuid,text)', 'api.import_discard(uuid)', 'api.import_rollback(uuid)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
