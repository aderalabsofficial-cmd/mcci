-- 0540 · Trade opportunities (owner instruction Part 3.2; prototype member/opportunities; D-M17 approval).
--
-- Members post requirements (Pending until staff with Events & content ≥ 2 publish or reject them); MCCI shares buyer
-- inquiries (published at once). Every post has an expiry date: past it, it is no longer listed or answerable — no
-- scheduled job needed (jobs stay off). Members express interest once per company (no duplicates) and may withdraw;
-- a post's company may withdraw its post. Owners are notified (portal + email template) of decisions and interest.
-- All changes go through these functions (permission checked here, audited by the row triggers).

alter table public.opportunities drop constraint opportunities_status_check;
alter table public.opportunities
  add constraint opportunities_status_check check (status in ('Pending','Published','Closed','Rejected','Withdrawn')),
  add column market text,
  add column expires_at date not null default ((now() at time zone 'Asia/Karachi')::date + 30),
  add column decided_by uuid references public.profiles,
  add column decided_at timestamptz,
  add column reject_reason text;
create index opportunities_listed on public.opportunities (status, expires_at);

alter table public.opportunity_replies
  add column status text not null default 'Interested' check (status in ('Interested','Withdrawn')),
  add column updated_at timestamptz not null default now();
create unique index opportunity_replies_one on public.opportunity_replies (opportunity_id, company_id);

-- direct client inserts are replaced by the functions below
revoke insert on public.opportunities, public.opportunity_replies from authenticated;
drop policy if exists opportunities_insert on public.opportunities;
drop policy if exists replies_insert on public.opportunity_replies;

create function private.opp_today() returns date language sql stable set search_path = ''
  as $$ select (now() at time zone 'Asia/Karachi')::date $$;

-- ───────── members ─────────
create function api.opp_post(p_company uuid, p_title text, p_body text, p_sector text, p_market text, p_days int)
  returns uuid language plpgsql volatile security definer set search_path = ''
  as $$
declare v_id uuid;
begin
  if auth.uid() is null or private.company_level(p_company, 'events') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_title, ''))) not between 5 and 160 or length(btrim(coalesce(p_body, ''))) not between 10 and 4000
     or coalesce(p_days, 30) not between 1 and 90 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.set_reason('trade requirement posted');
  insert into public.opportunities (kind, company_id, title, body, sector, market, status, expires_at)
  values ('requirement', p_company, btrim(p_title), btrim(p_body), nullif(btrim(p_sector), ''), nullif(btrim(p_market), ''),
          'Pending', private.opp_today() + coalesce(p_days, 30))
  returning id into v_id;
  return v_id;
end $$;

create function api.opp_withdraw_post(p_id uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare o public.opportunities;
begin
  select * into o from public.opportunities x where x.id = p_id for update;
  if o.id is null or auth.uid() is null or o.company_id is null or private.company_level(o.company_id, 'events') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if o.status not in ('Pending', 'Published') then
    raise exception 'already closed' using errcode = 'P0001', hint = 'closed';
  end if;
  perform private.set_reason('trade requirement withdrawn by its company');
  update public.opportunities set status = 'Withdrawn' where id = p_id;
end $$;

create function api.opp_interest(p_id uuid, p_company uuid, p_body text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  o public.opportunities;
  r public.opportunity_replies;
begin
  if auth.uid() is null or private.company_level(p_company, 'events') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into o from public.opportunities x where x.id = p_id;
  if o.id is null or o.status <> 'Published' or o.expires_at < private.opp_today() then
    raise exception 'not open' using errcode = 'P0001', hint = 'closed';
  end if;
  if o.company_id = p_company then
    raise exception 'own post' using errcode = 'P0001', hint = 'own';
  end if;
  if length(btrim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  select * into r from public.opportunity_replies x where x.opportunity_id = p_id and x.company_id = p_company for update;
  if r.id is not null and r.status = 'Interested' then
    raise exception 'already interested' using errcode = 'P0001', hint = 'duplicate';
  end if;
  perform private.set_reason('interest in a trade opportunity');
  if r.id is null then
    insert into public.opportunity_replies (opportunity_id, company_id, body) values (p_id, p_company, btrim(p_body));
  else
    update public.opportunity_replies set status = 'Interested', body = btrim(p_body), updated_at = now() where id = r.id;
  end if;
  if o.company_id is not null then
    perform private.company_notify_t(o.company_id, 'events', 'opp_interest', jsonb_build_object('title', o.title),
      'Interest in your trade requirement', 'A member is interested in “' || o.title || '”. See Trade opportunities.',
      '/portal/opportunities');
  end if;
end $$;

create function api.opp_withdraw_interest(p_id uuid, p_company uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.company_level(p_company, 'events') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('interest withdrawn');
  update public.opportunity_replies set status = 'Withdrawn', updated_at = now()
   where opportunity_id = p_id and company_id = p_company and status = 'Interested';
  if not found then
    raise exception 'nothing to withdraw' using errcode = 'P0001', hint = 'closed';
  end if;
end $$;

-- ───────── staff (Events, complaints & content ≥ 2) ─────────
create function api.opp_share(p_title text, p_body text, p_sector text, p_market text, p_days int) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_id uuid;
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_title, ''))) not between 5 and 160 or length(btrim(coalesce(p_body, ''))) not between 10 and 4000
     or coalesce(p_days, 30) not between 1 and 180 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.set_reason('buyer inquiry shared by MCCI');
  insert into public.opportunities (kind, company_id, title, body, sector, market, status, expires_at, decided_by, decided_at)
  values ('inquiry', null, btrim(p_title), btrim(p_body), nullif(btrim(p_sector), ''), nullif(btrim(p_market), ''),
          'Published', private.opp_today() + coalesce(p_days, 30), auth.uid(), now())
  returning id into v_id;
  return v_id;
end $$;

create function api.opp_decide(p_id uuid, p_publish boolean, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare o public.opportunities;
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into o from public.opportunities x where x.id = p_id for update;
  if o.id is null or o.status <> 'Pending' then
    raise exception 'not pending' using errcode = 'P0001', hint = 'closed';
  end if;
  if not p_publish and length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is needed' using errcode = 'P0001', hint = 'reason';
  end if;
  perform private.set_reason(case when p_publish then 'trade requirement published' else 'trade requirement rejected' end);
  update public.opportunities
     set status = case when p_publish then 'Published' else 'Rejected' end,
         reject_reason = case when p_publish then null else btrim(p_reason) end,
         decided_by = auth.uid(), decided_at = now()
   where id = p_id;
  if o.company_id is not null then
    perform private.company_notify_t(o.company_id, 'events', case when p_publish then 'opp_published' else 'opp_rejected' end,
      jsonb_build_object('title', o.title),
      case when p_publish then 'Your trade requirement is published' else 'Your trade requirement was not published' end,
      case when p_publish then '“' || o.title || '” is now visible to members.' else '“' || o.title || '”: ' || btrim(p_reason) end,
      '/portal/opportunities');
  end if;
end $$;

create function api.opp_close(p_id uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('trade opportunity closed by MCCI');
  update public.opportunities set status = 'Closed' where id = p_id and status in ('Pending', 'Published');
  if not found then
    raise exception 'already closed' using errcode = 'P0001', hint = 'closed';
  end if;
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.opp_post(uuid,text,text,text,text,integer)', 'api.opp_withdraw_post(uuid)',
                           'api.opp_interest(uuid,uuid,text)', 'api.opp_withdraw_interest(uuid,uuid)',
                           'api.opp_share(text,text,text,text,integer)', 'api.opp_decide(uuid,boolean,text)',
                           'api.opp_close(uuid)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke all on function private.opp_today() from public, anon, authenticated;
