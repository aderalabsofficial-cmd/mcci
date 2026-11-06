-- 0690 · WhatsApp consent centre (owner's brief and decisions A–C of 6 Nov 2026; docs/30 §12)
--
-- One consent system, extended (no second one):
--  * a fifth category, `services` (service, application and certificate updates); nothing is ticked by default
--  * the WhatsApp contact keeps its history: a changed or removed number is kept in outreach_contact_history, and the
--    consent of the old number ends with a recorded row (`number_change`); consent is never carried to a new number
--  * number verification by a one-time JOIN code sent from the member's own WhatsApp (hashed, 30 minutes, one use, exact
--    number match). JOIN proves control of the number; it is not consent
--  * members manage their contact at any time and withdraw at any time; new consent only once MCCI has opened it
--    (settings.whatsapp.consentOpen, decision A) — for members and for staff alike
--  * a member's own withdrawal (portal, staff-recorded request, or STOP) is never lifted by staff (decision C); only the
--    member subscribes again, with fresh consent and a JOIN confirmation made after it
--  * staff-assisted consent states its method, evidence and the member's explicit yes; the wording version is recorded
--  * one derived WhatsApp status per business for the register, the member record, the directory and the audience

-- ───────── categories ─────────
alter table public.whatsapp_campaigns drop constraint whatsapp_campaigns_category_check;
alter table public.whatsapp_campaigns add constraint whatsapp_campaigns_category_check
  check (category in ('announcements', 'membership', 'events', 'opportunities', 'services'));

alter table public.outreach_consents alter column categories drop default;
alter table public.outreach_consents add constraint outreach_consents_categories_check
  check (categories <@ array['announcements','membership','events','opportunities','services']::text[]);
alter table public.outreach_consents drop constraint outreach_consents_method_check;
alter table public.outreach_consents add constraint outreach_consents_method_check
  check (method in ('written', 'event_form', 'email', 'recipient', 'member_portal', 'phone', 'in_person', 'opt_in_flow',
                    'other', 'number_change'));
-- staff-assisted consent: the member's explicit yes was confirmed by the person recording it
alter table public.outreach_consents add column confirmed boolean not null default false;

alter table public.outreach_suppressions drop constraint outreach_suppressions_source_check;
alter table public.outreach_suppressions add constraint outreach_suppressions_source_check
  check (source in ('staff', 'recipient', 'provider', 'member'));

-- ───────── the contact: verification and source ─────────
alter table public.outreach_contacts
  add column verified_at timestamptz,
  add column verified_method text check (verified_method in ('whatsapp_join')),
  add column source text not null default 'staff' check (source in ('staff', 'member'));

-- earlier numbers and names of a business's WhatsApp contact; append-only, read through api functions only
create table public.outreach_contact_history (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies on delete cascade,
  phone text not null,
  name text,
  verified_at timestamptz,
  source text not null,
  change text not null check (change in ('number_changed', 'removed')),
  changed_by uuid references public.profiles on delete set null default auth.uid(),
  changed_at timestamptz not null default now()
);
create index outreach_contact_history_company on public.outreach_contact_history (company_id, id desc);

-- one-time codes a member sends from WhatsApp as "JOIN <code>"; only the hash is kept
create table public.outreach_join_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  phone text not null,
  code_hash text not null,
  created_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  used_at timestamptz,
  cancelled_at timestamptz
);
create index outreach_join_codes_hash on public.outreach_join_codes (code_hash);
create index outreach_join_codes_company on public.outreach_join_codes (company_id, created_at desc);

-- every JOIN that reached MCCI and what came of it (the evidence of a verification)
create table public.outreach_verifications (
  id bigint generated always as identity primary key,
  company_id uuid references public.companies on delete cascade,
  phone text not null,
  outcome text not null check (outcome in ('verified', 'expired', 'used', 'mismatch', 'unknown_code')),
  join_code_id uuid references public.outreach_join_codes on delete set null,
  wa_id text,
  at timestamptz not null default now()
);
create index outreach_verifications_company on public.outreach_verifications (company_id, id desc);

do $$
declare t text;
begin
  foreach t in array array['outreach_contact_history', 'outreach_join_codes', 'outreach_verifications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
  -- the number is left out of the audit log, as for the other outreach tables (0570)
  execute 'create trigger audit_row after insert or update or delete on public.outreach_contact_history for each row execute function private.audit_row(''phone'')';
  execute 'create trigger audit_row after insert or update or delete on public.outreach_verifications for each row execute function private.audit_row(''phone'')';
  execute 'create trigger audit_row after insert or update or delete on public.outreach_join_codes for each row execute function private.audit_row(''code_hash'', ''phone'')';
end $$;

-- ───────── helpers ─────────
create function private.wa_categories() returns text[]
  language sql immutable set search_path = ''
  as $$ select array['announcements','membership','events','opportunities','services']::text[] $$;

-- any common way of writing a number → +<country><number>; Pakistani numbers must be mobiles (+923XXXXXXXXX); null if not a number
create function private.wa_phone(p text) returns text
  language plpgsql immutable set search_path = ''
  as $$
declare d text := regexp_replace(coalesce(p, ''), '[\s().\-]', '', 'g');
begin
  if d ~ '^03[0-9]{9}$' then d := '+92' || substr(d, 2);
  elsif d ~ '^3[0-9]{9}$' then d := '+92' || d;
  elsif d ~ '^923[0-9]{9}$' then d := '+' || d;
  elsif d ~ '^00[1-9]' then d := '+' || substr(d, 3);
  end if;
  if d !~ '^\+[1-9][0-9]{7,14}$' then return null; end if;
  if d ~ '^\+92' and d !~ '^\+923[0-9]{9}$' then return null; end if;
  return d;
end $$;

-- +923001234567 → +92 300 •••• 567: for staff who may see the status but not the number
create function private.wa_mask(p text) returns text
  language sql immutable set search_path = ''
  as $$ select case when p is null then null else left(p, 3) || ' ' || substr(p, 4, 3) || ' •••• ' || right(p, 3) end $$;

-- the one WhatsApp status of a business (docs/30 §12)
--   no_number · not_collected · full · partial · awaiting_verification · opted_out · blocked
create function private.wa_status(p_company uuid) returns text
  language plpgsql stable set search_path = ''
  as $$
declare
  o public.outreach_contacts;
  k public.outreach_consents;
  s public.outreach_suppressions;
begin
  select * into o from public.outreach_contacts x where x.company_id = p_company;
  if o.phone is null then return 'no_number'; end if;
  k := private.wa_consent(p_company, o.phone);
  select * into s from public.outreach_suppressions x where x.phone = o.phone and x.active;
  if s.id is not null then
    if s.source in ('member', 'recipient') and k.status = 'granted' and k.recorded_at > s.created_at then
      return 'awaiting_verification';
    end if;
    return case when s.source in ('member', 'recipient') then 'opted_out' else 'blocked' end;
  end if;
  if k.id is null then return 'not_collected'; end if;
  if k.status = 'withdrawn' then return 'opted_out'; end if;
  return case when private.wa_categories() <@ k.categories then 'full' else 'partial' end;
end $$;

-- ───────── the directory row learns the status (columns added at the end) ─────────
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
             and w.state in ('submitted', 'sent', 'delivered', 'read')) as previously_contacted,
    coalesce((select array_agg(distinct r.campaign_id) from public.whatsapp_campaign_recipients r where r.company_id = c.id), '{}'::uuid[]) as campaign_ids,
    private.wa_status(c.id) as wa_status,
    coalesce((select x.categories from public.outreach_consents x
               where x.company_id = c.id and x.phone = oc.phone and x.status = 'granted'
                 and x.id = (select max(y.id) from public.outreach_consents y where y.company_id = c.id and y.phone = oc.phone)),
             '{}'::text[]) as wa_categories,
    oc.verified_at is not null as wa_verified
  from public.members m
  join public.companies c on c.id = m.company_id
  left join public.outreach_profiles p on p.company_id = c.id
  left join public.outreach_contacts oc on oc.company_id = c.id
  where not c.demo;
revoke all on private.biz_rows from public, anon, authenticated;

-- the segment filter learns wa_status (text), wa_verified (yes/no) and wa_categories (consented to any / none of)
do $$
declare v text := pg_get_functiondef('private.biz_rule(jsonb)'::regprocedure);
begin
  if position('''rep_name'',''business_name'') then ''text''' in v) = 0
     or position('''previously_contacted'') then ''bool''' in v) = 0
     or position('  if kind = ''text'' then' in v) = 0 then
    raise exception 'biz_rule patch not found';
  end if;
  v := replace(v, '''rep_name'',''business_name'') then ''text''', '''rep_name'',''business_name'',''wa_status'') then ''text''');
  v := replace(v, '''previously_contacted'') then ''bool''', '''previously_contacted'',''wa_verified'') then ''bool''
    when f = ''wa_categories'' then ''set''');
  v := replace(v, '  if kind = ''text'' then', '  if kind = ''set'' then
    if not (vals <@ private.wa_categories()) then raise exception ''bad value'' using errcode = ''P0001'', hint = ''filter''; end if;
    if op = ''in'' then return format(''%s && %L::text[]'', col, vals::text); end if;
    if op = ''not_in'' then return format(''not (%s && %L::text[])'', col, vals::text); end if;
  elsif kind = ''text'' then');
  execute v;
end $$;

-- ───────── consent rows ─────────
drop function private.wa_consent_write(uuid, text, text, text, text, text[]);
create function private.wa_consent_write(p_company uuid, p_phone text, p_status text, p_method text, p_evidence text, p_categories text[],
                                         p_confirmed boolean) returns void
  language plpgsql volatile set search_path = ''
  as $$
begin
  if p_categories is null or cardinality(p_categories) = 0 or not (p_categories <@ private.wa_categories()) then
    raise exception 'categories' using errcode = 'P0001', hint = 'categories';
  end if;
  insert into public.outreach_consents (company_id, phone, status, method, evidence, categories, wording_version, confirmed)
  values (p_company, p_phone, p_status, p_method, nullif(btrim(p_evidence), ''), p_categories, private.wa_setting('consentVersion'),
          coalesce(p_confirmed, false));
end $$;
revoke all on function private.wa_consent_write(uuid, text, text, text, text, text[], boolean) from public, anon, authenticated;

-- set, change or remove the contact. A new or removed number: the old one goes to history, its consent ends with a
-- recorded row, its unused JOIN codes are cancelled, and verification starts again. Name-only edits keep everything.
create function private.wa_contact_set(p_company uuid, p_name text, p_phone text, p_source text) returns void
  language plpgsql volatile set search_path = ''
  as $$
declare
  o public.outreach_contacts;
  k public.outreach_consents;
begin
  select * into o from public.outreach_contacts x where x.company_id = p_company for update;
  if o.phone is not null and o.phone is distinct from p_phone then
    insert into public.outreach_contact_history (company_id, phone, name, verified_at, source, change)
    values (p_company, o.phone, o.name, o.verified_at, o.source, case when p_phone is null then 'removed' else 'number_changed' end);
    k := private.wa_consent(p_company, o.phone);
    if k.status = 'granted' then
      perform private.wa_consent_write(p_company, o.phone, 'withdrawn', 'number_change',
        case when p_phone is null then 'WhatsApp number removed' else 'WhatsApp number changed' end, private.wa_categories(), false);
    end if;
    update public.outreach_join_codes set cancelled_at = now() where company_id = p_company and used_at is null and cancelled_at is null;
  end if;
  if p_phone is null then
    delete from public.outreach_contacts where company_id = p_company;
  elsif o.company_id is null then
    insert into public.outreach_contacts (company_id, name, phone, source, updated_by) values (p_company, nullif(btrim(p_name), ''), p_phone, p_source, auth.uid());
  elsif o.phone = p_phone then
    update public.outreach_contacts set name = nullif(btrim(p_name), ''), updated_by = auth.uid(), updated_at = now() where company_id = p_company;
  else
    update public.outreach_contacts set name = nullif(btrim(p_name), ''), phone = p_phone, source = p_source, verified_at = null,
      verified_method = null, updated_by = auth.uid(), updated_at = now()
     where company_id = p_company;
  end if;
end $$;
revoke all on function private.wa_contact_set(uuid, text, text, text) from public, anon, authenticated;

-- ───────── staff: contact (same signature as 0570; history now kept) ─────────
create or replace function api.biz_contact_save(p_company uuid, p_name text, p_phone text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text := private.wa_phone(p_phone);
begin
  if not private.biz_contact_access() then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.companies c where c.id = p_company) then raise exception 'not found' using errcode = 'P0001', hint = 'fields'; end if;
  if btrim(coalesce(p_phone, '')) = '' then
    perform private.set_reason('WhatsApp contact removed');
    perform private.wa_contact_set(p_company, null, null, 'staff');
    return;
  end if;
  if v_phone is null or length(coalesce(p_name, '')) > 120 then
    raise exception 'check the number' using errcode = 'P0001', hint = 'phone';
  end if;
  perform private.set_reason('WhatsApp contact saved by staff');
  perform private.wa_contact_set(p_company, p_name, v_phone, 'staff');
end $$;

-- ───────── staff: consent on the member's behalf ─────────
drop function api.wa_consent_record(uuid, text, text, text, text[]);
create function api.wa_consent_record(p_company uuid, p_status text, p_method text, p_evidence text, p_categories text[], p_confirmed boolean)
  returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_phone text;
  s public.outreach_suppressions;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  if v_phone is null then raise exception 'no contact' using errcode = 'P0001', hint = 'nocontact'; end if;
  if p_status not in ('granted', 'withdrawn')
     or p_method not in ('phone', 'written', 'in_person', 'email', 'event_form', 'opt_in_flow', 'other') then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  if p_status = 'granted' then
    -- decision A: no new consent until MCCI has approved the wording and opened it
    if coalesce(private.wa_setting('consentOpen')::boolean, false) is not true then
      raise exception 'closed' using errcode = 'P0001', hint = 'closed';
    end if;
    if coalesce(p_confirmed, false) is not true then raise exception 'confirm' using errcode = 'P0001', hint = 'confirm_yes'; end if;
    if length(btrim(coalesce(p_evidence, ''))) not between 3 and 500 then
      raise exception 'evidence needed' using errcode = 'P0001', hint = 'evidence';
    end if;
    -- decision C: a member's own withdrawal or STOP is never overridden; a staff block must be lifted first
    select * into s from public.outreach_suppressions x where x.phone = v_phone and x.active;
    if s.source in ('member', 'recipient') then raise exception 'member opted out' using errcode = 'P0001', hint = 'member_optout'; end if;
    if s.id is not null then raise exception 'opted out' using errcode = 'P0001', hint = 'suppressed'; end if;
    perform private.set_reason('WhatsApp consent recorded by staff');
    perform private.wa_consent_write(p_company, v_phone, 'granted', p_method, p_evidence, p_categories, true);
  else
    perform private.set_reason('WhatsApp consent withdrawn (recorded by staff)');
    perform private.wa_consent_write(p_company, v_phone, 'withdrawn', p_method, coalesce(nullif(btrim(p_evidence), ''), 'Withdrawal recorded by staff'),
                                     private.wa_categories(), coalesce(p_confirmed, false));
    -- the member's own request: only the member can subscribe again
    insert into public.outreach_suppressions (phone, reason, source) values (v_phone, 'Consent withdrawn at the member''s request', 'member')
    on conflict (phone) do update set active = true, reason = excluded.reason, source = excluded.source,
      created_by = auth.uid(), created_at = now(), lifted_by = null, lifted_at = null, lifted_reason = null;
  end if;
end $$;

-- replaced by api.wa_my_whatsapp
drop function api.wa_my_consent(uuid);

-- the 0570 function recorded consent without categories or confirmation; nothing uses it any more
drop function api.biz_consent_record(uuid, text, text, text);

-- a block set by staff may be lifted (Approve level); the member's own opt-out may not (decision C)
create or replace function api.biz_unsuppress(p_company uuid, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text;
begin
  if private.staff_level('out') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  if v_phone is null then raise exception 'no contact' using errcode = 'P0001', hint = 'nocontact'; end if;
  if length(btrim(coalesce(p_reason, ''))) not between 3 and 300 then raise exception 'reason' using errcode = 'P0001', hint = 'reason'; end if;
  if exists (select 1 from public.outreach_suppressions s where s.phone = v_phone and s.active and s.source in ('member', 'recipient')) then
    raise exception 'member opted out' using errcode = 'P0001', hint = 'member_optout';
  end if;
  perform private.set_reason('WhatsApp suppression lifted');
  update public.outreach_suppressions set active = false, lifted_by = auth.uid(), lifted_at = now(), lifted_reason = btrim(p_reason)
   where phone = v_phone and active;
end $$;

-- ───────── member: own contact, consent, withdrawal, JOIN code ─────────
create function private.wa_member_check(p_company uuid, p_level int) returns void
  language plpgsql stable set search_path = ''
  as $$
begin
  if auth.uid() is null or private.company_level(p_company, 'profile') < p_level then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end $$;
revoke all on function private.wa_member_check(uuid, int) from public, anon, authenticated;

create function api.wa_member_contact(p_company uuid, p_name text, p_phone text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text := private.wa_phone(p_phone);
begin
  perform private.wa_member_check(p_company, 2);
  if btrim(coalesce(p_phone, '')) = '' then
    perform private.set_reason('WhatsApp number removed by the member');
    perform private.wa_contact_set(p_company, null, null, 'member');
    return;
  end if;
  if v_phone is null then raise exception 'phone' using errcode = 'P0001', hint = 'phone'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 2 and 120 then raise exception 'name' using errcode = 'P0001', hint = 'name'; end if;
  perform private.set_reason('WhatsApp contact saved by the member');
  perform private.wa_contact_set(p_company, p_name, v_phone, 'member');
end $$;

drop function api.wa_member_consent(uuid, text, text, boolean, text[]);
-- fresh, affirmative consent by the member for the categories ticked. After the member's own opt-out the number stays
-- blocked until a JOIN code made after this consent arrives from that number (decision C).
create function api.wa_member_consent(p_company uuid, p_categories text[], p_agree boolean) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_phone text;
  s public.outreach_suppressions;
begin
  perform private.wa_member_check(p_company, 2);
  if coalesce(private.wa_setting('consentOpen')::boolean, false) is not true then raise exception 'closed' using errcode = 'P0001', hint = 'closed'; end if;
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  if v_phone is null then raise exception 'no contact' using errcode = 'P0001', hint = 'nocontact'; end if;
  if coalesce(p_agree, false) is not true then raise exception 'agree' using errcode = 'P0001', hint = 'agree'; end if;
  select * into s from public.outreach_suppressions x where x.phone = v_phone and x.active;
  if s.id is not null and s.source not in ('member', 'recipient') then raise exception 'blocked' using errcode = 'P0001', hint = 'suppressed'; end if;
  perform private.set_reason('WhatsApp consent given by the member');
  perform private.wa_consent_write(p_company, v_phone, 'granted', 'member_portal', null, p_categories, true);
  return case when s.id is not null then 'awaiting_verification' else private.wa_status(p_company) end;
end $$;

create function api.wa_member_withdraw(p_company uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text;
begin
  perform private.wa_member_check(p_company, 2);
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  if v_phone is null then raise exception 'no contact' using errcode = 'P0001', hint = 'nocontact'; end if;
  perform private.set_reason('WhatsApp consent withdrawn by the member');
  perform private.wa_consent_write(p_company, v_phone, 'withdrawn', 'member_portal', null, private.wa_categories(), true);
  insert into public.outreach_suppressions (phone, reason, source) values (v_phone, 'Consent withdrawn by the member', 'member')
  on conflict (phone) do update set active = true, reason = excluded.reason, source = excluded.source, created_by = auth.uid(),
    created_at = now(), lifted_by = null, lifted_at = null, lifted_reason = null;
end $$;

-- a new one-time code for the saved number; earlier unused codes stop working. At most 5 an hour per business.
create function api.wa_join_code(p_company uuid) returns jsonb
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_phone text;
  v_code text;
  v_hash text;
  v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_row public.outreach_join_codes;
begin
  perform private.wa_member_check(p_company, 2);
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  if v_phone is null then raise exception 'no contact' using errcode = 'P0001', hint = 'nocontact'; end if;
  if (select count(*) from public.outreach_join_codes j where j.company_id = p_company and j.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too many' using errcode = 'P0001', hint = 'join_limit';
  end if;
  loop
    v_bytes := extensions.gen_random_bytes(6);
    v_code := '';
    for i in 0..5 loop v_code := v_code || substr(v_alpha, (get_byte(v_bytes, i) % 32) + 1, 1); end loop;
    v_hash := encode(extensions.digest(v_code, 'sha256'), 'hex');
    exit when not exists (select 1 from public.outreach_join_codes j where j.code_hash = v_hash and j.used_at is null and j.cancelled_at is null and j.expires_at > now());
  end loop;
  perform private.set_reason('WhatsApp confirmation code created by the member');
  update public.outreach_join_codes set cancelled_at = now() where company_id = p_company and used_at is null and cancelled_at is null;
  insert into public.outreach_join_codes (company_id, phone, code_hash) values (p_company, v_phone, v_hash) returning * into v_row;
  return jsonb_build_object('code', v_code, 'expires_at', v_row.expires_at,
    'to', (select regexp_replace(h.display_phone, '[^0-9]', '', 'g') from public.whatsapp_health h where h.id));
end $$;

-- the member's own view: everything about their company's WhatsApp contact, consent and history (never another's)
create function api.wa_my_whatsapp(p_company uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  o public.outreach_contacts;
  k public.outreach_consents;
  s public.outreach_suppressions;
  v_tel text;
  v_mobile text;
  j public.outreach_join_codes;
  v public.outreach_verifications;
begin
  perform private.wa_member_check(p_company, 1);
  select * into o from public.outreach_contacts x where x.company_id = p_company;
  k := private.wa_consent(p_company, o.phone);
  select * into s from public.outreach_suppressions x where x.phone = o.phone and x.active;
  select * into j from public.outreach_join_codes x where x.company_id = p_company and x.used_at is null and x.cancelled_at is null
     and x.expires_at > now() order by x.created_at desc limit 1;
  select * into v from public.outreach_verifications x where x.company_id = p_company order by x.id desc limit 1;
  select c.tel into v_tel from public.companies c where c.id = p_company;
  select p.mobile into v_mobile from public.profiles p where p.id = auth.uid();
  return jsonb_build_object(
    'open', coalesce(private.wa_setting('consentOpen')::boolean, false),
    'version', private.wa_setting('consentVersion'),
    'can_manage', private.company_level(p_company, 'profile') >= 2,
    'status', private.wa_status(p_company),
    'name', o.name, 'phone', o.phone, 'updated_at', o.updated_at, 'verified_at', o.verified_at,
    'consent_status', k.status, 'consent_at', k.recorded_at, 'consent_method', k.method,
    'categories', case when k.status = 'granted' then to_jsonb(k.categories) else '[]'::jsonb end,
    'suppressed', s.id is not null, 'suppression_source', s.source,
    'join_expires_at', j.expires_at,
    'last_verification', case when v.id is null then null else jsonb_build_object('outcome', v.outcome, 'at', v.at) end,
    'official', (select h.display_phone from public.whatsapp_health h where h.id),
    -- suggestions only: the registered numbers that are mobiles, never filled in for the member
    'suggestions', coalesce((select jsonb_agg(distinct x.p) from (
        select private.wa_phone(t) as p from unnest(regexp_split_to_array(coalesce(v_tel, ''), '[,;/&]|\s{2,}')) t
        union all select private.wa_phone(v_mobile)) x where x.p is not null and x.p is distinct from o.phone), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(h order by h.at desc) from (
        select c.recorded_at as at, 'consent_' || c.status as event, c.method as detail, c.phone, to_jsonb(c.categories) as categories
          from public.outreach_consents c where c.company_id = p_company
        union all
        select h.changed_at, 'contact_' || h.change, null, h.phone, null from public.outreach_contact_history h where h.company_id = p_company
        union all
        select x.at, 'verification_' || x.outcome, null, x.phone, null from public.outreach_verifications x where x.company_id = p_company
        order by 1 desc limit 30) h), '[]'::jsonb));
end $$;

-- ───────── staff: one business's WhatsApp section (member record, directory profile) ─────────
create function api.wa_member_whatsapp(p_company uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  o public.outreach_contacts;
  k public.outreach_consents;
  s public.outreach_suppressions;
  v_full boolean := private.biz_contact_access();
begin
  if private.staff_level('out') < 1 and private.staff_level('biz') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into o from public.outreach_contacts x where x.company_id = p_company;
  k := private.wa_consent(p_company, o.phone);
  select * into s from public.outreach_suppressions x where x.phone = o.phone and x.active;
  return jsonb_build_object(
    'open', coalesce(private.wa_setting('consentOpen')::boolean, false),
    'version', private.wa_setting('consentVersion'),
    'full_access', v_full,
    'can_record', private.staff_level('out') >= 2,
    'can_lift', private.staff_level('out') >= 3,
    'status', private.wa_status(p_company),
    'name', o.name,
    'phone', case when v_full then o.phone else private.wa_mask(o.phone) end,
    'language', o.language, 'source', o.source, 'updated_at', o.updated_at,
    'updated_by', (select p.full_name from public.profiles p where p.id = o.updated_by),
    'verified_at', o.verified_at, 'verified_method', o.verified_method,
    'consent', case when k.id is null then null else jsonb_build_object(
      'status', k.status, 'method', k.method, 'categories', k.categories, 'at', k.recorded_at, 'version', k.wording_version,
      'confirmed', k.confirmed, 'evidence', case when v_full then k.evidence end,
      'who', coalesce((select p.full_name from public.profiles p where p.id = k.recorded_by), case when k.method = 'recipient' then 'WhatsApp' end)) end,
    'suppression', case when s.id is null then null else jsonb_build_object(
      'source', s.source, 'reason', s.reason, 'at', s.created_at, 'member', s.source in ('member', 'recipient')) end,
    'history', coalesce((select jsonb_agg(h order by h.at desc) from (
        select c.recorded_at as at, 'consent_' || c.status as event, c.method as detail, to_jsonb(c.categories) as categories,
               case when v_full then c.phone else private.wa_mask(c.phone) end as phone,
               case when v_full then c.evidence end as evidence, c.wording_version as version,
               (select p.full_name from public.profiles p where p.id = c.recorded_by) as who
          from public.outreach_consents c where c.company_id = p_company
        union all
        select h.changed_at, 'contact_' || h.change, h.source, null, case when v_full then h.phone else private.wa_mask(h.phone) end, null, null,
               (select p.full_name from public.profiles p where p.id = h.changed_by)
          from public.outreach_contact_history h where h.company_id = p_company
        union all
        select x.at, 'verification_' || x.outcome, 'whatsapp_join', null, case when v_full then x.phone else private.wa_mask(x.phone) end, x.wa_id, null, null
          from public.outreach_verifications x where x.company_id = p_company
        union all
        select x.created_at, 'suppression_' || x.source, x.reason, null, case when v_full then x.phone else private.wa_mask(x.phone) end, null, null,
               (select p.full_name from public.profiles p where p.id = x.created_by)
          from public.outreach_suppressions x
         where x.phone in (select c.phone from public.outreach_consents c where c.company_id = p_company union select o.phone)
        order by 1 desc limit 60) h), '[]'::jsonb));
end $$;

-- ───────── staff: the register's WhatsApp column (status only; no numbers) ─────────
create function api.wa_register_status() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 1 and private.staff_level('biz') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  return coalesce((select jsonb_object_agg(c.id::text, jsonb_build_object('status', private.wa_status(c.id),
            'verified', o.verified_at is not null,
            'categories', coalesce((select to_jsonb(k.categories) from public.outreach_consents k
                                    where k.company_id = c.id and k.phone = o.phone order by k.id desc limit 1), '[]'::jsonb)))
     from public.companies c left join public.outreach_contacts o on o.company_id = c.id
    where exists (select 1 from public.members m where m.company_id = c.id)), '{}'::jsonb);
end $$;

-- ───────── the webhook: JOIN codes, and STOP rows with their categories ─────────
-- JOIN <code> verifies the number only when the code is current, unused, and the message comes from exactly the number
-- the member saved with it. Never matched by contact records alone. Every attempt is recorded; nothing is sent back.
create function private.wa_join(p_phone text, p_code text, p_wa_id text, p_conv uuid) returns text
  language plpgsql volatile set search_path = ''
  as $$
declare
  j public.outreach_join_codes;
  v_hash text := encode(extensions.digest(upper(p_code), 'sha256'), 'hex');
  v_outcome text;
  k public.outreach_consents;
  s public.outreach_suppressions;
begin
  select * into j from public.outreach_join_codes x where x.code_hash = v_hash order by x.created_at desc limit 1;
  if j.id is null then v_outcome := 'unknown_code';
  elsif j.used_at is not null then v_outcome := 'used';
  elsif j.cancelled_at is not null or j.expires_at <= now() then v_outcome := 'expired';
  elsif j.phone <> p_phone or not exists (select 1 from public.outreach_contacts o where o.company_id = j.company_id and o.phone = p_phone) then
    v_outcome := 'mismatch';
  else
    v_outcome := 'verified';
  end if;
  perform private.set_reason('WhatsApp JOIN received: ' || v_outcome);
  insert into public.outreach_verifications (company_id, phone, outcome, join_code_id, wa_id)
  values (case when v_outcome = 'unknown_code' then null else j.company_id end, p_phone, v_outcome, j.id, left(p_wa_id, 200));
  if v_outcome <> 'verified' then return v_outcome; end if;

  update public.outreach_join_codes set used_at = now() where id = j.id;
  update public.outreach_contacts set verified_at = now(), verified_method = 'whatsapp_join' where company_id = j.company_id;
  -- the member subscribed again after their own opt-out: this confirmation, made after that consent, lifts it
  k := private.wa_consent(j.company_id, p_phone);
  select * into s from public.outreach_suppressions x where x.phone = p_phone and x.active;
  if s.id is not null and s.source in ('member', 'recipient') and k.status = 'granted' and k.recorded_at > s.created_at
     and j.created_at >= k.recorded_at then
    update public.outreach_suppressions set active = false, lifted_by = null, lifted_at = now(),
      lifted_reason = 'Member subscribed again and confirmed the number on WhatsApp'
     where id = s.id;
  end if;
  update public.whatsapp_conversations c set company_id = j.company_id
   where c.id = p_conv and c.company_id is null and (select count(*) from public.outreach_contacts o where o.phone = p_phone) = 1;
  return v_outcome;
end $$;
revoke all on function private.wa_join(text, text, text, uuid) from public, anon, authenticated;

do $$
declare
  v text := pg_get_functiondef('api.wa_webhook(text, text, jsonb)'::regprocedure);
  a text := 'insert into public.outreach_consents (company_id, phone, status, method, evidence, recorded_by, wording_version)';
  b text := 'values (v_company, v_phone, ''withdrawn'', ''recipient'', ''WhatsApp reply'', null, private.wa_setting(''consentVersion''));';
  c text := '    if upper(btrim(v_text)) in (''STOP''';
begin
  if position(a in v) = 0 or position(b in v) = 0 or position(c in v) = 0 then raise exception 'wa_webhook patch not found'; end if;
  v := replace(v, a, 'insert into public.outreach_consents (company_id, phone, status, method, evidence, recorded_by, wording_version, categories)');
  v := replace(v, b, 'values (v_company, v_phone, ''withdrawn'', ''recipient'', ''WhatsApp reply'', null, private.wa_setting(''consentVersion''), private.wa_categories());');
  v := replace(v, c, '    if upper(btrim(v_text)) ~ ''^JOIN\s+(MCCI[\s-]*)?[A-Z0-9]{6}$'' then
      perform private.wa_join(v_phone, right(upper(btrim(v_text)), 6), e ->> ''id'', v_conv);
    end if;
' || c);
  execute v;
end $$;

-- ───────── campaigns: the fifth category ─────────
do $$
declare v text := pg_get_functiondef('api.wa_campaign_create(text, text, text, text, text, uuid, text, uuid, uuid, jsonb, text, uuid[], uuid[])'::regprocedure);
begin
  if position('p_category not in (''announcements'', ''membership'', ''events'', ''opportunities'')' in v) = 0 then
    raise exception 'wa_campaign_create patch not found';
  end if;
  execute replace(v, 'p_category not in (''announcements'', ''membership'', ''events'', ''opportunities'')',
                     'not (p_category = any(private.wa_categories()))');
end $$;

-- a master's category is its key, except that the membership-update master may also go as a service update
drop function api.wa_campaign_create_master(text, text, text, text, text, jsonb, boolean, text, uuid, jsonb, text, uuid[], uuid[]);
create function api.wa_campaign_create_master(p_name text, p_purpose text, p_mode text, p_master text, p_language text, p_fields jsonb,
                                              p_mixed boolean, p_body text, p_segment uuid, p_def jsonb, p_q text, p_ids uuid[], p_excluded uuid[],
                                              p_category text default null) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.whatsapp_masters;
  t public.whatsapp_templates;
  v_fields jsonb;
  v_id uuid;
  v_total bigint;
  v_where text;
  v_category text;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into m from public.whatsapp_masters x where x.key = p_master;
  v_category := coalesce(nullif(p_category, ''), m.key);
  if m.key is null or p_language not in ('en', 'ur') or length(btrim(coalesce(p_name, ''))) not between 2 and 120 or p_mode not in ('campaign', 'selective')
     or (coalesce(p_mixed, false) and length(btrim(coalesce(p_body, ''))) not between 1 and 4096)
     or not (v_category = m.key or (m.key = 'membership' and v_category = 'services')) then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  select * into t from public.whatsapp_templates x where x.name = m.name and x.language = p_language;
  if t.id is null or t.status is distinct from 'APPROVED' then raise exception 'not approved' using errcode = 'P0001', hint = 'not_approved'; end if;
  v_fields := private.wa_master_fields(m.key, p_language, p_fields);
  v_where := private.biz_where(p_def, p_q, p_ids, p_excluded);
  execute format('select count(*) from private.biz_rows r where %s', v_where) into v_total;
  if v_total = 0 then raise exception 'no one' using errcode = 'P0001', hint = 'empty'; end if;
  if v_total > coalesce(private.wa_setting('maxCampaign')::int, 1000) then raise exception 'too many' using errcode = 'P0001', hint = 'toomany'; end if;
  perform private.set_reason('WhatsApp campaign created from a master template');
  insert into public.whatsapp_campaigns (name, purpose, mode, category, message_kind, template_id, body, segment_id, filter, master_key, language, fields)
  values (btrim(p_name), nullif(btrim(p_purpose), ''), p_mode, v_category, case when coalesce(p_mixed, false) then 'mixed' else 'template' end, t.id,
          case when coalesce(p_mixed, false) then btrim(p_body) end, p_segment,
          jsonb_build_object('filter', coalesce(p_def, '{}'::jsonb), 'search', nullif(btrim(coalesce(p_q, '')), ''), 'selected', cardinality(p_ids), 'excluded', cardinality(p_excluded)),
          m.key, p_language, v_fields)
  returning id into v_id;
  execute format($q$
    insert into public.whatsapp_campaign_recipients (campaign_id, company_id, member_no, business_name, phone, kind, status, reason)
    select %L::uuid, x.company_id, x.member_no, x.business_name, x.phone, x.kind,
           case when x.block is null then 'pending' else 'skipped' end, x.block
      from (select distinct on (r.company_id) r.company_id, r.member_no, r.business_name, o.phone,
                   k.kind, private.wa_block(r.company_id, o.phone, %L, case k.kind when 'text' then 'session' else 'template' end, %L::uuid) as block
              from private.biz_rows r left join public.outreach_contacts o on o.company_id = r.company_id
              cross join lateral (select case when %L::boolean and private.wa_window_open(o.phone) then 'text' else 'template' end as kind) k
             where %s order by r.company_id, r.valid_to desc) x
    $q$, v_id, v_category, t.id, coalesce(p_mixed, false), v_where);
  return v_id;
end $$;

-- ───────── grants ─────────
do $$
declare f text;
begin
  foreach f in array array['api.biz_contact_save(uuid,text,text)', 'api.wa_consent_record(uuid,text,text,text,text[],boolean)',
      'api.biz_unsuppress(uuid,text)', 'api.wa_member_contact(uuid,text,text)', 'api.wa_member_consent(uuid,text[],boolean)',
      'api.wa_member_withdraw(uuid)', 'api.wa_join_code(uuid)', 'api.wa_my_whatsapp(uuid)', 'api.wa_member_whatsapp(uuid)',
      'api.wa_register_status()',
      'api.wa_campaign_create_master(text,text,text,text,text,jsonb,boolean,text,uuid,jsonb,text,uuid[],uuid[],text)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  foreach f in array array['private.wa_categories()', 'private.wa_phone(text)', 'private.wa_mask(text)', 'private.wa_status(uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
end $$;
