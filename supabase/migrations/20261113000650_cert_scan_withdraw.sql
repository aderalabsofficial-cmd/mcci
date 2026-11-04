-- 0650 · Certificate scans: undo a wrong confirmation, delete a scan (owner, 4 Nov 2026: "admin can delete uploaded
-- documents if any uploaded with a wrong company name by mistake").
--
-- Withdraw (a confirmed scan, the certificate approver: temp ≥ 3, with a reason): the QR reference it created is
-- revoked, so a scan of the printed QR says "Revoked" and the member's documents no longer offer it; the member's
-- previous certificate, if this one superseded it, is valid again; a serial that this confirmation copied onto the
-- member is cleared; the QR-stamped copy is deleted by the app; the scan goes back to "to review", so it can be
-- confirmed for the right member without uploading it again. The member is told in the portal.
-- Delete (any scan not confirmed, temp ≥ 2, with a reason): the scan is marked removed and its files deleted by the
-- app; the record, its log and the audit trail stay. A removed or rejected scan may be uploaded again (the same
-- file's fingerprint is unique only among scans still in use; 0450 refused a rejected file again by mistake).

alter table public.certificate_scans drop constraint certificate_scans_status_check;
alter table public.certificate_scans add constraint certificate_scans_status_check
  check (status in ('uploaded', 'extracted', 'failed', 'confirmed', 'rejected', 'removed'));
alter table public.certificate_scans drop constraint certificate_scans_sha256_key;
create unique index certificate_scans_sha256_live on public.certificate_scans (sha256)
  where status not in ('rejected', 'removed');

do $$
declare
  def text := pg_get_functiondef('api.cert_scan_register(uuid, text, text, text)'::regprocedure);
  anchor text := 'where s.sha256 = lower(p_sha256) and s.status <> ''rejected''';
begin
  if position(anchor in def) = 0 then raise exception '0650: cert_scan_register anchor not found'; end if;
  execute replace(def, anchor, 'where s.sha256 = lower(p_sha256) and s.status not in (''rejected'', ''removed'')');
end $$;

-- returns the QR-stamped copy's path, for the app to delete (null when none was made)
create function api.cert_scan_withdraw(p_id uuid, p_note text) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  s public.certificate_scans;
  d public.documents;
  m public.members;
  v_serial text;
begin
  if auth.uid() is null or private.staff_level('temp') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_note)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into s from public.certificate_scans x where x.id = p_id for update;
  if s.id is null or s.status <> 'confirmed' then
    raise exception 'only a confirmed scan' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason('certificate confirmation withdrawn: ' || left(btrim(p_note), 300));
  select * into d from public.documents x where x.id = s.document_id for update;
  if d.id is not null then
    -- the certificate it replaced is the member's valid one again
    if d.status = 'Valid' then
      update public.documents x set status = 'Valid', superseded_by = null
       where x.superseded_by = d.id and x.status = 'Superseded';
    end if;
    update public.documents x set status = 'Revoked', revoked_reason = left('Confirmed by mistake: ' || btrim(p_note), 500),
           path = case when x.path = s.stamped_path then s.path else x.path end
     where x.id = d.id;
    select * into m from public.members x where x.id = d.member_id for update;
    -- a serial this confirmation copied onto the member (0450 fills it only when empty) goes with it
    v_serial := nullif(btrim(coalesce(s.extracted #>> '{serial_no,value}', '')), '');
    if m.id is not null and v_serial is not null and m.serial = left(v_serial, 60)
       and not exists (select 1 from public.certificate_scans o where o.id <> s.id and o.status = 'confirmed'
                         and o.match_member = m.id and o.extracted #>> '{serial_no,value}' = v_serial) then
      update public.members x set serial = null where x.id = m.id;
    end if;
    if m.id is not null then
      insert into public.notifications (company_id, area, title, body, link, channel, template, vars)
      values (m.company_id, 'docs', 'A certificate was withdrawn',
              'The certificate ' || d.code || ' was confirmed by mistake and has been withdrawn. MCCI will issue the correct one.',
              '/portal/documents', 'Portal', null, jsonb_build_object('code', d.code));
    end if;
  end if;
  update public.certificate_scans x set status = 'extracted', document_id = null, stamped_path = null,
         reviewed_by = auth.uid(), reviewed_at = now(), review_note = left(btrim(p_note), 1000)
   where x.id = p_id;
  perform private.scan_log(p_id, 'withdrawn', coalesce(d.code, '') || ' · ' || btrim(p_note));
  return s.stamped_path;
end $$;

-- returns the scan's files, for the app to delete
create function api.cert_scan_remove(p_id uuid, p_note text) returns text[]
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  s public.certificate_scans;
begin
  if auth.uid() is null or private.staff_level('temp') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_note)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select * into s from public.certificate_scans x where x.id = p_id for update;
  if s.id is null or s.status = 'removed' then
    raise exception 'scan not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if s.status = 'confirmed' then
    raise exception 'withdraw the confirmation first' using errcode = 'P0001', hint = 'withdraw_first';
  end if;
  perform private.set_reason('certificate scan deleted: ' || left(btrim(p_note), 300));
  update public.certificate_scans x set status = 'removed', reviewed_by = auth.uid(), reviewed_at = now(),
         review_note = left(btrim(p_note), 1000)
   where x.id = p_id;
  perform private.scan_log(p_id, 'deleted', p_note);
  return array_remove(array[s.path, s.stamped_path], null);
end $$;

revoke all on function api.cert_scan_withdraw(uuid, text) from public, anon;
revoke all on function api.cert_scan_remove(uuid, text) from public, anon;
grant execute on function api.cert_scan_withdraw(uuid, text) to authenticated;
grant execute on function api.cert_scan_remove(uuid, text) to authenticated;
