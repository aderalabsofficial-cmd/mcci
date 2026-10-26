-- 0370 · Public website data (M2; docs/05 M2, actions track.go, contact.send, dir.view; prototype site/*).
--
-- Everything here is called by the app's server only (service role), behind its own per-address rate limits, so the
-- public never talks to these functions directly. Nothing returns names, contacts, CNICs, form contents or files:
--   site_stats    — counts for the home counters and the live board (official members only; demo data left out)
--   site_feed     — the anonymised activity feed: token, kind, stage / status, time (as the prototype's live board)
--   site_track    — one token's stage and dates (no names)
--   site_contact  — the contact form and complaint desk create a ticket; returns its number and the tracking ref
-- The public directory keeps using public.public_directory (0130), now without demo companies.

create or replace view public.public_directory with (security_invoker = false) as
  select m.member_no, c.name as company, m.class, c.sector, m.status, m.valid_to
  from public.members m join public.companies c on c.id = m.company_id
  where m.public_listing and m.status in ('Permanent','Temporary') and not c.demo;

create function api.site_stats()
  returns table (members int, temporary int, converted int, services_issued int, services_open int, applications_open int)
  language sql stable security definer set search_path = ''
  as $$
    select
      (select count(*)::int from public.members m join public.companies c on c.id = m.company_id
        where not c.demo and m.status in ('Permanent', 'Temporary')),
      (select count(*)::int from public.members m join public.companies c on c.id = m.company_id
        where not c.demo and m.status = 'Temporary'),
      (select count(*)::int from public.applications a join public.companies c on c.id = a.company_id
        where not c.demo and a.stage = 'permanent'),
      (select count(*)::int from public.service_requests s join public.companies c on c.id = s.company_id
        where not c.demo and s.status = 'Issued'),
      (select count(*)::int from public.service_requests s join public.companies c on c.id = s.company_id
        where not c.demo and s.status not in ('Issued', 'Rejected', 'Cancelled')),
      (select count(*)::int from public.applications a join public.companies c on c.id = a.company_id
        where not c.demo and a.stage in ('submitted', 'review', 'returned', 'proposer', 'committee', 'payment'))
  $$;

create function api.site_feed(p_limit int default 8)
  returns table (kind text, token text, status text, at timestamptz)
  language sql stable security definer set search_path = ''
  as $$
    select * from (
      select 'membership'::text, a.token, a.stage::text, coalesce(a.decided_at, a.submitted_at)
        from public.applications a join public.companies c on c.id = a.company_id
       where not c.demo and a.submitted_at is not null and a.stage not in ('draft', 'withdrawn')
      union all
      select s.service_key, s.token, s.status::text, s.submitted_at
        from public.service_requests s join public.companies c on c.id = s.company_id
       where not c.demo and s.status <> 'Cancelled'
    ) f
    order by 4 desc nulls last
    limit least(greatest(coalesce(p_limit, 8), 1), 20)
  $$;

-- one token: stage / status and dates only
create function api.site_track(p_token text)
  returns table (kind text, token text, status text, submitted_at timestamptz, decided_at timestamptz, due_at timestamptz, printing boolean)
  language sql stable security definer set search_path = ''
  as $$
    select 'membership'::text, a.token, a.stage::text, a.submitted_at, a.decided_at, null::timestamptz,
           exists (select 1 from public.print_items p where p.member_id = a.member_id and p.status in ('sent', 'printing', 'received'))
      from public.applications a
     where a.token = upper(btrim(p_token)) and a.stage not in ('draft', 'withdrawn')
    union all
    select s.service_key, s.token, s.status::text, s.submitted_at, null, s.sla_due_at, false
      from public.service_requests s
     where s.token = upper(btrim(p_token)) and s.status <> 'Cancelled'
    limit 1
  $$;

create function api.site_contact(p_kind text, p_name text, p_contact text, p_subject text, p_ref text, p_category text, p_body text)
  returns table (ticket text, public_ref text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_email text := case when btrim(coalesce(p_contact, '')) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then lower(btrim(p_contact)) end;
  v_subject text;
  v_body text;
begin
  if p_kind not in ('contact', 'complaint') then
    raise exception 'unknown form' using errcode = 'P0001', hint = 'kind';
  end if;
  if length(btrim(coalesce(p_name, ''))) not between 2 and 120 or length(btrim(coalesce(p_contact, ''))) not between 5 and 160
     or length(btrim(coalesce(p_body, ''))) not between 5 and 4000 then
    raise exception 'fill in the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  v_subject := left(case when p_kind = 'complaint' then 'Complaint: ' || coalesce(nullif(btrim(p_category), ''), 'Other')
                         else coalesce(nullif(btrim(p_subject), ''), 'Message') end, 200);
  -- the contact detail, the reference the visitor gave and the category go with the message, as written
  v_body := left(btrim(p_body), 4000) || E'\n\n— ' || btrim(p_name) || ' · ' || btrim(p_contact)
            || case when nullif(btrim(p_ref), '') is not null then ' · ref ' || left(btrim(p_ref), 40) else '' end;
  perform private.set_reason('public ' || p_kind || ' form');
  return query
    insert into public.tickets (name, email, subject, body, created_by)
    values (left(btrim(p_name), 120), v_email::extensions.citext, v_subject, left(v_body, 8000), null)
    returning id, tickets.public_ref;
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.site_stats()', 'api.site_feed(int)', 'api.site_track(text)', 'api.site_contact(text,text,text,text,text,text,text)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- the Urdu launch countdown on the home page (prototype: 5 Nov 2026, 13:02 PKT); hidden once the moment has passed.
-- TODO(MCCI): confirm the public launch date (docs/14); change it in settings without a deploy.
insert into private.settings (key, value) values ('site', '{"launchAt": "2026-11-05T13:02:00+05:00"}'::jsonb)
on conflict (key) do nothing;
create or replace view public.public_settings with (security_invoker = false) as
  select key, value from private.settings where key in ('chamber', 'fees', 'lang', 'app', 'membership', 'sla', 'site');
