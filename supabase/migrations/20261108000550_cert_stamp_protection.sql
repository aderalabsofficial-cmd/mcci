-- 0550 · Certificate QR placement: unstamped certificates stay with staff (owner, 30 Oct 2026; docs/26).
--
-- Confirming a scan and saving its QR copy are now separate steps, so a confirmed certificate can exist for a while
-- with documents.path still pointing at the ORIGINAL scan. Members must only ever receive the final QR-stamped copy —
-- also when stamping failed or was never finished. Enforced here, not in the screens:
--   private.cert_copy_ready(path)  false for a scan (scans/<id>/…) that is not the stamped copy
--   documents_select               a member's company sees the document only when it is ready; staff as before
--   api.cert_file / api.cert_view  refuse a not-ready document unless the caller is certificate or documents staff
--   api.cert_scan_stamped          also stores the placement (shares of the original scan's size + mm) and logs it,
--                                  so a regenerated copy starts from the last position; every save is audited

alter table public.certificate_scans add column qr_placement jsonb;

create function private.cert_copy_ready(p_path text) returns boolean
  language sql immutable set search_path = ''
  as $$ select p_path is null or p_path not like 'scans/%' or p_path ~ '^scans/[0-9a-f-]{36}/stamped\.png$' $$;
revoke all on function private.cert_copy_ready(text) from public, anon;
grant execute on function private.cert_copy_ready(text) to authenticated, service_role;

drop policy documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
  using ((private.company_level(company_id, 'docs') >= 1 and private.cert_copy_ready(path))
         or (select private.staff_level('docs')) >= 1 or (select private.staff_level('temp')) >= 1);

create or replace function api.cert_file(p_code text) returns table (path text, status text, member_no text)
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  d public.documents;
begin
  select * into d from public.documents x where x.code = upper(btrim(p_code)) and x.kind = 'certificate';
  if d.id is null or auth.uid() is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not (private.staff_level('temp') >= 1
          or (private.company_level(d.company_id, 'docs') >= 1 and private.cert_copy_ready(d.path))) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query select d.path, d.status::text, (select m.member_no from public.members m where m.id = d.member_id);
end $$;

create or replace function api.cert_view(p_code text)
  returns table (code text, kind text, title text, status text, company text, class text, women boolean, member_no text,
                 issued_at timestamptz, expires_at timestamptz, extended boolean, temp_status text, voucher_no text, valid_to date)
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  d public.documents;
begin
  select * into d from public.documents x where x.code = upper(btrim(p_code));
  if d.id is null or auth.uid() is null
     or not ((private.company_level(d.company_id, 'docs') >= 1 and private.cert_copy_ready(d.path))
             or private.staff_level('docs') >= 1 or private.staff_level('temp') >= 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select d.code, d.kind::text, d.title, d.status::text, c.name, m.class::text, m.women, m.member_no,
           t.issued_at, t.expires_at, coalesce(t.extensions, 0) > 0, t.status::text,
           (select v.voucher_no from public.payment_vouchers v join public.applications a on a.id = v.ref_id
             where v.ref_type = 'membership' and a.member_id = m.id and v.status = 'Paid' order by v.paid_at desc limit 1),
           d.valid_to
    from public.documents x
    left join public.companies c on c.id = d.company_id
    left join public.members m on m.id = d.member_id
    left join public.temp_memberships t on t.certificate_doc = d.id
    where x.id = d.id;
end $$;

drop function api.cert_scan_stamped(uuid, text);
create function api.cert_scan_stamped(p_id uuid, p_path text, p_placement jsonb) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  s public.certificate_scans;
  v_again boolean;
begin
  if auth.uid() is null or private.staff_level('temp') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into s from public.certificate_scans x where x.id = p_id for update;
  if s.id is null or s.status <> 'confirmed' or s.document_id is null or p_path is distinct from 'scans/' || p_id || '/stamped.png' then
    raise exception 'only a confirmed scan' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if jsonb_typeof(p_placement -> 'cx') <> 'number' or jsonb_typeof(p_placement -> 'cy') <> 'number' or jsonb_typeof(p_placement -> 'mm') <> 'number'
     or (p_placement ->> 'cx')::numeric not between 0 and 1 or (p_placement ->> 'cy')::numeric not between 0 and 1
     or (p_placement ->> 'mm')::numeric not between 15 and 45 then
    raise exception 'placement out of range' using errcode = 'P0001', hint = 'path';
  end if;
  v_again := s.stamped_path is not null;
  perform private.set_reason(case when v_again then 'QR copy of the certificate replaced' else 'QR stamped on the certificate scan' end);
  update public.certificate_scans x set stamped_path = p_path, qr_placement = p_placement where x.id = p_id;
  update public.documents d set path = p_path where d.id = s.document_id;
  perform private.scan_log(p_id, case when v_again then 'QR copy replaced' else 'QR stamped' end, p_placement::text);
end $$;
revoke all on function api.cert_scan_stamped(uuid, text, jsonb) from public, anon;
grant execute on function api.cert_scan_stamped(uuid, text, jsonb) to authenticated;
