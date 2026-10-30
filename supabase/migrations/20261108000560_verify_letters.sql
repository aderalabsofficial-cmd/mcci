-- Issued letters (chamber services, 0380) carry a QR that opens the public verification page, so they must verify
-- there: 0520 limited the lookup to certificates, which answered "not found" for a genuine letter. Vouchers, forms and
-- receipts carry no QR and stay out. Same minimal projection, same logging, demo records still excluded.
create or replace function api.public_verify_code(p_code text, p_channel text, p_client text)
  returns table (business_name text, member_no text, category text, class text, member_status text, member_since date,
                 valid_to date, certificate_status text, certificate_ref text, replaced_by text, checked_on date)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  d public.documents;
  m public.members;
  c public.companies;
begin
  select * into d from public.documents x
   where x.code = upper(btrim(p_code)) and x.kind in ('certificate', 'temp_certificate', 'letter');
  if d.id is not null then
    select * into c from public.companies x where x.id = d.company_id;
    select * into m from public.members x where x.id = d.member_id;
  end if;
  if d.id is null or c.id is null or c.demo then
    insert into public.verify_attempts (channel, outcome, client) values (p_channel, 'none', left(p_client, 64));
    return;
  end if;
  update public.documents set scans = scans + 1 where id = d.id;
  insert into public.verify_attempts (channel, outcome, client) values (p_channel, 'found', left(p_client, 64));
  return query select c.name, m.member_no,
    case c.manufacturing when true then 'Manufacturing' when false then 'Non-manufacturing' end,
    m.class::text, case when m.id is null then null else private.public_member_status(m) end, m.since, m.valid_to,
    private.public_cert_status(d), d.code,
    (select s.code from public.documents s where s.id = d.superseded_by),
    (now() at time zone 'Asia/Karachi')::date;
end $$;
