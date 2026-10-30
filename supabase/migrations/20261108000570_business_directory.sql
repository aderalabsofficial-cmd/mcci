-- 0570 · Business directory and segmentation (owner brief of 30 Oct 2026, docs/28, docs/29).
--
-- Official records stay in companies and members and are only read here. What this module may edit is kept apart:
-- outreach details, internal tags, the WhatsApp contact, its consent and suppression. Saved segments are dynamic: they
-- store the filter, never a list. Every export is logged, with who, when, filters, format, count, fields and reason.
--
-- Filters arrive as jsonb and become SQL only through private.biz_where / private.biz_rule, which accept fields and
-- operators from a fixed list and quote every value. No caller text reaches a query any other way.
--
-- Modules: biz (1 view, 2 tags + segments + plain exports, 3 sensitive contacts + large exports) and out (1 reports,
-- 2 consent + suppression, 3 lift a suppression; campaigns come with a later phase).

-- ───────── modules ─────────
alter table public.role_permissions drop constraint role_permissions_module_check;
alter table public.role_permissions add constraint role_permissions_module_check
  check (module in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat','biz','out'));
alter table public.staff_permission_overrides drop constraint staff_permission_overrides_module_check;
alter table public.staff_permission_overrides add constraint staff_permission_overrides_module_check
  check (module in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat','biz','out'));

-- every function that lists the modules (api.my_access, api.role_permission_set, ...) learns the two new ones
do $$
declare r record;
begin
  for r in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('api', 'private') and p.prosrc like '%''staff'',''plat''%'
  loop
    execute replace(pg_get_functiondef(r.oid), '''staff'',''plat''', '''staff'',''plat'',''biz'',''out''');
  end loop;
end $$;

-- TODO(MCCI): default limits are a proposal; the Secretary General can change them in Staff & Roles
do $$
declare
  v_rows text[][] := array[
    ['Secretary General', 'biz', '3'], ['Secretary General', 'out', '3'],
    ['President (Signatory)', 'biz', '1'], ['President (Signatory)', 'out', '1'],
    ['Deputy Secretary — Membership', 'biz', '3'], ['Deputy Secretary — Membership', 'out', '2'],
    ['Membership Officer', 'biz', '2'], ['Membership Officer', 'out', '1'],
    ['Auditor (read-only)', 'biz', '1'], ['Auditor (read-only)', 'out', '1'],
    ['IT Convener', 'biz', '1']];
  i int;
begin
  for i in 1 .. array_length(v_rows, 1) loop
    if exists (select 1 from public.role_permissions where designation = v_rows[i][1]) then
      insert into public.role_permissions (designation, module, level)
      values (v_rows[i][1], v_rows[i][2], v_rows[i][3]::smallint) on conflict do nothing;
      insert into private.role_permission_defaults (designation, module, level)
      values (v_rows[i][1], v_rows[i][2], v_rows[i][3]::smallint) on conflict do nothing;
    end if;
  end loop;
end $$;

-- TODO(MCCI): exports above this many rows need Approve level; above the maximum they are refused
insert into private.settings (key, value) values ('outreach', '{"exportApprovalRows":1000,"exportMaxRows":5000,"renewalDueDays":60}'::jsonb)
on conflict (key) do nothing;

-- ───────── tables ─────────
create table public.outreach_profiles (          -- editable details; never the official record
  company_id uuid primary key references public.companies on delete cascade,
  city text check (length(city) <= 80),
  district text check (length(district) <= 80),
  notes text check (length(notes) <= 1000),
  updated_by uuid references public.profiles on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);

create table public.outreach_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 40),
  created_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create unique index outreach_tags_name on public.outreach_tags (lower(name));

create table public.company_tags (
  company_id uuid not null references public.companies on delete cascade,
  tag_id uuid not null references public.outreach_tags on delete cascade,
  added_by uuid references public.profiles on delete set null default auth.uid(),
  added_at timestamptz not null default now(),
  primary key (company_id, tag_id)
);
create index company_tags_tag on public.company_tags (tag_id);

create table public.outreach_contacts (          -- the one WhatsApp contact of a business
  company_id uuid primary key references public.companies on delete cascade,
  name text check (length(name) <= 120),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  updated_by uuid references public.profiles on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);
create index outreach_contacts_phone on public.outreach_contacts (phone);

create table public.outreach_consents (          -- append-only; the latest row for the current number decides
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies on delete cascade,
  phone text not null,
  status text not null check (status in ('granted', 'withdrawn')),
  method text not null check (method in ('written', 'event_form', 'email', 'recipient', 'member_portal')),
  evidence text check (length(evidence) <= 500),
  recorded_by uuid references public.profiles on delete set null default auth.uid(),
  recorded_at timestamptz not null default now()
);
create index outreach_consents_latest on public.outreach_consents (company_id, phone, id desc);

create table public.outreach_suppressions (      -- by number: an opt-out follows the person, not the company
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  active boolean not null default true,
  reason text not null check (length(reason) <= 300),
  source text not null check (source in ('staff', 'recipient', 'provider')),
  created_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  lifted_by uuid references public.profiles on delete set null,
  lifted_at timestamptz,
  lifted_reason text check (length(lifted_reason) <= 300)
);

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 80),
  description text check (length(description) <= 300),
  kind text not null default 'dynamic' check (kind = 'dynamic'),
  definition jsonb not null,
  created_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index segments_name on public.segments (lower(name));

create table public.export_log (                 -- append-only: no update or delete for anyone
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid references public.profiles on delete set null default auth.uid(),
  format text not null check (format in ('csv', 'xlsx', 'pdf')),
  filters jsonb not null,
  record_count int not null,
  fields text[] not null,
  sensitive boolean not null,
  reason text check (length(reason) <= 300)
);
create index export_log_user_at on public.export_log (user_id, at desc);

do $$
declare t text;
begin
  foreach t in array array['outreach_profiles','outreach_tags','company_tags','outreach_contacts','outreach_consents',
                           'outreach_suppressions','segments','export_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
  foreach t in array array['outreach_profiles','outreach_tags','company_tags','segments'] loop
    execute format('create trigger audit_row after insert or update or delete on public.%I for each row execute function private.audit_row()', t);
  end loop;
  -- the audit log is readable by more staff than contact details are: the number itself is left out of it
  foreach t in array array['outreach_contacts','outreach_consents','outreach_suppressions'] loop
    execute format('create trigger audit_row after insert or update or delete on public.%I for each row execute function private.audit_row(''phone'')', t);
  end loop;
end $$;

-- direct reads only where nothing sensitive is exposed; all writes go through the functions below
grant select on public.outreach_tags, public.segments, public.export_log to authenticated;
create policy outreach_tags_select on public.outreach_tags for select to authenticated using ((select private.staff_level('biz')) >= 1);
create policy segments_select on public.segments for select to authenticated using ((select private.staff_level('biz')) >= 1);
create policy export_log_select on public.export_log for select to authenticated
  using (user_id = (select auth.uid()) or (select private.staff_level('biz')) >= 3);

-- ───────── the one directory row ─────────
create view private.biz_rows with (security_barrier = true) as
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
      or (nullif(btrim(c.tel), '') is null and c.email is null) or oc.phone is null) as incomplete
  from public.members m
  join public.companies c on c.id = m.company_id
  left join public.outreach_profiles p on p.company_id = c.id
  left join public.outreach_contacts oc on oc.company_id = c.id
  where not c.demo;
revoke all on private.biz_rows from public, anon, authenticated;

-- ───────── filters → SQL (fixed fields, fixed operators, every value quoted) ─────────
create function private.biz_rule(r jsonb) returns text
  language plpgsql stable set search_path = ''
  as $$
declare
  f text := r ->> 'field';
  op text := r ->> 'op';
  v jsonb := r -> 'value';
  col text;
  kind text;
  vals text[];
begin
  kind := case
    when f in ('business_category','member_class','member_status','renewal','registration','consent','nature','sector','city','district','rep_name','business_name') then 'text'
    when f in ('valid_year') then 'number'
    when f in ('member_since','valid_to') then 'date'
    when f in ('whatsapp_available','opted_out','incomplete') then 'bool'
    when f = 'tags' then 'tags'
  end;
  if kind is null then raise exception 'unknown field' using errcode = 'P0001', hint = 'filter'; end if;
  col := format('r.%I', case when f = 'tags' then 'tag_ids' else f end);

  if op in ('in', 'not_in', 'any', 'none', 'between') then
    if v is null or jsonb_typeof(v) <> 'array' or jsonb_array_length(v) not between 1 and 100 then
      raise exception 'bad value' using errcode = 'P0001', hint = 'filter';
    end if;
    vals := array(select jsonb_array_elements_text(v));
  end if;

  if kind = 'text' then
    if op = 'in' then return format('lower(%s) = any(%L::text[])', col, lower(vals::text)::text[]); end if;
    if op = 'not_in' then return format('lower(coalesce(%s, %L)) <> all(%L::text[])', col, '', lower(vals::text)::text[]); end if;
    if op = 'contains' and jsonb_typeof(v) = 'string' and length(v #>> '{}') between 1 and 100 then
      return format('%s ilike %L', col, '%' || replace(replace(replace(v #>> '{}', '\', '\\'), '%', '\%'), '_', '\_') || '%');
    end if;
    if op = 'empty' then return format('%s is null', col); end if;
    if op = 'not_empty' then return format('%s is not null', col); end if;
  elsif kind = 'number' then
    if op = 'between' and array_length(vals, 1) = 2 and vals[1] ~ '^[0-9]{1,6}$' and vals[2] ~ '^[0-9]{1,6}$' then
      return format('%s between %L::int and %L::int', col, vals[1], vals[2]);
    end if;
    if op in ('eq', 'gte', 'lte') and (v #>> '{}') ~ '^[0-9]{1,6}$' then
      return format('%s %s %L::int', col, case op when 'eq' then '=' when 'gte' then '>=' else '<=' end, v #>> '{}');
    end if;
  elsif kind = 'date' then
    if op = 'between' and array_length(vals, 1) = 2 and vals[1] ~ '^\d{4}-\d{2}-\d{2}$' and vals[2] ~ '^\d{4}-\d{2}-\d{2}$' then
      return format('%s between %L::date and %L::date', col, vals[1], vals[2]);
    end if;
    if op in ('gte', 'lte') and (v #>> '{}') ~ '^\d{4}-\d{2}-\d{2}$' then
      return format('%s %s %L::date', col, case op when 'gte' then '>=' else '<=' end, v #>> '{}');
    end if;
  elsif kind = 'bool' then
    if op = 'is' and jsonb_typeof(v) = 'boolean' then
      return format('%s is %s', col, case when v = 'true'::jsonb then 'true' else 'false' end);
    end if;
  elsif kind = 'tags' then
    if op = 'any' then return format('%s && %L::uuid[]', col, vals::text); end if;
    if op = 'none' then return format('not (%s && %L::uuid[])', col, vals::text); end if;
    if op = 'empty' then return format('cardinality(%s) = 0', col); end if;
    if op = 'not_empty' then return format('cardinality(%s) > 0', col); end if;
  end if;
  raise exception 'unknown operator' using errcode = 'P0001', hint = 'filter';
end $$;

-- groups are joined with AND; inside a group "all" or "any"; an excluding group removes what it matches
create function private.biz_where(p_def jsonb, p_q text, p_ids uuid[] default null, p_excluded uuid[] default null) returns text
  language plpgsql stable set search_path = ''
  as $$
declare
  v_parts text[] := array['true'];
  v_groups jsonb := coalesce(p_def -> 'groups', '[]'::jsonb);
  g jsonb;
  r jsonb;
  v_rules text[];
  v_sql text;
  v_q text := btrim(coalesce(p_q, ''));
begin
  if jsonb_typeof(v_groups) <> 'array' or jsonb_array_length(v_groups) > 10 or length(coalesce(p_def::text, '')) > 20000 then
    raise exception 'filter too large' using errcode = 'P0001', hint = 'filter';
  end if;
  for g in select * from jsonb_array_elements(v_groups) loop
    if jsonb_typeof(g -> 'rules') <> 'array' or jsonb_array_length(g -> 'rules') > 20 then
      raise exception 'bad group' using errcode = 'P0001', hint = 'filter';
    end if;
    v_rules := '{}';
    for r in select * from jsonb_array_elements(g -> 'rules') loop
      v_rules := v_rules || private.biz_rule(r);
    end loop;
    continue when cardinality(v_rules) = 0;
    v_sql := '(' || array_to_string(v_rules, case when g ->> 'match' = 'any' then ' or ' else ' and ' end) || ')';
    if (g ->> 'exclude')::boolean is true then v_sql := format('not coalesce(%s, false)', v_sql); end if;
    v_parts := v_parts || v_sql;
  end loop;
  if v_q <> '' then
    if length(v_q) > 100 then raise exception 'search too long' using errcode = 'P0001', hint = 'filter'; end if;
    v_q := '%' || replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
    v_parts := v_parts || format('(r.business_name ilike %L or r.member_no ilike %L)', v_q, v_q);
  end if;
  if p_ids is not null then v_parts := v_parts || format('r.member_id = any(%L::uuid[])', p_ids::text); end if;
  if p_excluded is not null and cardinality(p_excluded) > 0 then
    v_parts := v_parts || format('not (r.member_id = any(%L::uuid[]))', p_excluded::text);
  end if;
  return array_to_string(v_parts, ' and ');
end $$;
revoke all on function private.biz_rule(jsonb), private.biz_where(jsonb, text, uuid[], uuid[]) from public, anon, authenticated;

create function private.biz_contact_access() returns boolean
  language sql stable set search_path = ''
  as $$ select private.staff_level('biz') >= 3 or private.staff_level('out') >= 2 $$;
revoke all on function private.biz_contact_access() from public, anon, authenticated;

-- ───────── reads ─────────
create function api.biz_search(p_def jsonb, p_q text, p_sort text, p_dir text, p_page int, p_size int) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  v_where text;
  v_total bigint;
  v_rows jsonb;
  v_sort text := case when p_sort in ('business_name','member_no','member_class','member_status','business_category','nature','city','district','valid_to','member_since','registration','consent') then p_sort else 'business_name' end;
  v_dir text := case when lower(coalesce(p_dir, '')) = 'desc' then 'desc' else 'asc' end;
  v_size int := least(greatest(coalesce(p_size, 25), 1), 100);
  v_page int := greatest(coalesce(p_page, 1), 1);
begin
  if private.staff_level('biz') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  v_where := private.biz_where(p_def, p_q);
  execute format('select count(*) from private.biz_rows r where %s', v_where) into v_total;
  execute format($q$
    select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select r.member_id, r.company_id, r.business_name, r.member_no, r.member_class, r.member_status, r.business_category,
             r.nature, r.registration, r.city, r.district, r.valid_to, r.rep_name, r.whatsapp_available, r.consent, r.opted_out,
             r.incomplete, r.tag_names
        from private.biz_rows r where %s
       order by %I %s nulls last, r.member_id
       limit %s offset %s) x $q$, v_where, v_sort, v_dir, v_size, (v_page - 1) * v_size) into v_rows;
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end $$;

-- the live audience count: everyone matching, and how many of them could be contacted
create function api.biz_count(p_def jsonb, p_q text) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare v_out jsonb;
begin
  if private.staff_level('biz') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  execute format($q$
    select jsonb_build_object(
      'total', count(*),
      'whatsapp', count(*) filter (where r.whatsapp_available),
      'consented', count(*) filter (where r.consent = 'granted'),
      'optedOut', count(*) filter (where r.opted_out),
      'eligible', count(*) filter (where r.consent = 'granted' and not r.opted_out))
    from private.biz_rows r where %s $q$, private.biz_where(p_def, p_q)) into v_out;
  return v_out;
end $$;

-- the values actually in use, for the filter builder
create function api.biz_facets() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare v_out jsonb;
begin
  if private.staff_level('biz') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  select jsonb_build_object(
    'nature', coalesce((select jsonb_agg(v order by v) from (select distinct nature v from private.biz_rows where nature is not null limit 200) a), '[]'::jsonb),
    'sector', coalesce((select jsonb_agg(v order by v) from (select distinct sector v from private.biz_rows where sector is not null limit 200) a), '[]'::jsonb),
    'city', coalesce((select jsonb_agg(v order by v) from (select distinct city v from private.biz_rows where city is not null limit 200) a), '[]'::jsonb),
    'district', coalesce((select jsonb_agg(v order by v) from (select distinct district v from private.biz_rows where district is not null limit 200) a), '[]'::jsonb),
    'tags', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name) order by t.name) from public.outreach_tags t), '[]'::jsonb)
  ) into v_out;
  return v_out;
end $$;

create function api.biz_profile(p_member uuid) returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  r private.biz_rows;
  c public.companies;
  v_contact boolean := private.biz_contact_access();
  v_out jsonb;
begin
  if private.staff_level('biz') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into r from private.biz_rows x where x.member_id = p_member;
  if r.member_id is null then return null; end if;
  select * into c from public.companies x where x.id = r.company_id;
  select to_jsonb(r) - 'tag_ids' || jsonb_build_object(
    'official', jsonb_build_object('nature_items', c.nature_items, 'established', c.established, 'sales_tax', c.sales_tax,
                                   'web', c.web, 'particulars', c.particulars),
    'can_see_contacts', v_contact,
    'contacts', case when v_contact then jsonb_build_object('address', c.address, 'tel', c.tel, 'email', c.email) end,
    'whatsapp', case when v_contact then (select jsonb_build_object('name', o.name, 'phone', o.phone) from public.outreach_contacts o where o.company_id = c.id) end,
    'outreach', (select jsonb_build_object('city', p.city, 'district', p.district, 'notes', p.notes, 'updated_at', p.updated_at)
                   from public.outreach_profiles p where p.company_id = c.id),
    'tags', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name) order by g.name)
                        from public.company_tags t join public.outreach_tags g on g.id = t.tag_id where t.company_id = c.id), '[]'::jsonb),
    'memberships', (select jsonb_agg(jsonb_build_object('member_no', m.member_no, 'class', m.class, 'status', private.public_member_status(m),
                                                        'since', m.since, 'valid_to', m.valid_to) order by m.since desc)
                      from public.members m where m.company_id = c.id),
    'history', coalesce((select jsonb_agg(h) from (
        select a.at, a.reason, a.old_value ->> 'status' as old_status, a.new_value ->> 'status' as new_status, a.action
          from public.audit_log a
         where a.object = 'members' and a.object_id = p_member::text and a.action in ('INSERT', 'UPDATE')
           and (a.action = 'INSERT' or a.old_value ->> 'status' is distinct from a.new_value ->> 'status'
                or a.old_value ->> 'valid_to' is distinct from a.new_value ->> 'valid_to')
         order by a.at desc limit 30) h), '[]'::jsonb),
    'consents', case when v_contact then coalesce((select jsonb_agg(h) from (
        select x.status, x.method, x.evidence, x.recorded_at, x.phone = o.phone as current_number
          from public.outreach_consents x left join public.outreach_contacts o on o.company_id = x.company_id
         where x.company_id = c.id order by x.id desc limit 30) h), '[]'::jsonb) end,
    'suppression', case when v_contact then (select jsonb_build_object('reason', s.reason, 'source', s.source, 'created_at', s.created_at)
                                               from public.outreach_suppressions s join public.outreach_contacts o on o.phone = s.phone
                                              where o.company_id = c.id and s.active) end
  ) into v_out;
  return v_out;
end $$;

-- possible duplicates to review; the matching value itself (NTN, number) is not shown
create function api.biz_duplicates() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
declare v_out jsonb;
begin
  if private.staff_level('biz') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  with base as (
    select r.member_id, r.member_no, r.business_name, c.ntn,
           regexp_replace(lower(r.business_name), '[^a-z0-9]', '', 'g') as norm, o.phone
      from private.biz_rows r join public.companies c on c.id = r.company_id
      left join public.outreach_contacts o on o.company_id = r.company_id),
  groups as (
    select 'name' as why, jsonb_agg(jsonb_build_object('member_id', member_id, 'member_no', member_no, 'business_name', business_name)) as rows
      from base where norm <> '' group by norm having count(*) > 1
    union all
    select 'ntn', jsonb_agg(jsonb_build_object('member_id', member_id, 'member_no', member_no, 'business_name', business_name))
      from base where nullif(btrim(ntn), '') is not null group by ntn having count(*) > 1
    union all
    select 'phone', jsonb_agg(jsonb_build_object('member_id', member_id, 'member_no', member_no, 'business_name', business_name))
      from base where phone is not null group by phone having count(*) > 1)
  select coalesce(jsonb_agg(g), '[]'::jsonb) into v_out from (select * from groups limit 100) g;
  return v_out;
end $$;

-- ───────── outreach details, tags (biz ≥ 2) ─────────
create function api.biz_meta_save(p_company uuid, p_city text, p_district text, p_notes text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('biz') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.companies c where c.id = p_company) then raise exception 'not found' using errcode = 'P0001', hint = 'fields'; end if;
  if length(coalesce(p_city, '')) > 80 or length(coalesce(p_district, '')) > 80 or length(coalesce(p_notes, '')) > 1000 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.set_reason('outreach details updated');
  insert into public.outreach_profiles (company_id, city, district, notes)
  values (p_company, nullif(btrim(p_city), ''), nullif(btrim(p_district), ''), nullif(btrim(p_notes), ''))
  on conflict (company_id) do update set city = excluded.city, district = excluded.district, notes = excluded.notes,
    updated_by = auth.uid(), updated_at = now();
end $$;

create function api.biz_tag_create(p_name text) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_id uuid;
begin
  if private.staff_level('biz') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 2 and 40 then raise exception 'check the fields' using errcode = 'P0001', hint = 'fields'; end if;
  if exists (select 1 from public.outreach_tags t where lower(t.name) = lower(btrim(p_name))) then
    raise exception 'exists' using errcode = 'P0001', hint = 'duplicate';
  end if;
  perform private.set_reason('internal tag created');
  insert into public.outreach_tags (name) values (btrim(p_name)) returning id into v_id;
  return v_id;
end $$;

create function api.biz_tag_set(p_company uuid, p_tag uuid, p_on boolean) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('biz') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  perform private.set_reason(case when p_on then 'internal tag added' else 'internal tag removed' end);
  if p_on then
    insert into public.company_tags (company_id, tag_id) values (p_company, p_tag) on conflict do nothing;
  else
    delete from public.company_tags where company_id = p_company and tag_id = p_tag;
  end if;
end $$;

-- ───────── contact, consent, suppression (out ≥ 2 or biz ≥ 3; lifting: out ≥ 3) ─────────
create function api.biz_contact_save(p_company uuid, p_name text, p_phone text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text := regexp_replace(coalesce(p_phone, ''), '[\s()-]', '', 'g');
begin
  if not private.biz_contact_access() then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.companies c where c.id = p_company) then raise exception 'not found' using errcode = 'P0001', hint = 'fields'; end if;
  if v_phone = '' then
    perform private.set_reason('WhatsApp contact removed');
    delete from public.outreach_contacts where company_id = p_company;
    return;
  end if;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' or length(coalesce(p_name, '')) > 120 then
    raise exception 'check the number' using errcode = 'P0001', hint = 'phone';
  end if;
  perform private.set_reason('WhatsApp contact saved');
  -- consent belongs to a number, so a new number starts with none recorded (the view looks at the current number)
  insert into public.outreach_contacts (company_id, name, phone) values (p_company, nullif(btrim(p_name), ''), v_phone)
  on conflict (company_id) do update set name = excluded.name, phone = excluded.phone, updated_by = auth.uid(), updated_at = now();
end $$;

create function api.biz_consent_record(p_company uuid, p_status text, p_method text, p_evidence text) returns void
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
  insert into public.outreach_consents (company_id, phone, status, method, evidence)
  values (p_company, v_phone, p_status, p_method, nullif(btrim(p_evidence), ''));
  if p_status = 'withdrawn' then
    insert into public.outreach_suppressions (phone, reason, source) values (v_phone, 'Consent withdrawn', 'staff')
    on conflict (phone) do update set active = true, reason = excluded.reason, source = excluded.source,
      created_by = auth.uid(), created_at = now(), lifted_by = null, lifted_at = null, lifted_reason = null;
  end if;
end $$;

create function api.biz_suppress(p_company uuid, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  if v_phone is null then raise exception 'no contact' using errcode = 'P0001', hint = 'nocontact'; end if;
  if length(btrim(coalesce(p_reason, ''))) not between 3 and 300 then raise exception 'reason' using errcode = 'P0001', hint = 'reason'; end if;
  perform private.set_reason('WhatsApp number suppressed');
  insert into public.outreach_suppressions (phone, reason, source) values (v_phone, btrim(p_reason), 'staff')
  on conflict (phone) do update set active = true, reason = excluded.reason, source = excluded.source,
    created_by = auth.uid(), created_at = now(), lifted_by = null, lifted_at = null, lifted_reason = null;
end $$;

create function api.biz_unsuppress(p_company uuid, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_phone text;
begin
  if private.staff_level('out') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  select o.phone into v_phone from public.outreach_contacts o where o.company_id = p_company;
  if v_phone is null then raise exception 'no contact' using errcode = 'P0001', hint = 'nocontact'; end if;
  if length(btrim(coalesce(p_reason, ''))) not between 3 and 300 then raise exception 'reason' using errcode = 'P0001', hint = 'reason'; end if;
  perform private.set_reason('WhatsApp suppression lifted');
  update public.outreach_suppressions set active = false, lifted_by = auth.uid(), lifted_at = now(), lifted_reason = btrim(p_reason)
   where phone = v_phone and active;
end $$;

-- ───────── segments (biz ≥ 2) ─────────
create function api.seg_save(p_id uuid, p_name text, p_description text, p_def jsonb) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_id uuid := p_id;
begin
  if private.staff_level('biz') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 2 and 80 or length(coalesce(p_description, '')) > 300 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  perform private.biz_where(p_def, null);        -- refuses a filter it cannot read
  if exists (select 1 from public.segments s where lower(s.name) = lower(btrim(p_name)) and s.id is distinct from p_id) then
    raise exception 'exists' using errcode = 'P0001', hint = 'duplicate';
  end if;
  perform private.set_reason('segment saved');
  if p_id is null then
    insert into public.segments (name, description, definition) values (btrim(p_name), nullif(btrim(p_description), ''), p_def) returning id into v_id;
  else
    update public.segments set name = btrim(p_name), description = nullif(btrim(p_description), ''), definition = p_def, updated_at = now() where id = p_id;
    if not found then raise exception 'not found' using errcode = 'P0001', hint = 'fields'; end if;
  end if;
  return v_id;
end $$;

create function api.seg_delete(p_id uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('biz') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  perform private.set_reason('segment deleted');
  delete from public.segments where id = p_id;
end $$;

-- ───────── exports ─────────
-- p_log false = preview: first 10 rows and the count, nothing recorded. Fields come from this fixed list only.
create function api.biz_export(p_def jsonb, p_q text, p_ids uuid[], p_excluded uuid[], p_fields text[], p_format text, p_reason text, p_log boolean)
  returns jsonb language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_plain constant text[] := array['business_name','member_no','member_class','member_status','business_category','nature','sector',
    'registration','city','district','rep_name','member_since','valid_to','consent','tags'];
  v_sensitive constant text[] := array['tel','email','whatsapp','address','ntn'];
  v_set jsonb := coalesce((select s.value from private.settings s where s.key = 'outreach'), '{}'::jsonb);
  v_level int := private.staff_level('biz');
  v_where text;
  v_total bigint;
  v_rows jsonb;
  v_is_sensitive boolean;
  v_exprs text;
  f text;
begin
  if v_level < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_fields is null or cardinality(p_fields) not between 1 and 20 or p_format not in ('csv', 'xlsx', 'pdf') then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  foreach f in array p_fields loop
    if not (f = any(v_plain) or f = any(v_sensitive)) then raise exception 'unknown field' using errcode = 'P0001', hint = 'fields'; end if;
  end loop;
  v_is_sensitive := p_fields && v_sensitive;
  if v_is_sensitive and v_level < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  if v_is_sensitive and length(btrim(coalesce(p_reason, ''))) not between 5 and 300 then
    raise exception 'reason' using errcode = 'P0001', hint = 'reason';
  end if;

  v_where := private.biz_where(p_def, p_q, p_ids, p_excluded);
  execute format('select count(*) from private.biz_rows r where %s', v_where) into v_total;
  if v_total > coalesce((v_set ->> 'exportMaxRows')::int, 5000) then raise exception 'too many' using errcode = 'P0001', hint = 'toomany'; end if;
  if p_log then
    if v_total > coalesce((v_set ->> 'exportApprovalRows')::int, 1000) and v_level < 3 then
      raise exception 'approval' using errcode = 'P0001', hint = 'approval';
    end if;
    if (select count(*) from public.export_log e where e.user_id = auth.uid() and e.at > now() - interval '1 hour') >= 30 then
      raise exception 'limited' using errcode = 'P0001', hint = 'limited';
    end if;
  end if;

  select string_agg(format('%s as %I', case x
      when 'tags' then 'array_to_string(r.tag_names, '', '')'
      when 'tel' then 'c.tel'
      when 'email' then 'c.email::text'
      when 'address' then 'c.address'
      when 'ntn' then 'c.ntn'
      when 'whatsapp' then 'o.phone'
      else format('r.%I', x) end, x), ', ') into v_exprs
    from unnest(p_fields) as x;
  execute format($q$
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
      select %s from private.biz_rows r
        join public.companies c on c.id = r.company_id
        left join public.outreach_contacts o on o.company_id = r.company_id
       where %s order by r.business_name, r.member_id %s) t $q$,
    v_exprs, v_where, case when p_log then '' else 'limit 10' end) into v_rows;

  if p_log then
    insert into public.export_log (format, filters, record_count, fields, sensitive, reason)
    values (p_format, jsonb_build_object('filter', coalesce(p_def, '{}'::jsonb), 'search', nullif(btrim(coalesce(p_q, '')), ''),
                                         'selected', cardinality(p_ids), 'excluded', cardinality(p_excluded)),
            v_total, p_fields, v_is_sensitive, nullif(btrim(coalesce(p_reason, '')), ''));
  end if;
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.biz_search(jsonb,text,text,text,integer,integer)', 'api.biz_count(jsonb,text)', 'api.biz_facets()',
                           'api.biz_profile(uuid)', 'api.biz_duplicates()', 'api.biz_meta_save(uuid,text,text,text)',
                           'api.biz_tag_create(text)', 'api.biz_tag_set(uuid,uuid,boolean)', 'api.biz_contact_save(uuid,text,text)',
                           'api.biz_consent_record(uuid,text,text,text)', 'api.biz_suppress(uuid,text)', 'api.biz_unsuppress(uuid,text)',
                           'api.seg_save(uuid,text,text,jsonb)', 'api.seg_delete(uuid)',
                           'api.biz_export(jsonb,text,uuid[],uuid[],text[],text,text,boolean)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
