-- 0450 · Certificates printed by the State Bank security printing press (owner's list of 28 Oct 2026, docs/21 point 30,
-- docs/22 §4). Release R4.
--
-- MCCI receives the printed certificates and uploads their scans. The app reads each scan with AI (number, company,
-- class, year, valid-to and given-on dates, NTN, book / serial no., each with a confidence), the database matches it to the member and
-- lists every conflict. Nothing is created or overwritten from the reading: a person reviews and confirms (a conflict
-- needs an explicit override with a reason, by the SG-level certificate approver). On confirmation the certificate
-- gets a QR code (public.documents, kind 'certificate'; an earlier valid certificate of the member is superseded) and
-- the app stamps that QR on the scan (top-right). The member's identity, official number and validity never change
-- here; the serial is only filled when the member has none (a different serial is a conflict).
-- Files: bucket 'certificates', path scans/<scan id>/…; read and written by the server only (service role) after the
-- staff member's permission check — no browser reads a scan from storage directly.
-- Module 'temp' (the old "Temporary & Certificates" screen) is the certificates module: view ≥ 1, upload / review /
-- confirm ≥ 2, override a conflict ≥ 3. Every step is audited (0240 trigger) and written to the scan's own log.

create table public.certificate_scans (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,                       -- scans/<id>/original.<png|jpg>
  file_name text,
  sha256 text not null unique check (sha256 ~ '^[0-9a-f]{64}$'),  -- the same scan is never taken twice
  status text not null default 'uploaded'
    check (status in ('uploaded', 'extracted', 'failed', 'confirmed', 'rejected')),
  extracted jsonb not null default '{}',           -- {field: {value, confidence}} as read; never applied by itself
  match_member uuid references public.members on delete set null,
  conflicts text[] not null default '{}',
  document_id uuid references public.documents on delete set null,
  stamped_path text,
  uploaded_by uuid references public.profiles on delete set null,
  uploaded_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or length(review_note) <= 1000),
  log jsonb not null default '[]'                  -- [{at, by, step, note}]
);
create index certificate_scans_status on public.certificate_scans (status, uploaded_at desc);
alter table public.certificate_scans enable row level security;
grant select on public.certificate_scans to authenticated;
create policy certificate_scans_select on public.certificate_scans for select to authenticated
  using ((select private.staff_level('temp')) >= 1);
create trigger audit_row after insert or update or delete on public.certificate_scans
  for each row execute function private.audit_row();

-- scans are server-only: the 0230 staff branches for this path go (members keep reading their own company files)
drop policy if exists certificates_scan_upload on storage.objects;
drop policy if exists certificates_read on storage.objects;
-- (scans/<id>/… has no company in its path, so no member branch matches it)
create policy certificates_read on storage.objects for select to authenticated using (
  bucket_id = 'certificates' and private.company_level(private.path_company(name), 'docs') >= 1);

create function private.scan_log(p_scan uuid, p_step text, p_note text) returns void
  language sql volatile security definer set search_path = ''
  as $$
    update public.certificate_scans set log = log || jsonb_build_array(jsonb_build_object(
      'at', now(), 'by', private.staff_name(), 'step', p_step, 'note', left(coalesce(p_note, ''), 500)))
     where id = p_scan
  $$;
revoke all on function private.scan_log(uuid, text, text) from public, anon, authenticated, service_role;

-- one scan uploaded (the app stored the file with the service role after checking temp ≥ 2)
create function api.cert_scan_register(p_id uuid, p_path text, p_sha256 text, p_file_name text) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('temp') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_path is distinct from 'scans/' || p_id || '/original.png' and p_path is distinct from 'scans/' || p_id || '/original.jpg' then
    raise exception 'unexpected path' using errcode = 'P0001', hint = 'path';
  end if;
  if exists (select 1 from public.certificate_scans s where s.sha256 = lower(p_sha256) and s.status <> 'rejected') then
    raise exception 'this scan was already uploaded' using errcode = 'P0001', hint = 'duplicate';
  end if;
  perform private.set_reason('certificate scan uploaded');
  insert into public.certificate_scans (id, path, file_name, sha256, uploaded_by)
  values (p_id, p_path, left(p_file_name, 200), lower(p_sha256), auth.uid());
  perform private.scan_log(p_id, 'uploaded', p_file_name);
  return p_id;
end $$;

-- similarity of two company names, 0..1 (pg_trgm), for the "name differs" conflict
create function private.name_similar(a text, b text) returns real
  language sql immutable set search_path = ''
  as $$ select extensions.similarity(lower(coalesce(a, '')), lower(coalesce(b, ''))) $$;
revoke all on function private.name_similar(text, text) from public, anon, authenticated, service_role;

-- the reading (or its failure) is stored; the database matches the member and lists the conflicts
create function api.cert_scan_extracted(p_id uuid, p_data jsonb) returns table (status text, member_id uuid, conflicts text[])
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  s public.certificate_scans;
  m public.members;
  v_no text;
  v_conf text[] := '{}';
  v_name text;
  k text;
  v_low int := coalesce((select (x.value ->> 'certificateLowConfidence')::int from private.settings x where x.key = 'membership'), 70);
begin
  if auth.uid() is null or private.staff_level('temp') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into s from public.certificate_scans x where x.id = p_id for update;
  if s.id is null or s.status not in ('uploaded', 'extracted', 'failed') then
    raise exception 'this scan is not waiting for a reading' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason('certificate scan read');
  if p_data is null then
    update public.certificate_scans x set status = 'failed', extracted = '{}', conflicts = array['unreadable'] where x.id = p_id;
    perform private.scan_log(p_id, 'reading failed', null);
    return query select 'failed'::text, null::uuid, array['unreadable'];
    return;
  end if;
  v_no := private.typed_member_no(p_data #>> '{membership_no,value}');
  select * into m from public.members x
   where v_no is not null and private.typed_member_no(x.member_no) = v_no
   limit 1;
  if v_no is null then
    v_conf := v_conf || 'no_number'::text;
  elsif m.id is null then
    v_conf := v_conf || 'unknown_member'::text;
  else
    select c.name into v_name from public.companies c where c.id = m.company_id;
    if private.company_is_demo(m.company_id) then
      v_conf := v_conf || 'demo'::text;
    end if;
    if coalesce(p_data #>> '{company_name,value}', '') <> '' and private.name_similar(p_data #>> '{company_name,value}', v_name) < 0.45 then
      v_conf := v_conf || 'name_mismatch'::text;
    end if;
    if coalesce(p_data #>> '{class,value}', '') <> '' and lower(p_data #>> '{class,value}') not like '%' || lower(m.class::text) || '%' then
      v_conf := v_conf || 'class_mismatch'::text;
    end if;
    if m.serial is not null and coalesce(p_data #>> '{serial_no,value}', '') <> '' and btrim(m.serial) <> btrim(p_data #>> '{serial_no,value}') then
      v_conf := v_conf || 'serial_mismatch'::text;
    end if;
    -- NTN: digits only on both sides (8025102-0 = 80251020)
    if coalesce(p_data #>> '{ntn,value}', '') <> ''
       and coalesce((select regexp_replace(c.ntn, '\D', '', 'g') from public.companies c where c.id = m.company_id), '') <> ''
       and regexp_replace(p_data #>> '{ntn,value}', '\D', '', 'g')
           <> (select regexp_replace(c.ntn, '\D', '', 'g') from public.companies c where c.id = m.company_id) then
      v_conf := v_conf || 'ntn_mismatch'::text;
    end if;
    if exists (select 1 from public.documents d where d.member_id = m.id and d.kind = 'certificate' and d.status = 'Valid') then
      v_conf := v_conf || 'already_certified'::text;
    end if;
    if m.status not in ('Permanent', 'Temporary') then
      v_conf := v_conf || 'not_active'::text;
    end if;
  end if;
  foreach k in array array['membership_no', 'company_name', 'class', 'serial_no'] loop
    if coalesce((p_data #>> array[k, 'confidence'])::int, 0) < v_low and coalesce(p_data #>> array[k, 'value'], '') <> '' then
      v_conf := v_conf || ('low_confidence:' || k);
    end if;
  end loop;
  update public.certificate_scans x set status = 'extracted', extracted = p_data, match_member = m.id, conflicts = v_conf
   where x.id = p_id;
  perform private.scan_log(p_id, 'read', coalesce(v_no, '?') || case when cardinality(v_conf) > 0 then ' · ' || array_to_string(v_conf, ', ') else '' end);
  return query select 'extracted'::text, m.id, v_conf;
end $$;

-- a person confirms the scan for a member: the certificate's QR document is created (an earlier valid certificate of
-- the member superseded). A conflict needs p_override, a reason and the approver level (temp ≥ 3). Demo members never.
create function api.cert_scan_confirm(p_id uuid, p_member uuid, p_override boolean default false, p_note text default null)
  returns table (code text, member_no text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  s public.certificate_scans;
  m public.members;
  v_doc uuid;
  v_code text;
  v_old uuid;
  v_conf text[];
  v_serial text;
begin
  if auth.uid() is null or private.staff_level('temp') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into s from public.certificate_scans x where x.id = p_id for update;
  if s.id is null or s.status <> 'extracted' then
    raise exception 'only a read scan waiting for review' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  select * into m from public.members x where x.id = p_member for update;
  if m.id is null then
    raise exception 'member not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if private.company_is_demo(m.company_id) then
    raise exception 'demo members never get a certificate' using errcode = 'P0001', hint = 'demo';
  end if;
  -- confirming a different member than the reading matched is itself a conflict
  v_conf := s.conflicts || case when s.match_member is distinct from p_member then array['member_changed'] else '{}'::text[] end;
  if cardinality(v_conf) > 0 then
    if not coalesce(p_override, false) or coalesce(length(btrim(p_note)), 0) < 3 then
      raise exception 'conflicts must be overridden with a reason' using errcode = 'P0001', hint = 'conflicts';
    end if;
    if private.staff_level('temp') < 3 then
      raise exception 'only the certificate approver overrides a conflict' using errcode = '42501';
    end if;
  end if;
  perform private.set_reason('certificate scan confirmed for ' || m.member_no
                             || case when cardinality(v_conf) > 0 then ' (override: ' || left(btrim(p_note), 300) || ')' else '' end);
  select d.id into v_old from public.documents d
   where d.member_id = m.id and d.kind = 'certificate' and d.status = 'Valid' order by d.created_at desc limit 1;
  insert into public.documents (kind, company_id, member_id, title, status, valid_to, path)
  values ('certificate', m.company_id, m.id, 'Membership Certificate', 'Valid', m.valid_to, s.path)
  returning id, documents.code into v_doc, v_code;
  if v_old is not null then
    update public.documents set status = 'Superseded', superseded_by = v_doc where id = v_old;
  end if;
  -- the serial is filled only when the member has none (the official record is never overwritten here)
  v_serial := nullif(btrim(coalesce(s.extracted #>> '{serial_no,value}', '')), '');
  if m.serial is null and v_serial is not null then
    update public.members set serial = left(v_serial, 60) where id = m.id;
  end if;
  update public.certificate_scans x set status = 'confirmed', match_member = m.id, document_id = v_doc,
         reviewed_by = auth.uid(), reviewed_at = now(), review_note = nullif(left(btrim(coalesce(p_note, '')), 1000), '')
   where x.id = p_id;
  perform private.scan_log(p_id, 'confirmed', m.member_no || ' · QR ' || v_code
                           || case when cardinality(v_conf) > 0 then ' · override: ' || left(btrim(p_note), 300) else '' end);
  perform private.company_notify_t(m.company_id, 'docs', 'certificate.ready', jsonb_build_object('no', m.member_no, 'code', v_code),
    'Your membership certificate is ready', 'Your certificate ' || m.member_no || ' is in My Documents.', '/portal/documents');
  return query select v_code, m.member_no;
end $$;

-- the app stored the QR-stamped copy (top-right) of a confirmed scan
create function api.cert_scan_stamped(p_id uuid, p_path text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  s public.certificate_scans;
begin
  if auth.uid() is null or private.staff_level('temp') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into s from public.certificate_scans x where x.id = p_id for update;
  if s.id is null or s.status <> 'confirmed' or p_path is distinct from 'scans/' || p_id || '/stamped.png' then
    raise exception 'only a confirmed scan' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason('QR stamped on the certificate scan');
  update public.certificate_scans x set stamped_path = p_path where x.id = p_id;
  update public.documents d set path = p_path where d.id = s.document_id;
  perform private.scan_log(p_id, 'QR stamped', null);
end $$;

-- a scan that is not a certificate (or not MCCI's) is rejected with a reason; the file can be uploaded again later
create function api.cert_scan_reject(p_id uuid, p_note text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('temp') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_note)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason('certificate scan rejected: ' || left(btrim(p_note), 300));
  update public.certificate_scans x set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
         review_note = left(btrim(p_note), 1000)
   where x.id = p_id and x.status in ('uploaded', 'extracted', 'failed');
  if not found then
    raise exception 'only a scan waiting for review' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.scan_log(p_id, 'rejected', p_note);
end $$;

-- the stored file of a certificate, for the app's file route: the member's own company (docs ≥ 1) or staff (temp ≥ 1)
create function api.cert_file(p_code text) returns table (path text, status text, member_no text)
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  d public.documents;
begin
  select * into d from public.documents x where x.code = upper(btrim(p_code)) and x.kind = 'certificate';
  if d.id is null or auth.uid() is null
     or not (private.company_level(d.company_id, 'docs') >= 1 or private.staff_level('temp') >= 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query select d.path, d.status::text, (select m.member_no from public.members m where m.id = d.member_id);
end $$;

-- QR revocation of a certificate is logged on its scan too
create or replace function api.qr_revoke(p_code text, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_doc uuid;
begin
  if auth.uid() is null or private.staff_level('docs') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason('document revoked: ' || left(btrim(p_reason), 200));
  update public.documents set status = 'Revoked', revoked_reason = left(btrim(p_reason), 500)
   where code = upper(btrim(p_code)) and status <> 'Revoked'
  returning id into v_doc;
  if v_doc is null then
    raise exception 'document not found or already revoked' using errcode = 'P0001', hint = 'not_found';
  end if;
  perform private.scan_log(s.id, 'QR revoked', p_reason) from public.certificate_scans s where s.document_id = v_doc;
end $$;

insert into private.settings (key, value) values ('membership', '{}'::jsonb) on conflict (key) do nothing;
update private.settings set value = value || '{"certificateLowConfidence": 70}'::jsonb
 where key = 'membership' and not (value ? 'certificateLowConfidence');
-- where the QR goes on the scan, as shares of the page (measured on MCCI's certificate: under "Serial No.", beside the
-- heading); MCCI can move it without a deploy
update private.settings set value = value || '{"certificateQr": {"right": 0.915, "top": 0.128, "size": 0.055}}'::jsonb
 where key = 'membership' and not (value ? 'certificateQr');

do $$
declare f text;
begin
  foreach f in array array['api.cert_scan_register(uuid,text,text,text)', 'api.cert_scan_extracted(uuid,jsonb)',
                           'api.cert_scan_confirm(uuid,uuid,boolean,text)', 'api.cert_scan_stamped(uuid,text)',
                           'api.cert_scan_reject(uuid,text)', 'api.cert_file(text)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
