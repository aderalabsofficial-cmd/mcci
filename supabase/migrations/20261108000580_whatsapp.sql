-- 0580 · WhatsApp communication (owner brief of 30 Oct 2026, docs/30).
--
-- MCCI owns contacts, consent, campaigns and history; the IQPigeon WhatsApp API only delivers. The sending rules live
-- here, in private.wa_block, and run again immediately before each message goes out, so no screen, route or direct call
-- can skip them. Nothing is sent while settings.whatsapp.sendingEnabled is false (the default). A message has one
-- idempotency key for life: a retry reuses it, never a new one. Campaign audiences are snapshots that cannot change.

-- ───────── limits and settings ─────────
-- TODO(MCCI): proposed limits; the Secretary General can change them in Staff & Roles
update public.role_permissions set level = 3 where designation = 'Deputy Secretary — Membership' and module = 'out' and level < 3;
update private.role_permission_defaults set level = 3 where designation = 'Deputy Secretary — Membership' and module = 'out';
update public.role_permissions set level = 2 where designation = 'Membership Officer' and module = 'out' and level < 2;
update private.role_permission_defaults set level = 2 where designation = 'Membership Officer' and module = 'out';

-- TODO(MCCI): consent wording needs MCCI's approval; member opt-in stays closed until consentOpen is true
insert into private.settings (key, value) values ('whatsapp',
  '{"sendingEnabled":false,"ratePerMinute":60,"maxCampaign":1000,"approvalThreshold":25,"windowHours":24,"staleMinutes":60,"consentOpen":false,"consentVersion":"draft-1"}'::jsonb)
on conflict (key) do nothing;

create function private.wa_setting(p_key text) returns text
  language sql stable set search_path = ''
  as $$ select s.value ->> p_key from private.settings s where s.key = 'whatsapp' $$;

-- ───────── consent gains categories and wording version ─────────
alter table public.outreach_consents
  add column categories text[] not null default array['announcements','membership','events','opportunities'],
  add column wording_version text check (length(wording_version) <= 40);
alter table public.outreach_contacts add column language text check (language in ('en', 'ur'));

-- ───────── tables ─────────
create table public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name ~ '^[a-z0-9_]+$' and length(name) <= 512),
  language text not null check (length(language) between 2 and 32),
  category text,
  status text not null default 'LOCAL',           -- Meta's status from the provider; LOCAL = not on the provider
  provider_id text,
  header_type text not null default 'none' check (header_type in ('none', 'image', 'document', 'video', 'text')),
  header text check (length(header) <= 200),
  body text check (length(body) <= 2000),         -- entered by staff from the approved template: the provider does not return it
  footer text check (length(footer) <= 200),
  buttons jsonb not null default '[]'::jsonb,
  var_map jsonb not null default '{}'::jsonb,     -- {"1":"business_name"}: which MCCI value fills each placeholder
  synced_at timestamptz,
  updated_by uuid references public.profiles on delete set null,
  updated_at timestamptz not null default now(),
  unique (name, language)
);

create table public.whatsapp_attachments (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  file_name text not null check (length(file_name) <= 200),
  mime text not null,
  bytes bigint not null,
  kind text not null check (kind in ('image', 'document', 'video', 'audio')),
  uploaded_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  company_id uuid references public.companies on delete set null,  -- null = unmatched, staff review it
  profile_name text check (length(profile_name) <= 200),
  status text not null default 'open' check (status in ('open', 'pending', 'resolved')),
  assigned_to uuid references public.profiles on delete set null,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  created_at timestamptz not null default now()
);
create index whatsapp_conversations_recent on public.whatsapp_conversations (coalesce(last_inbound_at, last_outbound_at, created_at) desc);
create index whatsapp_conversations_company on public.whatsapp_conversations (company_id);

create table public.whatsapp_notes (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.whatsapp_conversations on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  author uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  purpose text check (length(purpose) <= 500),
  mode text not null default 'campaign' check (mode in ('campaign', 'selective')),
  category text not null check (category in ('announcements', 'membership', 'events', 'opportunities')),
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','scheduled','queued','sending','paused','completed','partial','failed','cancelled')),
  message_kind text not null check (message_kind in ('template', 'text')),
  template_id uuid references public.whatsapp_templates on delete set null,
  body text check (length(body) <= 4096),
  attachment_id uuid references public.whatsapp_attachments on delete set null,
  segment_id uuid references public.segments on delete set null,
  filter jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles on delete set null default auth.uid(),
  approved_by uuid references public.profiles on delete set null,
  approved_at timestamptz,
  reject_reason text check (length(reject_reason) <= 300),
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index whatsapp_campaigns_due on public.whatsapp_campaigns (status, scheduled_at);

create table public.whatsapp_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.whatsapp_campaigns on delete cascade,
  company_id uuid references public.companies on delete set null,
  member_no text,
  business_name text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending','queued','submitted','sent','delivered','read','failed','skipped','cancelled')),
  reason text,
  message_id uuid,
  updated_at timestamptz not null default now(),
  unique (campaign_id, company_id)
);
create index whatsapp_recipients_next on public.whatsapp_campaign_recipients (campaign_id, status);

-- the snapshot itself cannot change: only its status, reason and message link move
create function private.wa_recipient_immutable() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.whatsapp_campaigns c where c.id = old.campaign_id) and pg_trigger_depth() = 1 then
      raise exception 'campaign audience is fixed' using errcode = 'P0001', hint = 'snapshot';
    end if;
    return old;
  end if;
  if new.campaign_id <> old.campaign_id or new.phone is distinct from old.phone or new.business_name <> old.business_name
     or new.member_no is distinct from old.member_no or (new.company_id is distinct from old.company_id and new.company_id is not null) then
    raise exception 'campaign audience is fixed' using errcode = 'P0001', hint = 'snapshot';
  end if;
  return new;
end $$;
create trigger wa_recipient_immutable before update or delete on public.whatsapp_campaign_recipients
  for each row execute function private.wa_recipient_immutable();

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.whatsapp_conversations on delete set null,
  company_id uuid references public.companies on delete set null,
  direction text not null check (direction in ('outbound', 'inbound')),
  phone text not null,
  kind text not null,
  body text check (length(body) <= 4096),
  template_id uuid references public.whatsapp_templates on delete set null,
  template_payload jsonb,
  attachment_id uuid references public.whatsapp_attachments on delete set null,
  category text,
  state text not null check (state in ('submitting','submitted','sent','delivered','read','failed','unknown','received')),
  idempotency_key text unique,
  provider_id text,
  wa_id text unique,
  failure_code text,
  failure_detail text check (length(failure_detail) <= 500),
  attempts int not null default 0,
  next_attempt_at timestamptz,
  campaign_id uuid references public.whatsapp_campaigns on delete set null,
  recipient_id uuid references public.whatsapp_campaign_recipients on delete set null,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz
);
create index whatsapp_messages_conversation on public.whatsapp_messages (conversation_id, created_at desc);
create index whatsapp_messages_company on public.whatsapp_messages (company_id, created_at desc);
create index whatsapp_messages_due on public.whatsapp_messages (next_attempt_at) where state = 'submitting';
create index whatsapp_messages_reconcile on public.whatsapp_messages (submitted_at) where state in ('submitted', 'sent', 'unknown');
create index whatsapp_messages_campaign on public.whatsapp_messages (campaign_id, state);

create table public.whatsapp_message_events (
  id bigint generated always as identity primary key,
  message_id uuid not null references public.whatsapp_messages on delete cascade,
  state text not null,
  source text not null,
  at timestamptz not null default now()
);
create index whatsapp_message_events_message on public.whatsapp_message_events (message_id, id);

-- a status that arrived before MCCI knew the WhatsApp id; applied once the id is known
create table public.whatsapp_pending_status (
  wa_id text not null,
  state text not null,
  code text,
  detail text,
  at timestamptz not null default now(),
  primary key (wa_id, state)
);

-- event ids and outcomes only: payloads are not kept
create table public.whatsapp_webhook_events (
  event_id text primary key check (length(event_id) <= 100),
  type text,
  received_at timestamptz not null default now(),
  outcome text not null default 'ok'
);
create index whatsapp_webhook_events_at on public.whatsapp_webhook_events (received_at desc);

create table public.whatsapp_health (
  id boolean primary key default true check (id),
  status text not null default 'not_configured',
  steps jsonb not null default '[]'::jsonb,
  checked_at timestamptz,
  last_ok_at timestamptz,
  last_error text check (length(last_error) <= 300),
  last_auth_failure_at timestamptz
);
insert into public.whatsapp_health (id) values (true);

do $$
declare t text;
begin
  foreach t in array array['whatsapp_templates','whatsapp_attachments','whatsapp_conversations','whatsapp_notes','whatsapp_campaigns',
                           'whatsapp_campaign_recipients','whatsapp_messages','whatsapp_message_events','whatsapp_pending_status',
                           'whatsapp_webhook_events','whatsapp_health'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
  foreach t in array array['whatsapp_templates','whatsapp_attachments','whatsapp_notes','whatsapp_campaigns'] loop
    execute format('create trigger audit_row after insert or update or delete on public.%I for each row execute function private.audit_row()', t);
  end loop;
  -- conversations are audited without the number (see 0570); messages have their own event history
  execute 'create trigger audit_row after insert or update or delete on public.whatsapp_conversations for each row execute function private.audit_row(''phone'', ''profile_name'')';
end $$;

-- reads: reports for out 1; anything with a number or message text for out 2
grant select on public.whatsapp_templates, public.whatsapp_campaigns, public.whatsapp_health to authenticated;
grant select on public.whatsapp_conversations, public.whatsapp_messages, public.whatsapp_notes, public.whatsapp_campaign_recipients, public.whatsapp_attachments to authenticated;
create policy wa_templates_select on public.whatsapp_templates for select to authenticated using ((select private.staff_level('out')) >= 1);
create policy wa_campaigns_select on public.whatsapp_campaigns for select to authenticated using ((select private.staff_level('out')) >= 1);
create policy wa_health_select on public.whatsapp_health for select to authenticated using ((select private.staff_level('out')) >= 1 or (select private.staff_level('plat')) >= 1);
create policy wa_conversations_select on public.whatsapp_conversations for select to authenticated using ((select private.staff_level('out')) >= 2);
create policy wa_messages_select on public.whatsapp_messages for select to authenticated using ((select private.staff_level('out')) >= 2);
create policy wa_notes_select on public.whatsapp_notes for select to authenticated using ((select private.staff_level('out')) >= 2);
create policy wa_recipients_select on public.whatsapp_campaign_recipients for select to authenticated using ((select private.staff_level('out')) >= 2);
create policy wa_attachments_select on public.whatsapp_attachments for select to authenticated using ((select private.staff_level('out')) >= 2);

-- private media; only the server reads it, staff upload through a checked route
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('whatsapp-media', 'whatsapp-media', false, 16777216,
   array['image/jpeg','image/png','application/pdf','video/mp4','audio/mpeg','audio/ogg'])
on conflict (id) do nothing;

-- ───────── the directory learns who has been contacted ─────────
create or replace view private.biz_rows with (security_barrier = true) as
  select m.id as member_id, c.id as company_id, c.name as business_name, m.member_no,
    m.class::text as member_class,
    private.public_member_status(m) as member_status,
    m.since as member_since, m.valid_to,
    extract(year from m.valid_to)::int as valid_year,
    case when m.valid_to < private.opp_today() then 'lapsed'
         when m.valid_to <= private.opp_today() + coalesce((select (s.value ->> 'renewalDueDays')::int from private.settings s where s.key = 'outreach'), 60) then 'due'
         else 'current' end as renewal,
    case when c.manufacturing then 'manufacturing' else 'non_manufacturing' end as business_category,
    nullif(btrim(c.nature_sector), '') as nature,
    nullif(btrim(c.sector), '') as sector,
    c.biz_type::text as registration,
    nullif(btrim(p.city), '') as city,
    nullif(btrim(p.district), '') as district,
    m.rep_name,
    oc.phone is not null as whatsapp_available,
    case when oc.phone is null then 'no_contact'
         else coalesce((select x.status from public.outreach_consents x
                         where x.company_id = c.id and x.phone = oc.phone order by x.id desc limit 1), 'not_recorded') end as consent,
    exists (select 1 from public.outreach_suppressions x where x.phone = oc.phone and x.active) as opted_out,
    coalesce((select array_agg(t.tag_id) from public.company_tags t where t.company_id = c.id), '{}'::uuid[]) as tag_ids,
    coalesce((select array_agg(g.name order by g.name) from public.company_tags t join public.outreach_tags g on g.id = t.tag_id
               where t.company_id = c.id), '{}'::text[]) as tag_names,
    (nullif(btrim(c.nature_sector), '') is null or nullif(btrim(p.city), '') is null or nullif(btrim(c.address), '') is null
      or (nullif(btrim(c.tel), '') is null and c.email is null) or oc.phone is null) as incomplete,
    exists (select 1 from public.whatsapp_messages w where w.company_id = c.id and w.direction = 'outbound'
             and w.state in ('submitted','sent','delivered','read')) as previously_contacted,
    coalesce((select array_agg(distinct r.campaign_id) from public.whatsapp_campaign_recipients r where r.company_id = c.id), '{}'::uuid[]) as campaign_ids
  from public.members m
  join public.companies c on c.id = m.company_id
  left join public.outreach_profiles p on p.company_id = c.id
  left join public.outreach_contacts oc on oc.company_id = c.id
  where not c.demo;
revoke all on private.biz_rows from public, anon, authenticated;

do $$
declare v text := pg_get_functiondef('private.biz_rule(jsonb)'::regprocedure);
begin
  v := replace(v, $a$when f in ('whatsapp_available','opted_out','incomplete') then 'bool'$a$, $a$when f in ('whatsapp_available','opted_out','incomplete','previously_contacted') then 'bool'$a$);
  v := replace(v, $a$when f = 'tags' then 'tags'$a$, $a$when f in ('tags','campaigns') then 'tags'$a$);
  v := replace(v, $a$case when f = 'tags' then 'tag_ids' else f end$a$, $a$case f when 'tags' then 'tag_ids' when 'campaigns' then 'campaign_ids' else f end$a$);
  execute v;
end $$;

-- the profile also returns the contact's language
do $$
declare v text := pg_get_functiondef('api.biz_profile(uuid)'::regprocedure);
begin
  v := replace(v, $a$jsonb_build_object('name', o.name, 'phone', o.phone)$a$, $a$jsonb_build_object('name', o.name, 'phone', o.phone, 'language', o.language)$a$);
  execute v;
end $$;

create or replace function api.wa_campaign_options() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if private.staff_level('biz') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by c.created_at desc)
                     from (select * from public.whatsapp_campaigns where status <> 'draft' order by created_at desc limit 100) c), '[]'::jsonb);
end $$;

-- ───────── the sending rules ─────────
-- The current consent of a number: the latest row. Categories are stated in full on every row.
create function private.wa_consent(p_company uuid, p_phone text) returns public.outreach_consents
  language sql stable set search_path = ''
  as $$ select * from public.outreach_consents x where x.company_id = p_company and x.phone = p_phone order by x.id desc limit 1 $$;

create function private.wa_window_open(p_phone text) returns boolean
  language sql stable set search_path = ''
  as $$
    select coalesce((select c.last_inbound_at > now() - make_interval(hours => coalesce(private.wa_setting('windowHours')::int, 24))
                       from public.whatsapp_conversations c where c.phone = p_phone), false)
  $$;

-- why this message must not go; null = it may. Runs when staff prepare it and again immediately before dispatch.
create function private.wa_block(p_company uuid, p_phone text, p_category text, p_kind text, p_template uuid) returns text
  language plpgsql stable set search_path = ''
  as $$
declare
  v_consent public.outreach_consents;
  v_status text;
begin
  if p_phone is null then return 'no_number'; end if;
  if p_phone !~ '^\+[1-9][0-9]{7,14}$' then return 'invalid_number'; end if;
  if exists (select 1 from public.companies c where c.id = p_company and c.demo) then return 'inactive'; end if;
  if exists (select 1 from public.outreach_suppressions s where s.phone = p_phone and s.active) then return 'suppressed'; end if;
  v_consent := private.wa_consent(p_company, p_phone);
  if v_consent.id is null or v_consent.status <> 'granted' then return 'no_consent'; end if;
  if p_category is null or not (p_category = any(v_consent.categories)) then return 'category'; end if;
  if p_kind = 'template' then
    select t.status into v_status from public.whatsapp_templates t where t.id = p_template;
    if v_status is distinct from 'APPROVED' then return 'template'; end if;
  elsif not private.wa_window_open(p_phone) then
    return 'window_closed';
  end if;
  return null;
end $$;

-- the only values a message may use; a value that is missing stays missing and blocks that recipient
create function private.wa_values(p_company uuid) returns jsonb
  language sql stable security definer set search_path = ''
  as $$
    select jsonb_build_object(
      'business_name', r.business_name, 'membership_number', r.member_no,
      'contact_person', coalesce(nullif(btrim(o.name), ''), r.rep_name),
      'membership_category', r.member_class, 'business_sector', coalesce(r.sector, r.nature),
      'city', r.city, 'district', r.district, 'renewal_date', to_char(r.valid_to, 'DD Mon YYYY'),
      'language', coalesce(o.language, 'en'))
    from private.biz_rows r left join public.outreach_contacts o on o.company_id = r.company_id
    where r.company_id = p_company order by r.valid_to desc limit 1
  $$;

-- plain replacement of known names only; any other {{...}} stays as typed and is never evaluated
create function private.wa_render(p_text text, p_values jsonb) returns text
  language plpgsql immutable set search_path = ''
  as $$
declare
  v_out text := p_text;
  k text;
  v_keys constant text[] := array['business_name','membership_number','contact_person','membership_category','business_sector','city','district','renewal_date','language'];
begin
  foreach k in array v_keys loop
    v_out := replace(v_out, '{{' || k || '}}', coalesce(p_values ->> k, ''));
  end loop;
  return v_out;
end $$;

-- the provider's template payload for one recipient; null when a mapped value is missing
create function private.wa_template_payload(t public.whatsapp_templates, p_values jsonb, p_link text default null) returns jsonb
  language plpgsql stable set search_path = ''
  as $$
declare
  v_params jsonb := '[]'::jsonb;
  v_components jsonb := '[]'::jsonb;
  v_count int := coalesce((select count(distinct m[1]) from regexp_matches(coalesce(t.body, ''), '\{\{([0-9]+)\}\}', 'g') as m), 0);
  v_value text;
  i int;
begin
  for i in 1 .. v_count loop
    v_value := p_values ->> (t.var_map ->> i::text);
    if nullif(btrim(coalesce(v_value, '')), '') is null then return null; end if;
    v_params := v_params || jsonb_build_object('type', 'text', 'text', v_value);
  end loop;
  if v_count > 0 then v_components := v_components || jsonb_build_object('type', 'body', 'parameters', v_params); end if;
  return jsonb_build_object('name', t.name, 'language', jsonb_build_object('code', t.language), 'components', v_components);
end $$;

create function private.wa_conversation(p_phone text, p_company uuid) returns uuid
  language plpgsql volatile set search_path = ''
  as $$
declare v_id uuid;
begin
  insert into public.whatsapp_conversations (phone, company_id) values (p_phone, p_company)
  on conflict (phone) do update set company_id = coalesce(public.whatsapp_conversations.company_id, excluded.company_id)
  returning id into v_id;
  return v_id;
end $$;

-- ───────── state: only ever forward ─────────
create function private.wa_rank(p_state text) returns int
  language sql immutable set search_path = ''
  as $$ select case p_state when 'submitting' then 0 when 'unknown' then 1 when 'submitted' then 2 when 'sent' then 3 when 'delivered' then 4 when 'read' then 5 else 0 end $$;

create function private.wa_campaign_settle(p_campaign uuid) returns void
  language plpgsql volatile set search_path = ''
  as $$
declare
  c public.whatsapp_campaigns;
  v_open bigint;
  v_good bigint;
  v_bad bigint;
begin
  if p_campaign is null then return; end if;
  select * into c from public.whatsapp_campaigns x where x.id = p_campaign for update;
  if c.status not in ('queued', 'sending') then return; end if;
  select count(*) filter (where r.status in ('pending', 'queued')),
         count(*) filter (where r.status in ('submitted', 'sent', 'delivered', 'read')),
         count(*) filter (where r.status = 'failed')   -- a skipped recipient was never meant to receive it: not a partial result
    into v_open, v_good, v_bad
    from public.whatsapp_campaign_recipients r where r.campaign_id = p_campaign;
  if v_open > 0 then return; end if;
  perform private.set_reason('campaign finished');
  update public.whatsapp_campaigns set finished_at = now(),
    status = case when v_good = 0 then 'failed' when v_bad > 0 then 'partial' else 'completed' end
   where id = p_campaign;
end $$;

create function private.wa_set_state(p_id uuid, p_state text, p_source text, p_code text default null, p_detail text default null, p_at timestamptz default null) returns void
  language plpgsql volatile set search_path = ''
  as $$
declare
  m public.whatsapp_messages;
  v_at timestamptz := coalesce(p_at, now());
begin
  select * into m from public.whatsapp_messages x where x.id = p_id for update;
  if m.id is null or m.direction <> 'outbound' then return; end if;
  if p_state = 'failed' then
    if m.state in ('delivered', 'read', 'failed') then return; end if;   -- a late failure never undoes a delivery
  elsif m.state = 'failed' then
    if p_state not in ('delivered', 'read') then return; end if;
  elsif private.wa_rank(p_state) <= private.wa_rank(m.state) then
    return;                                                              -- a late "delivered" never overwrites "read"
  end if;
  update public.whatsapp_messages set state = p_state, failure_code = case when p_state = 'failed' then p_code else null end,
    failure_detail = case when p_state in ('failed', 'unknown') then left(p_detail, 500) else null end,
    next_attempt_at = null,
    submitted_at = case when p_state in ('submitted', 'sent', 'delivered', 'read') then coalesce(submitted_at, v_at) else submitted_at end,
    sent_at = case when p_state in ('sent', 'delivered', 'read') then coalesce(sent_at, v_at) else sent_at end,
    delivered_at = case when p_state in ('delivered', 'read') then coalesce(delivered_at, v_at) else delivered_at end,
    read_at = case when p_state = 'read' then coalesce(read_at, v_at) else read_at end
   where id = p_id;
  insert into public.whatsapp_message_events (message_id, state, source, at) values (p_id, p_state, p_source, v_at);
  if m.recipient_id is not null then
    update public.whatsapp_campaign_recipients set
      status = case p_state when 'unknown' then 'failed' else p_state end,
      reason = case when p_state in ('failed', 'unknown') then coalesce(p_code, p_state) else null end, updated_at = now()
     where id = m.recipient_id;
    perform private.wa_campaign_settle(m.campaign_id);
  end if;
end $$;

-- ───────── staff: one message now ─────────
create function api.wa_send_prepare(p_company uuid, p_kind text, p_body text, p_template uuid, p_attachment uuid, p_category text) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_phone text;
  v_block text;
  v_values jsonb;
  v_payload jsonb;
  v_template public.whatsapp_templates;
  v_conv uuid;
  v_id uuid;
  v_kind text := p_kind;
  v_body text;
  v_att public.whatsapp_attachments;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if coalesce(private.wa_setting('sendingEnabled')::boolean, false) is not true then
    raise exception 'sending off' using errcode = 'P0001', hint = 'disabled';
  end if;
  if p_kind not in ('text', 'template', 'media') then raise exception 'kind' using errcode = 'P0001', hint = 'fields'; end if;
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  v_block := private.wa_block(p_company, v_phone, p_category, case when p_kind = 'template' then 'template' else 'session' end, p_template);
  if v_block is not null then raise exception 'blocked' using errcode = 'P0001', hint = 'block_' || v_block; end if;
  v_values := private.wa_values(p_company);
  if v_values is null then raise exception 'not a member' using errcode = 'P0001', hint = 'block_inactive'; end if;
  if p_kind = 'template' then
    select * into v_template from public.whatsapp_templates t where t.id = p_template;
    v_payload := private.wa_template_payload(v_template, v_values);
    if v_payload is null then raise exception 'missing value' using errcode = 'P0001', hint = 'block_missing_value'; end if;
    v_body := v_template.body;
  else
    v_body := private.wa_render(coalesce(p_body, ''), v_values);
    if p_kind = 'media' then
      select * into v_att from public.whatsapp_attachments a where a.id = p_attachment;
      if v_att.id is null then raise exception 'attachment' using errcode = 'P0001', hint = 'fields'; end if;
      v_kind := v_att.kind;
    elsif length(btrim(v_body)) not between 1 and 4096 then
      raise exception 'body' using errcode = 'P0001', hint = 'fields';
    end if;
  end if;
  v_conv := private.wa_conversation(v_phone, p_company);
  v_id := gen_random_uuid();
  insert into public.whatsapp_messages (id, conversation_id, company_id, direction, phone, kind, body, template_id, template_payload, attachment_id,
                                        category, state, idempotency_key, attempts, next_attempt_at, created_by)
  values (v_id, v_conv, p_company, 'outbound', v_phone, v_kind, left(v_body, 4096), p_template, v_payload, p_attachment,
          p_category, 'submitting', 'mcci-m-' || v_id, 1, now() + interval '2 minutes', auth.uid());
  update public.whatsapp_conversations set last_outbound_at = now() where id = v_conv;
  return v_id;
end $$;

-- ───────── staff: audience, campaigns ─────────
-- who would receive this, and why not for the rest. Reads only.
create function api.wa_audience_preview(p_def jsonb, p_q text, p_ids uuid[], p_excluded uuid[], p_category text, p_kind text, p_template uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  v_where text;
  v_out jsonb;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  v_where := private.biz_where(p_def, p_q, p_ids, p_excluded);
  execute format($q$
    with a as (
      select r.company_id, r.member_id, r.business_name, r.member_no, o.phone,
             private.wa_block(r.company_id, o.phone, %L, %L, %L::uuid) as block
        from private.biz_rows r left join public.outreach_contacts o on o.company_id = r.company_id where %s),
    b as (select a.*, row_number() over (order by a.block nulls first, a.business_name) as n from a)
    select jsonb_build_object(
      'total', (select count(*) from b),
      'eligible', (select count(*) from b where block is null),
      'blocked', coalesce((select jsonb_object_agg(block, n) from (select block, count(*) n from b where block is not null group by block) x), '{}'::jsonb),
      'rows', coalesce((select jsonb_agg(jsonb_build_object('member_id', member_id, 'name', business_name, 'member_no', member_no, 'phone', phone, 'block', block, 'values', private.wa_values(company_id)) order by n) from b where n <= 50), '[]'::jsonb))
    $q$, p_category, case when p_kind = 'template' then 'template' else 'session' end, p_template, v_where) into v_out;
  return v_out;
end $$;

-- creates the draft and fixes its audience: later changes to the filter or the records do not move it
create function api.wa_campaign_create(p_name text, p_purpose text, p_mode text, p_category text, p_kind text, p_template uuid, p_body text,
                                       p_attachment uuid, p_segment uuid, p_def jsonb, p_q text, p_ids uuid[], p_excluded uuid[]) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_id uuid;
  v_total bigint;
  v_where text;
  v_session text := case when p_kind = 'template' then 'template' else 'session' end;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 2 and 120 or p_mode not in ('campaign', 'selective')
     or p_category not in ('announcements', 'membership', 'events', 'opportunities') or p_kind not in ('template', 'text')
     or (p_kind = 'template' and p_template is null) or (p_kind = 'text' and length(btrim(coalesce(p_body, ''))) not between 1 and 4096) then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  v_where := private.biz_where(p_def, p_q, p_ids, p_excluded);
  execute format('select count(*) from private.biz_rows r where %s', v_where) into v_total;
  if v_total = 0 then raise exception 'no one' using errcode = 'P0001', hint = 'empty'; end if;
  if v_total > coalesce(private.wa_setting('maxCampaign')::int, 1000) then raise exception 'too many' using errcode = 'P0001', hint = 'toomany'; end if;
  perform private.set_reason('WhatsApp campaign created');
  insert into public.whatsapp_campaigns (name, purpose, mode, category, message_kind, template_id, body, attachment_id, segment_id, filter)
  values (btrim(p_name), nullif(btrim(p_purpose), ''), p_mode, p_category, p_kind, p_template, nullif(btrim(p_body), ''), p_attachment, p_segment,
          jsonb_build_object('filter', coalesce(p_def, '{}'::jsonb), 'search', nullif(btrim(coalesce(p_q, '')), ''), 'selected', cardinality(p_ids), 'excluded', cardinality(p_excluded)))
  returning id into v_id;
  execute format($q$
    insert into public.whatsapp_campaign_recipients (campaign_id, company_id, member_no, business_name, phone, status, reason)
    select distinct on (r.company_id) %L::uuid, r.company_id, r.member_no, r.business_name, o.phone,
           case when private.wa_block(r.company_id, o.phone, %L, %L, %L::uuid) is null then 'pending' else 'skipped' end,
           private.wa_block(r.company_id, o.phone, %L, %L, %L::uuid)
      from private.biz_rows r left join public.outreach_contacts o on o.company_id = r.company_id
     where %s order by r.company_id, r.valid_to desc
    $q$, v_id, p_category, v_session, p_template, p_category, v_session, p_template, v_where);
  return v_id;
end $$;

-- small audiences go straight to approved; larger ones need someone else with Approve level
create function api.wa_campaign_submit(p_id uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  c public.whatsapp_campaigns;
  v_n bigint;
  v_next text;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into c from public.whatsapp_campaigns x where x.id = p_id for update;
  if c.id is null or c.status <> 'draft' then raise exception 'state' using errcode = 'P0001', hint = 'state'; end if;
  select count(*) into v_n from public.whatsapp_campaign_recipients r where r.campaign_id = p_id and r.status = 'pending';
  if v_n = 0 then raise exception 'no one eligible' using errcode = 'P0001', hint = 'empty'; end if;
  v_next := case when v_n > coalesce(private.wa_setting('approvalThreshold')::int, 25) then 'pending_approval' else 'approved' end;
  perform private.set_reason(case when v_next = 'approved' then 'campaign approved: within the size staff may send' else 'campaign sent for approval' end);
  update public.whatsapp_campaigns set status = v_next, approved_at = case when v_next = 'approved' then now() end,
    approved_by = case when v_next = 'approved' then auth.uid() end where id = p_id;
  return v_next;
end $$;

create function api.wa_campaign_decide(p_id uuid, p_approve boolean, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare c public.whatsapp_campaigns;
begin
  if private.staff_level('out') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into c from public.whatsapp_campaigns x where x.id = p_id for update;
  if c.id is null or c.status <> 'pending_approval' then raise exception 'state' using errcode = 'P0001', hint = 'state'; end if;
  if c.created_by = auth.uid() then raise exception 'own campaign' using errcode = 'P0001', hint = 'own'; end if;
  if not p_approve and length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason' using errcode = 'P0001', hint = 'reason'; end if;
  perform private.set_reason(case when p_approve then 'campaign approved' else 'campaign returned to draft: ' || btrim(p_reason) end);
  update public.whatsapp_campaigns set status = case when p_approve then 'approved' else 'draft' end,
    approved_by = case when p_approve then auth.uid() end, approved_at = case when p_approve then now() end,
    reject_reason = case when p_approve then null else btrim(p_reason) end where id = p_id;
end $$;

-- the explicit launch. Saving, opening or approving never sends anything. p_confirm must repeat the recipient count.
create function api.wa_campaign_start(p_id uuid, p_at timestamptz, p_confirm int) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  c public.whatsapp_campaigns;
  v_n bigint;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into c from public.whatsapp_campaigns x where x.id = p_id for update;
  if c.id is null or c.status <> 'approved' then raise exception 'state' using errcode = 'P0001', hint = 'state'; end if;
  select count(*) into v_n from public.whatsapp_campaign_recipients r where r.campaign_id = p_id and r.status = 'pending';
  if v_n > coalesce(private.wa_setting('approvalThreshold')::int, 25) and private.staff_level('out') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_confirm is distinct from v_n::int then raise exception 'confirm' using errcode = 'P0001', hint = 'confirm'; end if;
  if p_at is not null and p_at <= now() then raise exception 'time' using errcode = 'P0001', hint = 'time'; end if;
  perform private.set_reason(case when p_at is null then 'campaign started' else 'campaign scheduled' end);
  update public.whatsapp_campaigns set status = case when p_at is null then 'queued' else 'scheduled' end, scheduled_at = p_at where id = p_id;
end $$;

create function api.wa_campaign_control(p_id uuid, p_action text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare c public.whatsapp_campaigns;
begin
  if private.staff_level('out') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into c from public.whatsapp_campaigns x where x.id = p_id for update;
  if c.id is null then raise exception 'state' using errcode = 'P0001', hint = 'state'; end if;
  if p_action = 'pause' and c.status in ('queued', 'sending', 'scheduled') then
    perform private.set_reason('campaign paused');
    update public.whatsapp_campaigns set status = 'paused' where id = p_id;
  elsif p_action = 'resume' and c.status = 'paused' then
    perform private.set_reason('campaign resumed');
    update public.whatsapp_campaigns set status = 'queued', scheduled_at = null where id = p_id;
  elsif p_action = 'cancel' and c.status in ('draft','pending_approval','approved','scheduled','queued','sending','paused') then
    perform private.set_reason('campaign cancelled');
    -- only what has not gone: a message already accepted by the provider cannot be recalled
    update public.whatsapp_campaign_recipients set status = 'cancelled', reason = 'cancelled', updated_at = now()
     where campaign_id = p_id and status in ('pending', 'queued');
    update public.whatsapp_campaigns set status = 'cancelled', finished_at = now() where id = p_id;
  else
    raise exception 'state' using errcode = 'P0001', hint = 'state';
  end if;
end $$;

create function api.wa_campaign_stats(p_id uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare v_started timestamptz;
begin
  if private.staff_level('out') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  select coalesce(c.started_at, c.created_at) into v_started from public.whatsapp_campaigns c where c.id = p_id;
  return jsonb_build_object(
    'status', coalesce((select jsonb_object_agg(s, n) from (select r.status s, count(*) n from public.whatsapp_campaign_recipients r where r.campaign_id = p_id group by 1) x), '{}'::jsonb),
    'reasons', coalesce((select jsonb_object_agg(s, n) from (select r.reason s, count(*) n from public.whatsapp_campaign_recipients r where r.campaign_id = p_id and r.reason is not null group by 1) x), '{}'::jsonb),
    'replies', (select count(distinct r.id) from public.whatsapp_campaign_recipients r
                  join public.whatsapp_messages m on m.phone = r.phone and m.direction = 'inbound' and m.created_at >= v_started where r.campaign_id = p_id),
    'optOuts', (select count(*) from public.whatsapp_campaign_recipients r
                  join public.outreach_suppressions s on s.phone = r.phone and s.active and s.source = 'recipient' and s.created_at >= v_started where r.campaign_id = p_id));
end $$;

create function api.wa_dashboard() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'withNumber', (select count(*) from private.biz_rows r where r.whatsapp_available),
    'consented', (select count(*) from private.biz_rows r where r.consent = 'granted' and not r.opted_out),
    'suppressed', (select count(*) from public.outreach_suppressions s where s.active),
    'activeCampaigns', (select count(*) from public.whatsapp_campaigns c where c.status in ('scheduled','queued','sending','paused','pending_approval','approved')),
    'submitted', (select count(*) from public.whatsapp_messages m where m.direction = 'outbound' and m.state in ('submitted','sent','delivered','read')),
    'delivered', (select count(*) from public.whatsapp_messages m where m.direction = 'outbound' and m.state in ('delivered','read')),
    'read', (select count(*) from public.whatsapp_messages m where m.direction = 'outbound' and m.state = 'read'),
    'failed', (select count(*) from public.whatsapp_messages m where m.direction = 'outbound' and m.state = 'failed'),
    'unknown', (select count(*) from public.whatsapp_messages m where m.direction = 'outbound' and m.state = 'unknown'),
    'inbound', (select count(*) from public.whatsapp_messages m where m.direction = 'inbound'),
    'unmatched', (select count(*) from public.whatsapp_conversations c where c.company_id is null),
    'webhookLast', (select max(e.received_at) from public.whatsapp_webhook_events e),
    'webhookRejected', (select count(*) from public.whatsapp_webhook_events e where e.outcome <> 'ok'));
end $$;

-- ───────── staff: templates ─────────
-- from the provider: name, language, status and category only. Absent templates are marked, never deleted.
create function api.wa_templates_sync(p_rows jsonb) returns int
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r jsonb;
  v_n int := 0;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  perform private.set_reason('templates synchronised from the provider');
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.whatsapp_templates (name, language, category, status, provider_id, synced_at)
    values (r ->> 'name', r ->> 'language', r ->> 'category', coalesce(r ->> 'status', 'UNKNOWN'), r ->> 'id', now())
    on conflict (name, language) do update set category = excluded.category, status = excluded.status, provider_id = excluded.provider_id, synced_at = now(), updated_at = now();
    v_n := v_n + 1;
  end loop;
  update public.whatsapp_templates t set status = 'NOT_ON_PROVIDER', synced_at = now(), updated_at = now()
   where t.status <> 'NOT_ON_PROVIDER' and not exists (select 1 from jsonb_array_elements(p_rows) x where x ->> 'name' = t.name and x ->> 'language' = t.language);
  return v_n;
end $$;

-- staff record the approved wording and which value fills each placeholder. This never changes the approval status.
create function api.wa_template_save(p_id uuid, p_header_type text, p_header text, p_body text, p_footer text, p_var_map jsonb) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  k text;
  v_allowed constant text[] := array['business_name','membership_number','contact_person','membership_category','business_sector','city','district','renewal_date','language'];
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_header_type not in ('none', 'image', 'document', 'video', 'text') or length(coalesce(p_body, '')) > 2000 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  for k in select jsonb_object_keys(coalesce(p_var_map, '{}'::jsonb)) loop
    if k !~ '^[0-9]{1,2}$' or not ((p_var_map ->> k) = any(v_allowed)) then raise exception 'variable' using errcode = 'P0001', hint = 'fields'; end if;
  end loop;
  perform private.set_reason('template wording recorded');
  update public.whatsapp_templates set header_type = p_header_type, header = nullif(btrim(p_header), ''), body = nullif(btrim(p_body), ''),
    footer = nullif(btrim(p_footer), ''), var_map = coalesce(p_var_map, '{}'::jsonb), updated_by = auth.uid(), updated_at = now() where id = p_id;
  if not found then raise exception 'not found' using errcode = 'P0001', hint = 'fields'; end if;
end $$;

-- ───────── staff: inbox ─────────
create function api.wa_conversation_update(p_id uuid, p_status text, p_assigned uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_status not in ('open', 'pending', 'resolved') or (p_assigned is not null and not exists (select 1 from public.staff s where s.user_id = p_assigned and s.active)) then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.set_reason('conversation updated');
  update public.whatsapp_conversations set status = p_status, assigned_to = p_assigned where id = p_id;
end $$;

create function api.wa_note_add(p_id uuid, p_body text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if length(btrim(coalesce(p_body, ''))) not between 1 and 2000 then raise exception 'check the fields' using errcode = 'P0001', hint = 'fields'; end if;
  perform private.set_reason('internal note added');
  insert into public.whatsapp_notes (conversation_id, body) values (p_id, btrim(p_body));
end $$;

-- an unmatched number is linked only by a person with Approve level, never automatically
create function api.wa_conversation_link(p_id uuid, p_company uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.companies c where c.id = p_company and not c.demo) then raise exception 'not found' using errcode = 'P0001', hint = 'fields'; end if;
  perform private.set_reason('conversation linked to a business by staff');
  update public.whatsapp_conversations set company_id = p_company where id = p_id;
  update public.whatsapp_messages m set company_id = p_company where m.conversation_id = p_id and m.company_id is null;
end $$;

-- ───────── consent with categories ─────────
create function private.wa_consent_write(p_company uuid, p_phone text, p_status text, p_method text, p_evidence text, p_categories text[]) returns void
  language plpgsql volatile set search_path = ''
  as $$
begin
  if p_categories is null or cardinality(p_categories) = 0
     or not (p_categories <@ array['announcements','membership','events','opportunities']) then
    raise exception 'categories' using errcode = 'P0001', hint = 'fields';
  end if;
  insert into public.outreach_consents (company_id, phone, status, method, evidence, categories, wording_version)
  values (p_company, p_phone, p_status, p_method, nullif(btrim(p_evidence), ''), p_categories, private.wa_setting('consentVersion'));
end $$;

create function api.wa_consent_record(p_company uuid, p_status text, p_method text, p_evidence text, p_categories text[]) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  if v_phone is null then raise exception 'no contact' using errcode = 'P0001', hint = 'nocontact'; end if;
  if p_status not in ('granted', 'withdrawn') or p_method not in ('written', 'event_form', 'email') then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  if p_status = 'granted' and length(btrim(coalesce(p_evidence, ''))) not between 3 and 500 then
    raise exception 'evidence needed' using errcode = 'P0001', hint = 'evidence';
  end if;
  if p_status = 'granted' and exists (select 1 from public.outreach_suppressions s where s.phone = v_phone and s.active) then
    raise exception 'opted out' using errcode = 'P0001', hint = 'suppressed';
  end if;
  perform private.set_reason(case p_status when 'granted' then 'WhatsApp consent recorded' else 'WhatsApp consent withdrawn' end);
  perform private.wa_consent_write(p_company, v_phone, p_status, p_method, p_evidence, p_categories);
  if p_status = 'withdrawn' then
    insert into public.outreach_suppressions (phone, reason, source) values (v_phone, 'Consent withdrawn', 'staff')
    on conflict (phone) do update set active = true, reason = excluded.reason, source = excluded.source,
      created_by = auth.uid(), created_at = now(), lifted_by = null, lifted_at = null, lifted_reason = null;
  end if;
end $$;

-- member opt-in through the portal: the company's own owner or manager, only once MCCI has opened it
create function api.wa_member_consent(p_company uuid, p_name text, p_phone text, p_grant boolean, p_categories text[]) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text := regexp_replace(coalesce(p_phone, ''), '[\s()-]', '', 'g');
begin
  if auth.uid() is null or private.company_level(p_company, 'profile') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if coalesce(private.wa_setting('consentOpen')::boolean, false) is not true then raise exception 'closed' using errcode = 'P0001', hint = 'closed'; end if;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'phone' using errcode = 'P0001', hint = 'phone'; end if;
  perform private.set_reason(case when p_grant then 'WhatsApp consent given by the member' else 'WhatsApp consent withdrawn by the member' end);
  insert into public.outreach_contacts (company_id, name, phone, updated_by) values (p_company, nullif(btrim(p_name), ''), v_phone, auth.uid())
  on conflict (company_id) do update set name = excluded.name, phone = excluded.phone, updated_by = auth.uid(), updated_at = now();
  if p_grant then
    -- the member choosing again ends an opt-out they made themselves; a block set by staff stays
    update public.outreach_suppressions set active = false, lifted_by = auth.uid(), lifted_at = now(), lifted_reason = 'Consent given again by the member'
     where phone = v_phone and active and source = 'recipient';
    if exists (select 1 from public.outreach_suppressions s where s.phone = v_phone and s.active) then
      raise exception 'blocked' using errcode = 'P0001', hint = 'suppressed';
    end if;
    perform private.wa_consent_write(p_company, v_phone, 'granted', 'member_portal', null, p_categories);
  else
    perform private.wa_consent_write(p_company, v_phone, 'withdrawn', 'member_portal', null, array['announcements','membership','events','opportunities']);
    insert into public.outreach_suppressions (phone, reason, source) values (v_phone, 'Consent withdrawn by the member', 'recipient')
    on conflict (phone) do update set active = true, reason = excluded.reason, source = excluded.source, created_at = now(), lifted_by = null, lifted_at = null, lifted_reason = null;
  end if;
end $$;

create function api.wa_my_consent(p_company uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  o public.outreach_contacts;
  c public.outreach_consents;
begin
  if auth.uid() is null or private.company_level(p_company, 'profile') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into o from public.outreach_contacts x where x.company_id = p_company;
  c := private.wa_consent(p_company, o.phone);
  return jsonb_build_object('open', coalesce(private.wa_setting('consentOpen')::boolean, false), 'version', private.wa_setting('consentVersion'),
    'name', o.name, 'phone', o.phone, 'status', c.status, 'categories', c.categories, 'at', c.recorded_at);
end $$;

create function api.wa_consent_overview() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'numbers', coalesce((select jsonb_agg(x) from (
        select r.member_id, r.business_name, r.member_no, o.phone, r.consent, r.opted_out, k.categories, k.recorded_at as at, k.wording_version as version
          from private.biz_rows r join public.outreach_contacts o on o.company_id = r.company_id
          left join lateral (select * from public.outreach_consents c where c.company_id = r.company_id and c.phone = o.phone order by c.id desc limit 1) k on true
         order by r.business_name limit 500) x), '[]'::jsonb),
    'suppressions', coalesce((select jsonb_agg(x) from (
        select s.phone, s.reason, s.source, s.created_at from public.outreach_suppressions s where s.active order by s.created_at desc limit 500) x), '[]'::jsonb));
end $$;

-- the language a recipient gets when an approved version exists; empty = the campaign's language
create function api.wa_contact_language(p_company uuid, p_language text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if nullif(p_language, '') is not null and p_language not in ('en', 'ur') then raise exception 'language' using errcode = 'P0001', hint = 'fields'; end if;
  perform private.set_reason('contact language set');
  update public.outreach_contacts set language = nullif(p_language, ''), updated_by = auth.uid(), updated_at = now() where company_id = p_company;
end $$;

-- ───────── settings (Integration Settings) ─────────
create function api.wa_settings_save(p_values jsonb) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v jsonb;
begin
  if private.staff_level('plat') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  if (p_values ->> 'ratePerMinute')::int not between 1 and 250 or (p_values ->> 'maxCampaign')::int not between 1 and 100000
     or (p_values ->> 'approvalThreshold')::int not between 0 and 100000 or jsonb_typeof(p_values -> 'sendingEnabled') <> 'boolean'
     or jsonb_typeof(p_values -> 'consentOpen') <> 'boolean' or length(coalesce(p_values ->> 'consentVersion', '')) not between 1 and 40 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  select s.value || jsonb_build_object('ratePerMinute', (p_values ->> 'ratePerMinute')::int, 'maxCampaign', (p_values ->> 'maxCampaign')::int,
           'approvalThreshold', (p_values ->> 'approvalThreshold')::int, 'sendingEnabled', p_values -> 'sendingEnabled',
           'consentOpen', p_values -> 'consentOpen', 'consentVersion', p_values ->> 'consentVersion')
    into v from private.settings s where s.key = 'whatsapp';
  perform private.set_reason('WhatsApp settings changed');
  update private.settings set value = v, updated_at = now() where key = 'whatsapp';   -- who: in the audit log
end $$;

create function api.wa_settings_read() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if private.staff_level('plat') < 1 and private.staff_level('out') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  return (select s.value from private.settings s where s.key = 'whatsapp');
end $$;

-- ───────── the server only (dispatcher, webhook) ─────────
-- Claims what is due. A claim pushes next_attempt_at forward first, so a worker that dies leaves nothing half-owned:
-- the message comes back with the SAME key after two minutes. Rules are checked again here, for every message.
create function api.wa_claim(p_limit int) returns jsonb
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_room int;
  v_out jsonb := '[]'::jsonb;
  r public.whatsapp_campaign_recipients;
  c public.whatsapp_campaigns;
  m public.whatsapp_messages;
  t public.whatsapp_templates;
  v_block text;
  v_values jsonb;
  v_payload jsonb;
  v_conv uuid;
  v_id uuid;
  v_body text;
  v_lang text;
begin
  if coalesce(private.wa_setting('sendingEnabled')::boolean, false) is not true then return v_out; end if;
  v_room := least(greatest(coalesce(p_limit, 20), 1),
                  coalesce(private.wa_setting('ratePerMinute')::int, 60)
                  - (select count(*)::int from public.whatsapp_message_events e where e.state = 'submitted' and e.at > now() - interval '1 minute')
                  - (select count(*)::int from public.whatsapp_messages x where x.state = 'submitting' and x.next_attempt_at > now()));
  if v_room <= 0 then return v_out; end if;

  -- scheduled campaigns whose time has come
  perform private.set_reason('campaign reached its scheduled time');
  update public.whatsapp_campaigns set status = 'queued' where status = 'scheduled' and scheduled_at <= now();

  -- 1. messages due again (individual sends, retries, recovery after a restart)
  for m in
    select * from public.whatsapp_messages x
     where x.state = 'submitting' and x.next_attempt_at <= now()
       and (x.campaign_id is null or exists (select 1 from public.whatsapp_campaigns k where k.id = x.campaign_id and k.status in ('queued', 'sending')))
     order by x.next_attempt_at limit v_room for update skip locked
  loop
    v_block := private.wa_block(m.company_id, m.phone, m.category,
                 case when m.template_id is not null then 'template' else 'session' end, m.template_id);
    if v_block is not null then
      perform private.wa_set_state(m.id, 'failed', 'policy', v_block, 'Blocked by the sending rules before dispatch');
      continue;
    end if;
    update public.whatsapp_messages set attempts = attempts + 1, next_attempt_at = now() + interval '2 minutes' where id = m.id;
    v_out := v_out || jsonb_build_object('id', m.id, 'phone', m.phone, 'kind', m.kind, 'body', m.body, 'template', m.template_payload,
                                         'attachment_id', m.attachment_id, 'key', m.idempotency_key);
    v_room := v_room - 1;
  end loop;

  -- 2. the next recipients of running campaigns
  for r in
    select x.* from public.whatsapp_campaign_recipients x
      join public.whatsapp_campaigns k on k.id = x.campaign_id
     where x.status = 'pending' and k.status in ('queued', 'sending')
     order by k.created_at, x.id limit greatest(v_room, 0) for update of x skip locked
  loop
    select * into c from public.whatsapp_campaigns k where k.id = r.campaign_id;
    if c.status = 'queued' then
      update public.whatsapp_campaigns set status = 'sending', started_at = coalesce(started_at, now()) where id = c.id;
    end if;
    t := null;
    if c.message_kind = 'template' then
      select * into t from public.whatsapp_templates x where x.id = c.template_id;
      -- the recipient's language when an approved version exists; otherwise the campaign's. Never machine-translated.
      select o.language into v_lang from public.outreach_contacts o where o.company_id = r.company_id;
      if v_lang is not null and v_lang <> t.language then
        select coalesce((select x from public.whatsapp_templates x where x.name = t.name and x.language = v_lang and x.status = 'APPROVED'), t) into t;
      end if;
    end if;
    v_block := private.wa_block(r.company_id, r.phone, c.category, case when c.message_kind = 'template' then 'template' else 'session' end, t.id);
    -- a number changed since the snapshot is not the number that consented
    if v_block is null and not exists (select 1 from public.outreach_contacts o where o.company_id = r.company_id and o.phone = r.phone) then
      v_block := 'number_changed';
    end if;
    v_values := private.wa_values(r.company_id);
    if v_block is null and v_values is null then v_block := 'inactive'; end if;
    v_payload := null;
    if v_block is null and c.message_kind = 'template' then
      v_payload := private.wa_template_payload(t, v_values);
      if v_payload is null then v_block := 'missing_value'; end if;
    end if;
    if v_block is not null then
      update public.whatsapp_campaign_recipients set status = 'skipped', reason = v_block, updated_at = now() where id = r.id;
      perform private.wa_campaign_settle(r.campaign_id);
      continue;
    end if;
    v_body := case when c.message_kind = 'template' then t.body else private.wa_render(c.body, v_values) end;
    v_conv := private.wa_conversation(r.phone, r.company_id);
    v_id := gen_random_uuid();
    insert into public.whatsapp_messages (id, conversation_id, company_id, direction, phone, kind, body, template_id, template_payload, attachment_id, category, state,
                                          idempotency_key, attempts, next_attempt_at, campaign_id, recipient_id, created_by)
    values (v_id, v_conv, r.company_id, 'outbound', r.phone, c.message_kind, left(v_body, 4096), t.id, v_payload, c.attachment_id, c.category, 'submitting',
            'mcci-c-' || r.id, 1, now() + interval '2 minutes', c.id, r.id, c.created_by);
    update public.whatsapp_campaign_recipients set status = 'queued', message_id = v_id, updated_at = now() where id = r.id;
    update public.whatsapp_conversations set last_outbound_at = now() where id = v_conv;
    v_out := v_out || jsonb_build_object('id', v_id, 'phone', r.phone, 'kind', c.message_kind, 'body', v_body, 'template', v_payload,
                                         'attachment_id', c.attachment_id, 'key', 'mcci-c-' || r.id);
  end loop;
  return v_out;
end $$;

-- p_outcome: accepted | retry (provider said try later) | ambiguous (no answer: it may have gone) | failed (permanent).
-- Retries keep the key. After the limit an ambiguous message becomes 'unknown' for a person to check: never resent blindly.
create function api.wa_result(p_id uuid, p_outcome text, p_provider_id text, p_wa_id text, p_code text, p_detail text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.whatsapp_messages;
  s public.whatsapp_pending_status;
begin
  select * into m from public.whatsapp_messages x where x.id = p_id for update;
  if m.id is null or m.state <> 'submitting' then return; end if;
  if p_outcome = 'accepted' then
    update public.whatsapp_messages set provider_id = p_provider_id, wa_id = coalesce(p_wa_id, wa_id) where id = p_id;
    perform private.wa_set_state(p_id, 'submitted', 'provider');
    if p_wa_id is not null then
      for s in select * from public.whatsapp_pending_status x where x.wa_id = p_wa_id order by x.at loop
        perform private.wa_set_state(p_id, s.state, 'webhook', s.code, s.detail, s.at);
      end loop;
      delete from public.whatsapp_pending_status x where x.wa_id = p_wa_id;
    end if;
  elsif p_outcome = 'failed' then
    perform private.wa_set_state(p_id, 'failed', 'provider', p_code, p_detail);
  elsif p_outcome in ('retry', 'ambiguous') then
    if m.attempts >= (case when p_outcome = 'retry' then 6 else 3 end) then
      perform private.wa_set_state(p_id, case when p_outcome = 'retry' then 'failed' else 'unknown' end, 'provider', coalesce(p_code, 'provider_error'), p_detail);
    else
      update public.whatsapp_messages set failure_detail = left(p_detail, 500),
        next_attempt_at = now() + make_interval(mins => case when p_outcome = 'retry' then (2 ^ m.attempts)::int else 2 end) where id = p_id;
    end if;
  else
    raise exception 'outcome' using errcode = 'P0001';
  end if;
end $$;

-- what to ask the provider about: no terminal answer yet
create function api.wa_reconcile_list(p_limit int) returns jsonb
  language sql stable security definer set search_path = ''
  as $$
    select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'provider_id', x.provider_id, 'submitted_at', x.submitted_at)), '[]'::jsonb) from (
      select m.id, m.provider_id, m.submitted_at from public.whatsapp_messages m
       where m.state in ('submitted', 'sent', 'unknown') and m.provider_id is not null and m.submitted_at < now() - interval '1 minute'
         and m.submitted_at > now() - interval '7 days'
       order by m.submitted_at limit least(greatest(coalesce(p_limit, 20), 1), 100)) x
  $$;

-- the provider's answer about one message
create function api.wa_reconcile(p_id uuid, p_state text, p_wa_id text, p_code text, p_detail text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.whatsapp_messages;
  s public.whatsapp_pending_status;
begin
  select * into m from public.whatsapp_messages x where x.id = p_id for update;
  if m.id is null then return; end if;
  if p_wa_id is not null and m.wa_id is null then
    update public.whatsapp_messages set wa_id = p_wa_id where id = p_id;
    for s in select * from public.whatsapp_pending_status x where x.wa_id = p_wa_id order by x.at loop
      perform private.wa_set_state(p_id, s.state, 'webhook', s.code, s.detail, s.at);
    end loop;
    delete from public.whatsapp_pending_status x where x.wa_id = p_wa_id;
  end if;
  if p_state in ('sent', 'delivered', 'read', 'failed') then
    perform private.wa_set_state(p_id, p_state, 'reconcile', p_code, p_detail);
  elsif p_state in ('queued', 'processing')
        and m.submitted_at < now() - make_interval(mins => coalesce(private.wa_setting('staleMinutes')::int, 60)) then
    perform private.wa_set_state(p_id, 'unknown', 'reconcile', 'stale_processing', 'The provider has not finished this message');
  end if;
end $$;

-- A signed event from the provider. The route has verified the signature and that the event is for MCCI's own number.
create function api.wa_webhook(p_event_id text, p_type text, p_data jsonb) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  e jsonb;
  v_state text;
  v_msg uuid;
  v_phone text;
  v_companies uuid[];
  v_company uuid;
  v_conv uuid;
  v_text text;
  v_type text;
  v_err jsonb;
  v_at timestamptz;
  v_id uuid;
begin
  begin
    insert into public.whatsapp_webhook_events (event_id, type) values (left(p_event_id, 100), left(p_type, 60));
  exception when unique_violation then
    return 'duplicate';
  end;

  for e in select * from jsonb_array_elements(coalesce(p_data -> 'statuses', '[]'::jsonb)) loop
    v_state := lower(e ->> 'status');
    continue when v_state not in ('sent', 'delivered', 'read', 'failed');
    v_err := e -> 'errors' -> 0;
    v_at := case when (e ->> 'timestamp') ~ '^[0-9]{9,11}$' then to_timestamp((e ->> 'timestamp')::bigint) else now() end;
    select m.id into v_msg from public.whatsapp_messages m where m.wa_id = e ->> 'id';
    if v_msg is null then
      insert into public.whatsapp_pending_status (wa_id, state, code, detail, at)
      values (left(e ->> 'id', 200), v_state, 'meta_status_' || (v_err ->> 'code'), left(v_err ->> 'title', 300), v_at) on conflict do nothing;
    else
      perform private.wa_set_state(v_msg, v_state, 'webhook', 'meta_status_' || (v_err ->> 'code'), left(v_err ->> 'title', 300), v_at);
    end if;
  end loop;

  for e in select * from jsonb_array_elements(coalesce(p_data -> 'messages', '[]'::jsonb)) loop
    v_phone := '+' || regexp_replace(coalesce(e ->> 'from', ''), '[^0-9]', '', 'g');
    continue when v_phone !~ '^\+[1-9][0-9]{7,14}$' or nullif(e ->> 'id', '') is null;
    continue when exists (select 1 from public.whatsapp_messages m where m.wa_id = e ->> 'id');
    v_type := left(coalesce(e ->> 'type', 'unknown'), 30);
    v_text := left(coalesce(e -> 'text' ->> 'body', e -> 'button' ->> 'text', e -> 'interactive' -> 'button_reply' ->> 'title',
                            e -> v_type ->> 'caption', ''), 4096);
    -- exactly one business with this number, or nobody: an ambiguous number is left for a person
    select array_agg(o.company_id) into v_companies from public.outreach_contacts o where o.phone = v_phone;
    v_company := case when cardinality(v_companies) = 1 then v_companies[1] end;
    v_at := case when (e ->> 'timestamp') ~ '^[0-9]{9,11}$' then to_timestamp((e ->> 'timestamp')::bigint) else now() end;
    v_conv := private.wa_conversation(v_phone, v_company);
    update public.whatsapp_conversations set last_inbound_at = greatest(coalesce(last_inbound_at, v_at), v_at),
      status = case when status = 'resolved' then 'open' else status end,
      profile_name = coalesce(left(p_data -> 'contacts' -> 0 -> 'profile' ->> 'name', 200), profile_name)
     where id = v_conv;
    v_id := gen_random_uuid();
    insert into public.whatsapp_messages (id, conversation_id, company_id, direction, phone, kind, body, state, wa_id, created_at)
    values (v_id, v_conv, (select c.company_id from public.whatsapp_conversations c where c.id = v_conv), 'inbound', v_phone, v_type, nullif(v_text, ''), 'received', e ->> 'id', v_at);

    if upper(btrim(v_text)) in ('STOP', 'UNSUBSCRIBE', 'OPT OUT', 'OPT-OUT', 'OPTOUT', 'بند کریں', 'رکیں') then
      perform private.set_reason('opt-out received from the recipient');
      insert into public.outreach_suppressions (phone, reason, source, created_by) values (v_phone, 'Recipient opted out: ' || upper(btrim(v_text)), 'recipient', null)
      on conflict (phone) do update set active = true, reason = excluded.reason, source = 'recipient', created_by = null, created_at = now(), lifted_by = null, lifted_at = null, lifted_reason = null;
      if v_company is not null then
        insert into public.outreach_consents (company_id, phone, status, method, evidence, recorded_by, wording_version)
        values (v_company, v_phone, 'withdrawn', 'recipient', 'WhatsApp reply', null, private.wa_setting('consentVersion'));
      end if;
    end if;
  end loop;
  return 'ok';
end $$;

create function api.wa_webhook_reject(p_reason text) returns void
  language sql volatile security definer set search_path = ''
  as $$ insert into public.whatsapp_webhook_events (event_id, type, outcome) values ('rejected-' || gen_random_uuid(), 'rejected', left(p_reason, 40)) $$;

create function api.wa_health_mark(p_status text, p_steps jsonb, p_error text) returns void
  language sql volatile security definer set search_path = ''
  as $$
    update public.whatsapp_health set status = p_status, steps = coalesce(p_steps, '[]'::jsonb), checked_at = now(),
      last_ok_at = case when p_status = 'connected' then now() else last_ok_at end,
      last_error = case when p_status = 'connected' then null else left(p_error, 300) end,
      last_auth_failure_at = case when p_status = 'auth_failed' then now() else last_auth_failure_at end
     where id
  $$;

do $$
declare f text;
begin
  foreach f in array array['api.wa_campaign_options()', 'api.wa_send_prepare(uuid,text,text,uuid,uuid,text)',
      'api.wa_audience_preview(jsonb,text,uuid[],uuid[],text,text,uuid)',
      'api.wa_campaign_create(text,text,text,text,text,uuid,text,uuid,uuid,jsonb,text,uuid[],uuid[])',
      'api.wa_campaign_submit(uuid)', 'api.wa_campaign_decide(uuid,boolean,text)', 'api.wa_campaign_start(uuid,timestamptz,integer)',
      'api.wa_campaign_control(uuid,text)', 'api.wa_campaign_stats(uuid)', 'api.wa_dashboard()', 'api.wa_templates_sync(jsonb)',
      'api.wa_template_save(uuid,text,text,text,text,jsonb)', 'api.wa_conversation_update(uuid,text,uuid)', 'api.wa_note_add(uuid,text)',
      'api.wa_conversation_link(uuid,uuid)', 'api.wa_consent_record(uuid,text,text,text,text[])', 'api.wa_member_consent(uuid,text,text,boolean,text[])',
      'api.wa_my_consent(uuid)', 'api.wa_consent_overview()', 'api.wa_contact_language(uuid,text)', 'api.wa_settings_save(jsonb)', 'api.wa_settings_read()'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  -- the dispatcher and webhook only: the secret-key server client, never a signed-in person
  foreach f in array array['api.wa_claim(integer)', 'api.wa_result(uuid,text,text,text,text,text)', 'api.wa_reconcile_list(integer)',
      'api.wa_reconcile(uuid,text,text,text,text)', 'api.wa_webhook(text,text,jsonb)', 'api.wa_webhook_reject(text)', 'api.wa_health_mark(text,jsonb,text)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
  foreach f in array array['private.wa_setting(text)', 'private.wa_consent(uuid,text)', 'private.wa_window_open(text)',
      'private.wa_block(uuid,text,text,text,uuid)', 'private.wa_values(uuid)', 'private.wa_render(text,jsonb)',
      'private.wa_template_payload(public.whatsapp_templates,jsonb,text)', 'private.wa_conversation(text,uuid)', 'private.wa_rank(text)',
      'private.wa_campaign_settle(uuid)', 'private.wa_set_state(uuid,text,text,text,text,timestamptz)',
      'private.wa_consent_write(uuid,text,text,text,text,text[])'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
end $$;
