-- 0490 · Engagement (M8 part 1; docs/05 M10, docs/06 eng, actions note.*, ev.*, event.reg, ticket.*, tk.*, post.*).
--
-- Messages: a person's own read state for company-wide notices (notification_reads; the 0210 gap), mark one / all.
-- Events (ev.create / ev.edit, eng ≥ 2) and registration (event.reg, company area events ≥ 2, one per company, seats
--   respected, published events only), with an emailed confirmation.
-- Tickets (ticket.new from the portal; the public desk is 0370 site_contact): replies on both sides (ticket.reply),
--   assign (tk.assign) and resolve (tk.resolve) by staff eng ≥ 2; the other side is told by email and in the portal.
-- Website content (post.create / post.edit, eng ≥ 2): news, notices and circulars in English and Urdu; Live posts
--   appear on the public site.
-- Every change is audited (0240 triggers + reasons); staff steps need the 2-step login (private.staff_level).

-- ───────── messages: per-person read state ─────────

create table public.notification_reads (
  notification_id uuid not null references public.notifications on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);
alter table public.notification_reads enable row level security;
grant select on public.notification_reads to authenticated;
create policy notification_reads_own on public.notification_reads for select to authenticated using (user_id = (select auth.uid()));

create function api.note_read(p_note uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  -- only a notice this person can see (same rule as notifications_select)
  if not exists (select 1 from public.notifications n where n.id = p_note
                  and (n.user_id = auth.uid() or (n.user_id is null and private.company_level(n.company_id, n.area) >= 1))) then
    raise exception 'not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  insert into public.notification_reads (notification_id, user_id) values (p_note, auth.uid()) on conflict do nothing;
end $$;

create function api.note_read_all() returns int
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  n int;
begin
  if auth.uid() is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.notification_reads (notification_id, user_id)
  select x.id, auth.uid() from public.notifications x
   where (x.user_id = auth.uid() or (x.user_id is null and private.company_level(x.company_id, x.area) >= 1))
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- ───────── events ─────────

create function api.ev_save(p_id uuid, p_title text, p_title_ur text, p_type text, p_starts_at timestamptz, p_venue text,
                            p_seats int, p_body text, p_body_ur text, p_published boolean)
  returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_title, ''))) not between 3 and 200 or p_starts_at is null
     or (p_seats is not null and p_seats not between 1 and 100000)
     or length(coalesce(p_body, '')) > 8000 or length(coalesce(p_body_ur, '')) > 8000 then
    raise exception 'check the event details' using errcode = 'P0001', hint = 'fields';
  end if;
  if p_id is not null and p_seats is not null
     and p_seats < (select count(*) from public.event_registrations r where r.event_id = p_id) then
    raise exception 'more companies are registered than these seats' using errcode = 'P0001', hint = 'seats';
  end if;
  perform private.set_reason(case when p_id is null then 'event created' else 'event edited' end);
  if p_id is null then
    insert into public.events (title, title_ur, type, starts_at, venue, seats, body, body_ur, published)
    values (btrim(p_title), nullif(btrim(p_title_ur), ''), nullif(btrim(p_type), ''), p_starts_at, nullif(btrim(p_venue), ''),
            p_seats, nullif(btrim(p_body), ''), nullif(btrim(p_body_ur), ''), coalesce(p_published, false))
    returning id into v_id;
  else
    update public.events
       set title = btrim(p_title), title_ur = nullif(btrim(p_title_ur), ''), type = nullif(btrim(p_type), ''), starts_at = p_starts_at,
           venue = nullif(btrim(p_venue), ''), seats = p_seats, body = nullif(btrim(p_body), ''), body_ur = nullif(btrim(p_body_ur), ''),
           published = coalesce(p_published, false)
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'event not found' using errcode = 'P0001', hint = 'not_found';
    end if;
  end if;
  return v_id;
end $$;

-- event.reg: one registration per company, while seats last; the person registering is emailed the confirmation
create function api.event_register(p_event uuid, p_company uuid)
  returns table (email_id bigint, to_email text, name text, title text, starts_at timestamptz, venue text, ticket_code text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  e public.events;
  v_code text;
  p record;
  v_mail bigint;
begin
  if auth.uid() is null or private.company_level(p_company, 'events') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into e from public.events x where x.id = p_event and x.published for update;
  if e.id is null then
    raise exception 'event not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if e.starts_at < now() then
    raise exception 'this event has already started' using errcode = 'P0001', hint = 'past';
  end if;
  if exists (select 1 from public.event_registrations r where r.event_id = e.id and r.company_id = p_company) then
    raise exception 'already registered' using errcode = 'P0001', hint = 'already';
  end if;
  if e.seats is not null and (select count(*) from public.event_registrations r where r.event_id = e.id) >= e.seats then
    raise exception 'no seats left' using errcode = 'P0001', hint = 'full';
  end if;
  perform private.set_reason('event registration');
  insert into public.event_registrations (event_id, company_id, user_id) values (e.id, p_company, auth.uid())
  returning event_registrations.ticket_code into v_code;
  select pr.email::text as email, pr.full_name into p from public.profiles pr where pr.id = auth.uid();
  if p.email is not null then
    insert into public.email_log (template_key, to_email, status, created_by) values ('event_registered', p.email, 'queued', auth.uid())
    returning id into v_mail;
  end if;
  return query select v_mail, p.email, p.full_name, e.title, e.starts_at, e.venue, v_code;
end $$;

-- ───────── tickets ─────────

-- ticket.new from the portal (Help & Support): for the person's company
create function api.ticket_new(p_company uuid, p_subject text, p_body text) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_id text;
begin
  if auth.uid() is null or (p_company is not null and p_company not in (select private.my_company_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_subject, ''))) not between 3 and 200 or length(btrim(coalesce(p_body, ''))) not between 5 and 4000 then
    raise exception 'subject and message please' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.set_reason('help ticket opened');
  insert into public.tickets (company_id, created_by, name, email, subject, body)
  select p_company, auth.uid(), pr.full_name, pr.email, btrim(p_subject), btrim(p_body) from public.profiles pr where pr.id = auth.uid()
  returning id into v_id;
  return v_id;
end $$;

-- ticket.reply: the requester (own ticket / company) or staff (eng ≥ 2); a staff reply moves Open → In progress and
-- tells the requester by email (a public ticket has only its email); a member reply reopens a resolved ticket
create function api.ticket_reply(p_ticket text, p_body text)
  returns table (email_id bigint, to_email text, name text, ticket text, staff boolean)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  t public.tickets;
  v_staff boolean;
  v_mail bigint;
  v_to text;
begin
  select * into t from public.tickets x where x.id = p_ticket for update;
  if t.id is null or auth.uid() is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_staff := private.staff_level('eng') >= 2;
  if not v_staff and not (t.created_by = auth.uid() or t.company_id in (select private.my_company_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'write a reply' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.set_reason(case when v_staff then 'ticket answered' else 'ticket reply from the requester' end);
  insert into public.ticket_messages (ticket_id, by_user, by_name, body)
  values (t.id, auth.uid(), private.staff_name(), btrim(p_body));
  if v_staff then
    update public.tickets set status = case when status = 'Open' then 'In progress'::public.ticket_status else status end,
           assigned_to = coalesce(assigned_to, auth.uid())
     where id = t.id;
    v_to := coalesce(t.email::text, (select pr.email::text from public.profiles pr where pr.id = t.created_by));
    if t.company_id is not null then
      perform private.company_notify_t(t.company_id, 'profile', 'ticket.reply', jsonb_build_object('ticket', t.id),
        'Reply to ' || t.id, 'MCCI replied to your ticket ' || t.id || '.', '/portal/support?t=' || t.id);
    end if;
  else
    update public.tickets set status = 'Open' where id = t.id and status in ('Resolved', 'Closed');
  end if;
  if v_to is not null then
    insert into public.email_log (template_key, to_email, status, created_by) values ('ticket_reply', v_to, 'queued', auth.uid())
    returning id into v_mail;
  end if;
  return query select v_mail, v_to, t.name, t.id, v_staff;
end $$;

create function api.ticket_assign(p_ticket text, p_staff uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.staff s where s.user_id = p_staff and s.active) then
    raise exception 'not a staff member' using errcode = 'P0001', hint = 'staff';
  end if;
  perform private.set_reason('ticket assigned');
  update public.tickets set assigned_to = p_staff, status = case when status = 'Open' then 'In progress'::public.ticket_status else status end
   where id = p_ticket;
  if not found then
    raise exception 'ticket not found' using errcode = 'P0001', hint = 'not_found';
  end if;
end $$;

create function api.ticket_resolve(p_ticket text, p_note text)
  returns table (email_id bigint, to_email text, name text, ticket text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  t public.tickets;
  v_to text;
  v_mail bigint;
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into t from public.tickets x where x.id = p_ticket for update;
  if t.id is null then
    raise exception 'ticket not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if t.status in ('Resolved', 'Closed') then
    raise exception 'already resolved' using errcode = 'P0001', hint = 'closed';
  end if;
  perform private.set_reason('ticket resolved');
  if length(btrim(coalesce(p_note, ''))) > 0 then
    insert into public.ticket_messages (ticket_id, by_user, by_name, body) values (t.id, auth.uid(), private.staff_name(), left(btrim(p_note), 4000));
  end if;
  update public.tickets set status = 'Resolved', assigned_to = coalesce(assigned_to, auth.uid()) where id = t.id;
  if t.company_id is not null then
    perform private.company_notify_t(t.company_id, 'profile', 'ticket.resolved', jsonb_build_object('ticket', t.id),
      'Ticket ' || t.id || ' resolved', 'MCCI marked your ticket ' || t.id || ' as resolved.', '/portal/support?t=' || t.id);
  end if;
  v_to := coalesce(t.email::text, (select pr.email::text from public.profiles pr where pr.id = t.created_by));
  if v_to is not null then
    insert into public.email_log (template_key, to_email, status, created_by) values ('ticket_resolved', v_to, 'queued', auth.uid())
    returning id into v_mail;
  end if;
  return query select v_mail, v_to, t.name, t.id;
end $$;


-- ───────── website content ─────────

create function api.post_save(p_id uuid, p_category text, p_title text, p_title_ur text, p_body text, p_body_ur text, p_status text)
  returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_status not in ('Draft', 'Live', 'Archived') or p_category not in ('News', 'Notice', 'Circular', 'Event')
     or length(btrim(coalesce(p_title, ''))) not between 3 and 200 or length(btrim(coalesce(p_body, ''))) not between 3 and 20000
     or length(coalesce(p_body_ur, '')) > 20000 or length(coalesce(p_title_ur, '')) > 200 then
    raise exception 'check the post' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.set_reason(case when p_id is null then 'post created' else 'post edited' end || ' (' || p_status || ')');
  if p_id is null then
    insert into public.posts (category, title, title_ur, body, body_ur, status, published_at)
    values (p_category, btrim(p_title), nullif(btrim(p_title_ur), ''), btrim(p_body), nullif(btrim(p_body_ur), ''), p_status,
            case when p_status = 'Live' then now() end)
    returning id into v_id;
  else
    update public.posts
       set category = p_category, title = btrim(p_title), title_ur = nullif(btrim(p_title_ur), ''), body = btrim(p_body),
           body_ur = nullif(btrim(p_body_ur), ''), status = p_status,
           published_at = case when p_status = 'Live' then coalesce(published_at, now()) else published_at end
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'post not found' using errcode = 'P0001', hint = 'not_found';
    end if;
  end if;
  return v_id;
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.note_read(uuid)', 'api.note_read_all()',
                           'api.ev_save(uuid,text,text,text,timestamptz,text,int,text,text,boolean)', 'api.event_register(uuid,uuid)',
                           'api.ticket_new(uuid,text,text)', 'api.ticket_reply(text,text)', 'api.ticket_assign(text,uuid)',
                           'api.ticket_resolve(text,text)', 'api.post_save(uuid,text,text,text,text,text,text)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
