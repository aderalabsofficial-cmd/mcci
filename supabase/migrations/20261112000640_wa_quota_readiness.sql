-- 0640 · WhatsApp quota, scheduling across windows, readiness and scaling (owner's directives of 3 Nov 2026, docs/30 §11).
--
-- Meta limits how many unique people a business portfolio may start conversations with (template messages) in a
-- rolling 24 hours; the limit is shared by every number in the portfolio. IQPigeon's API does not report the tier, the
-- limit or the quality ratings, so they are recorded here by an administrator with their source and date, and sending
-- stops safely when they are missing or too old. Nothing raises the limit by itself: a new tier is confirmed by a person.

create table public.whatsapp_quota (
  id boolean primary key default true check (id),
  portfolio_id text check (portfolio_id ~ '^[0-9]{6,20}$'),
  waba_id text check (waba_id ~ '^[0-9]{6,20}$'),
  tier text check (length(tier) <= 40),                        -- as Meta names it, e.g. UNTIERED, TIER_2K, TIER_10K
  unique_limit int check (unique_limit between 1 and 100000000), -- unique recipients per rolling 24 hours; null = unknown
  verification text not null default 'unknown' check (verification in ('unknown', 'not_verified', 'pending', 'verified')),
  phone_quality text not null default 'UNKNOWN' check (phone_quality in ('UNKNOWN', 'HIGH', 'MEDIUM', 'LOW')),
  template_quality text not null default 'UNKNOWN' check (template_quality in ('UNKNOWN', 'HIGH', 'MEDIUM', 'LOW')),
  source text not null default 'admin' check (source in ('meta_support', 'admin', 'provider')),
  note text check (length(note) <= 300),
  confirmed_by uuid references public.profiles on delete set null,
  confirmed_at timestamptz,
  stale_days int not null default 7 check (stale_days between 1 and 90),
  -- recipients reached from other numbers of the same portfolio or from outside this CRM, as last known
  external_recipients int not null default 0 check (external_recipients between 0 and 100000000),
  external_at timestamptz
);
alter table public.whatsapp_quota enable row level security;
revoke all on public.whatsapp_quota from public, anon, authenticated;
create trigger audit_row after insert or update or delete on public.whatsapp_quota for each row execute function private.audit_row();

-- TODO(MCCI): reconfirm in WhatsApp Manager (Insights, messaging limit) and after Business Verification
insert into public.whatsapp_quota (portfolio_id, waba_id, tier, unique_limit, verification, source, note, confirmed_at)
values ('1641814260669555', '937323199090897', 'UNTIERED', 250, 'not_verified', 'meta_support',
        'Meta Support, 3 Nov 2026: untiered, 250 unique recipients per rolling 24 hours; Business Verification not completed',
        '2026-11-03 12:00:00+05');

-- campaigns of 3,000 to 5,000 selected members (the account limit, not this, decides how fast they go)
update private.settings set value = value || '{"maxCampaign":5000}'::jsonb
 where key = 'whatsapp' and coalesce((value ->> 'maxCampaign')::int, 0) < 5000;

create index whatsapp_messages_phone_recent on public.whatsapp_messages (phone, created_at desc) where direction = 'outbound';

-- ───────── the quota ─────────
-- a person this business has started a conversation with (a template) in the last 24 hours: no new place needed
create function private.wa_recent(p_phone text) returns boolean
  language sql stable set search_path = ''
  as $$
    select exists (select 1 from public.whatsapp_messages m
                    where m.phone = p_phone and m.direction = 'outbound' and m.template_id is not null
                      and m.state <> 'failed' and m.created_at > now() - interval '24 hours')
  $$;

create function private.wa_used(p_hours int) returns int
  language sql stable set search_path = ''
  as $$
    select count(distinct m.phone)::int from public.whatsapp_messages m
     where m.direction = 'outbound' and m.template_id is not null and m.state <> 'failed'
       and m.created_at > now() - make_interval(hours => p_hours)
  $$;

-- why the quota cannot be used, or null
create function private.wa_quota_problem() returns text
  language sql stable set search_path = ''
  as $$
    select case when q.id is null or q.unique_limit is null or q.confirmed_at is null then 'unknown'
                when q.confirmed_at < now() - make_interval(days => q.stale_days) then 'stale'
                else null end
      from (select 1) one left join public.whatsapp_quota q on true
  $$;

-- new unique recipients that may still be reached now; 0 whenever the limit is unknown or out of date
create function private.wa_quota_room() returns int
  language sql stable set search_path = ''
  as $$
    select case when private.wa_quota_problem() is not null then 0
                else greatest(q.unique_limit - private.wa_used(24)
                              - case when q.external_at > now() - interval '24 hours' then q.external_recipients else 0 end, 0) end
      from (select 1) one left join public.whatsapp_quota q on true
  $$;

-- ───────── dispatch: a new template recipient waits for capacity; nothing is skipped for it ─────────
do $$
declare
  v text := pg_get_functiondef('api.wa_claim(int)'::regprocedure);
  pairs text[][] := array[
    array[E'  v_kind text;\nbegin', E'  v_kind text;\n  v_quota int := coalesce(private.wa_quota_room(), 0);\n  v_new boolean;\nbegin'],
    array['coalesce(private.wa_setting(''dailyLimit'')::int, 250)', 'coalesce(private.wa_setting(''dailyLimit'')::int, 2147483647)'],
    array[E'    t := null;\n', E'    t := null;\n    v_new := false;\n'],
    array['v_block := private.wa_block(r.company_id, r.phone, c.category, case when v_kind = ''template'' then ''template'' else ''session'' end, t.id);',
          E'v_block := private.wa_block(r.company_id, r.phone, c.category, case when v_kind = ''template'' then ''template'' else ''session'' end, t.id);\n'
          || E'    if v_block is null and v_kind = ''template'' then\n'
          || E'      v_new := not private.wa_recent(r.phone);\n'
          || E'      if v_new and v_quota <= 0 then continue; end if;   -- stays pending for the next window\n'
          || E'    end if;'],
    array['    update public.whatsapp_campaign_recipients set status = ''queued'', message_id = v_id, updated_at = now() where id = r.id;',
          E'    update public.whatsapp_campaign_recipients set status = ''queued'', message_id = v_id, updated_at = now() where id = r.id;\n'
          || E'    if v_kind = ''template'' and v_new then v_quota := v_quota - 1; end if;']];
  i int;
begin
  for i in 1 .. array_length(pairs, 1) loop
    if position(pairs[i][1] in v) = 0 then raise exception 'wa_claim patch % not found', i; end if;
    v := replace(v, pairs[i][1], pairs[i][2]);
  end loop;
  execute v;
  -- one message to one business obeys the same quota
  v := pg_get_functiondef('api.wa_send_prepare(uuid, text, text, uuid, uuid, text)'::regprocedure);
  if position(E'  v_conv := private.wa_conversation(v_phone, p_company);\n  v_id := gen_random_uuid();' in v) = 0 then raise exception 'wa_send_prepare patch not found'; end if;
  execute replace(v, E'  v_conv := private.wa_conversation(v_phone, p_company);\n  v_id := gen_random_uuid();',
    E'  if p_kind = ''template'' and not private.wa_recent(v_phone) and coalesce(private.wa_quota_room(), 0) <= 0 then\n'
    || E'    raise exception ''quota'' using errcode = ''P0001'', hint = ''block_quota'';\n  end if;\n'
    || E'  v_conv := private.wa_conversation(v_phone, p_company);\n  v_id := gen_random_uuid();');
end $$;

-- ───────── staff: readiness, scaling, schedule ─────────
create function api.wa_quota_status() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  q public.whatsapp_quota;
  v_used int := private.wa_used(24);
  v_week int := private.wa_used(24 * 7);
  v_external int;
begin
  if auth.uid() is null or (private.staff_level('out') < 1 and private.staff_level('plat') < 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into q from public.whatsapp_quota;
  v_external := case when q.external_at > now() - interval '24 hours' then q.external_recipients else 0 end;
  return jsonb_build_object(
    'portfolioId', q.portfolio_id, 'wabaId', q.waba_id, 'tier', q.tier, 'limit', q.unique_limit,
    'verification', q.verification, 'phoneQuality', q.phone_quality, 'templateQuality', q.template_quality,
    'source', q.source, 'note', q.note, 'confirmedAt', q.confirmed_at, 'staleDays', q.stale_days,
    'confirmedBy', (select p.full_name from public.profiles p where p.id = q.confirmed_by),
    'problem', private.wa_quota_problem(),
    'used24', v_used, 'external24', v_external, 'externalAt', q.external_at, 'room', private.wa_quota_room(),
    -- when the oldest counted recipient leaves the window, a place frees up
    'nextFreeAt', (select min(x.first) + interval '24 hours' from (
        select min(m.created_at) as first from public.whatsapp_messages m
         where m.direction = 'outbound' and m.template_id is not null and m.state <> 'failed' and m.created_at > now() - interval '24 hours'
         group by m.phone) x),
    'week', v_week,
    -- Meta's next step needs half the current limit reached in seven days, plus Medium or High quality; shown, never acted on
    'weekTarget', case when q.unique_limit is not null then ceil(q.unique_limit / 2.0)::int end,
    'eligible', (select count(*) from private.biz_rows r where r.consent = 'granted' and not r.opted_out),
    'templatesApproved', (select count(*) from public.whatsapp_templates t where t.status = 'APPROVED'),
    'mastersApproved', (select count(*) from public.whatsapp_templates t join public.whatsapp_masters m on m.name = t.name where t.status = 'APPROVED'),
    'statusEvents', (select count(*) from public.whatsapp_message_events e where e.source = 'webhook' and e.state in ('sent', 'delivered', 'read', 'failed')),
    'lastStatusAt', (select max(e.at) from public.whatsapp_message_events e where e.source = 'webhook' and e.state in ('sent', 'delivered', 'read', 'failed')),
    'waitingRecipients', (select count(*) from public.whatsapp_campaign_recipients r join public.whatsapp_campaigns c on c.id = r.campaign_id
                           where r.status = 'pending' and c.status in ('queued', 'sending')),
    'health', (select h.status from public.whatsapp_health h));
end $$;

-- an administrator records what Meta shows (WhatsApp Manager, Meta Support) or the usage of other numbers
create function api.wa_quota_confirm(p jsonb) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('plat') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  if coalesce((p ->> 'limit')::int, 0) not between 1 and 100000000
     or coalesce(p ->> 'verification', '') not in ('unknown', 'not_verified', 'pending', 'verified')
     or coalesce(p ->> 'phoneQuality', '') not in ('UNKNOWN', 'HIGH', 'MEDIUM', 'LOW')
     or coalesce(p ->> 'templateQuality', '') not in ('UNKNOWN', 'HIGH', 'MEDIUM', 'LOW')
     or coalesce(p ->> 'source', '') not in ('meta_support', 'admin')
     or length(btrim(coalesce(p ->> 'tier', ''))) not between 1 and 40
     or length(btrim(coalesce(p ->> 'note', ''))) not between 3 and 300
     or coalesce((p ->> 'external')::int, 0) not between 0 and 100000000
     or coalesce((p ->> 'staleDays')::int, 0) not between 1 and 90 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.set_reason('WhatsApp account limit confirmed: ' || btrim(p ->> 'note'));
  update public.whatsapp_quota set tier = upper(btrim(p ->> 'tier')), unique_limit = (p ->> 'limit')::int,
    verification = p ->> 'verification', phone_quality = p ->> 'phoneQuality', template_quality = p ->> 'templateQuality',
    source = p ->> 'source', note = btrim(p ->> 'note'), stale_days = (p ->> 'staleDays')::int,
    external_recipients = (p ->> 'external')::int, external_at = case when (p ->> 'external')::int > 0 then now() end,
    confirmed_by = auth.uid(), confirmed_at = now()
   where id; -- the single row; a WHERE also satisfies safeupdate on API connections
end $$;

-- when a campaign's waiting recipients can go, window by window, at the confirmed limit (an estimate: replies,
-- other numbers and new consents change it; the dispatcher recalculates before every batch)
create function api.wa_campaign_schedule(p_id uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  v_limit int;
  v_room int := private.wa_quota_room();
  v_left int;
  v_out jsonb := '[]'::jsonb;
  v_at timestamptz := now();
  v_take int;
  i int := 0;
begin
  if private.staff_level('out') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  select q.unique_limit into v_limit from public.whatsapp_quota q;
  -- only new template recipients need a place
  select count(*) into v_left from public.whatsapp_campaign_recipients r
   where r.campaign_id = p_id and r.status = 'pending' and coalesce(r.kind, 'template') = 'template' and not private.wa_recent(r.phone);
  if private.wa_quota_problem() is not null then
    return jsonb_build_object('problem', private.wa_quota_problem(), 'waiting', v_left, 'windows', v_out);
  end if;
  while v_left > 0 and i < 60 loop
    v_take := least(v_left, case when i = 0 then v_room else v_limit end);
    if v_take > 0 then v_out := v_out || jsonb_build_object('from', v_at, 'recipients', v_take); end if;
    v_left := v_left - v_take;
    v_at := now() + make_interval(hours => 24 * (i + 1));
    i := i + 1;
  end loop;
  return jsonb_build_object('problem', null, 'waiting', (select count(*) from public.whatsapp_campaign_recipients r where r.campaign_id = p_id and r.status = 'pending'),
                            'needPlaces', (select count(*) from public.whatsapp_campaign_recipients r where r.campaign_id = p_id and r.status = 'pending'
                                             and coalesce(r.kind, 'template') = 'template' and not private.wa_recent(r.phone)),
                            'windows', v_out, 'beyond', v_left);
end $$;

revoke all on function private.wa_recent(text), private.wa_used(int), private.wa_quota_problem(), private.wa_quota_room() from public, anon, authenticated;
revoke all on function api.wa_quota_status(), api.wa_quota_confirm(jsonb), api.wa_campaign_schedule(uuid) from public, anon, service_role;
grant execute on function api.wa_quota_status(), api.wa_quota_confirm(jsonb), api.wa_campaign_schedule(uuid) to authenticated;
