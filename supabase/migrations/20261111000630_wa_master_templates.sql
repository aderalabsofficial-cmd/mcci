-- 0630 · Four MCCI master WhatsApp templates (owner, 3 Nov 2026; docs/30 §10).
--
-- One reusable template per campaign category, in English and Urdu, so staff fill in a subject and details instead of
-- creating a template each time. The wording lives here; the approval lives with Meta. IQPigeon's API only lists
-- templates (it cannot submit them), so each version is submitted in WhatsApp Manager and its status arrives through
-- the existing sync: a master version is sendable only when the provider lists it as APPROVED.
--
-- Variables carry structured content only: recipient values from MCCI's records, and short single-line campaign
-- fields with a fixed purpose and length (Meta refuses line breaks, tabs and long runs of spaces in parameters).
-- Free-form text goes only to recipients with an open 24-hour window, as before.

-- ───────── masters and their language versions ─────────
create table public.whatsapp_masters (
  key text primary key check (key in ('announcements', 'membership', 'events', 'opportunities')),
  name text not null unique check (name ~ '^[a-z0-9_]+$' and length(name) <= 512),   -- the template name on Meta
  meta_category text not null check (meta_category in ('MARKETING', 'UTILITY')),
  slots jsonb not null,            -- [{n, key, source: recipient|field, max?, required?, default_en?, default_ur?, example_en, example_ur}]
  sort int not null default 0,
  updated_by uuid references public.profiles on delete set null,
  updated_at timestamptz not null default now()
);

create table public.whatsapp_master_versions (
  master_key text not null references public.whatsapp_masters on delete cascade,
  language text not null check (language in ('en', 'ur')),
  version int not null default 1 check (version >= 1),
  header text not null check (length(header) between 1 and 60 and header !~ '\{\{'),
  body text not null check (length(body) between 1 and 1024),
  footer text check (length(footer) <= 60 and footer !~ '\{\{'),
  updated_by uuid references public.profiles on delete set null,
  updated_at timestamptz not null default now(),
  primary key (master_key, language)
);

alter table public.whatsapp_masters enable row level security;
alter table public.whatsapp_master_versions enable row level security;
revoke all on public.whatsapp_masters, public.whatsapp_master_versions from public, anon, authenticated;
grant select on public.whatsapp_masters, public.whatsapp_master_versions to authenticated;
create policy wa_masters_select on public.whatsapp_masters for select to authenticated using ((select private.staff_level('out')) >= 1);
create policy wa_master_versions_select on public.whatsapp_master_versions for select to authenticated using ((select private.staff_level('out')) >= 1);
create trigger audit_row after insert or update or delete on public.whatsapp_masters for each row execute function private.audit_row();
create trigger audit_row after insert or update or delete on public.whatsapp_master_versions for each row execute function private.audit_row();

-- campaigns remember the master, the language staff chose and the fields they filled in; a mixed campaign fixes
-- each recipient's message type in the snapshot
alter table public.whatsapp_campaigns
  add column master_key text references public.whatsapp_masters on delete set null,
  add column language text check (language in ('en', 'ur')),
  add column fields jsonb not null default '{}'::jsonb;
alter table public.whatsapp_campaigns drop constraint whatsapp_campaigns_message_kind_check;
alter table public.whatsapp_campaigns add constraint whatsapp_campaigns_message_kind_check check (message_kind in ('template', 'text', 'mixed'));
alter table public.whatsapp_campaign_recipients add column kind text check (kind in ('template', 'text'));

-- ───────── the four masters (TODO(MCCI): wording for the Secretary General's review before submission) ─────────
insert into public.whatsapp_masters (key, name, meta_category, sort, slots) values
('announcements', 'mcci_official_announcement', 'MARKETING', 1, $j$[
  {"n":1,"key":"contact_person","source":"recipient","example_en":"Ahmed Raza","example_ur":"احمد رضا"},
  {"n":2,"key":"business_name","source":"recipient","example_en":"Raza Textiles","example_ur":"رضا ٹیکسٹائلز"},
  {"n":3,"key":"subject","source":"field","max":80,"required":true,"example_en":"Revised office timings","example_ur":"دفتری اوقات میں تبدیلی"},
  {"n":4,"key":"summary","source":"field","max":500,"required":true,"example_en":"From 1 December the Secretariat is open 9:00 am to 4:00 pm, Monday to Friday.","example_ur":"یکم دسمبر سے سیکرٹریٹ پیر تا جمعہ صبح 9 سے شام 4 بجے تک کھلا رہے گا۔"},
  {"n":5,"key":"link","source":"field","max":200,"required":true,"example_en":"https://app.mcci.aderalabs.tech/news","example_ur":"https://app.mcci.aderalabs.tech/ur/news"}]$j$::jsonb),
('membership', 'mcci_membership_update', 'UTILITY', 2, $j$[
  {"n":1,"key":"contact_person","source":"recipient","example_en":"Ahmed Raza","example_ur":"احمد رضا"},
  {"n":2,"key":"business_name","source":"recipient","example_en":"Raza Textiles","example_ur":"رضا ٹیکسٹائلز"},
  {"n":3,"key":"membership_number","source":"recipient","example_en":"MCCI-C-1134","example_ur":"MCCI-C-1134"},
  {"n":4,"key":"subject","source":"field","max":80,"required":true,"example_en":"Membership renewal for 2027","example_ur":"سال 2027 کے لیے رکنیت کی تجدید"},
  {"n":5,"key":"details","source":"field","max":500,"required":true,"example_en":"Your annual subscription is due. The payment voucher is in your member portal.","example_ur":"آپ کی سالانہ فیس واجب الادا ہے۔ ادائیگی واؤچر آپ کے ممبر پورٹل میں موجود ہے۔"},
  {"n":6,"key":"deadline","source":"field","max":40,"required":false,"default_en":"None","default_ur":"کوئی نہیں","example_en":"By 31 December 2026","example_ur":"31 دسمبر 2026 تک"},
  {"n":7,"key":"link","source":"field","max":200,"required":true,"example_en":"https://app.mcci.aderalabs.tech/portal","example_ur":"https://app.mcci.aderalabs.tech/ur/portal"}]$j$::jsonb),
('events', 'mcci_event_invitation', 'MARKETING', 3, $j$[
  {"n":1,"key":"contact_person","source":"recipient","example_en":"Ahmed Raza","example_ur":"احمد رضا"},
  {"n":2,"key":"business_name","source":"recipient","example_en":"Raza Textiles","example_ur":"رضا ٹیکسٹائلز"},
  {"n":3,"key":"event_name","source":"field","max":80,"required":true,"example_en":"Seminar on export financing","example_ur":"برآمدی فنانسنگ پر سیمینار"},
  {"n":4,"key":"event_date","source":"field","max":40,"required":true,"example_en":"Monday, 15 December 2026","example_ur":"پیر، 15 دسمبر 2026"},
  {"n":5,"key":"event_time","source":"field","max":40,"required":true,"example_en":"11:00 am","example_ur":"صبح 11 بجے"},
  {"n":6,"key":"event_venue","source":"field","max":120,"required":true,"example_en":"MCCI Auditorium, Multan","example_ur":"ایم سی سی آئی آڈیٹوریم، ملتان"},
  {"n":7,"key":"deadline","source":"field","max":40,"required":true,"example_en":"12 December 2026","example_ur":"12 دسمبر 2026"},
  {"n":8,"key":"link","source":"field","max":200,"required":true,"example_en":"https://app.mcci.aderalabs.tech/portal/events","example_ur":"https://app.mcci.aderalabs.tech/ur/portal/events"}]$j$::jsonb),
('opportunities', 'mcci_business_opportunity', 'MARKETING', 4, $j$[
  {"n":1,"key":"contact_person","source":"recipient","example_en":"Ahmed Raza","example_ur":"احمد رضا"},
  {"n":2,"key":"business_name","source":"recipient","example_en":"Raza Textiles","example_ur":"رضا ٹیکسٹائلز"},
  {"n":3,"key":"opportunity_title","source":"field","max":80,"required":true,"example_en":"Trade delegation to Guangzhou","example_ur":"گوانگژو کے لیے تجارتی وفد"},
  {"n":4,"key":"sector","source":"field","max":60,"required":true,"example_en":"Textiles and garments","example_ur":"ٹیکسٹائل اور گارمنٹس"},
  {"n":5,"key":"summary","source":"field","max":500,"required":true,"example_en":"Members can join the delegation to the Canton Fair; travel and visa support through MCCI.","example_ur":"اراکین کینٹن فیئر کے وفد میں شامل ہو سکتے ہیں؛ سفر اور ویزا میں ایم سی سی آئی مدد کرے گا۔"},
  {"n":6,"key":"deadline","source":"field","max":40,"required":true,"example_en":"20 December 2026","example_ur":"20 دسمبر 2026"},
  {"n":7,"key":"link","source":"field","max":200,"required":true,"example_en":"https://app.mcci.aderalabs.tech/portal/opportunities","example_ur":"https://app.mcci.aderalabs.tech/ur/portal/opportunities"}]$j$::jsonb);

insert into public.whatsapp_master_versions (master_key, language, header, body, footer) values
('announcements', 'en', 'MCCI Official Announcement',
 E'Dear {{1}},\n\nThe Multan Chamber of Commerce & Industry issues the following announcement for {{2}}.\n\nSubject: {{3}}\nSummary: {{4}}\n\nThe full text is available at {{5}} and at the Secretariat.\n\nWith regards,\nSecretariat, Multan Chamber of Commerce & Industry',
 'Reply STOP to stop these messages'),
('announcements', 'ur', 'ایم سی سی آئی کا سرکاری اعلان',
 E'محترم {{1}}،\n\nایوانِ تجارت و صنعت ملتان {{2}} کے لیے درج ذیل اعلان جاری کر رہا ہے۔\n\nموضوع: {{3}}\nخلاصہ: {{4}}\n\nمکمل متن {{5}} پر اور سیکرٹریٹ میں دستیاب ہے۔\n\nنیک تمناؤں کے ساتھ،\nسیکرٹریٹ، ایوانِ تجارت و صنعت ملتان',
 'پیغامات بند کرنے کے لیے STOP لکھ کر بھیجیں'),
('membership', 'en', 'MCCI Membership Update',
 E'Dear {{1}},\n\nThis is an update on the membership of {{2}} (Membership No. {{3}}) with the Multan Chamber of Commerce & Industry.\n\nSubject: {{4}}\nDetails: {{5}}\nAction needed: {{6}}\n\nFor details, please visit {{7}} or contact the Membership Section.\n\nMembership Section, Multan Chamber of Commerce & Industry',
 'Multan Chamber of Commerce & Industry'),
('membership', 'ur', 'ایم سی سی آئی رکنیت کی اطلاع',
 E'محترم {{1}}،\n\nایوانِ تجارت و صنعت ملتان میں {{2}} (رکنیت نمبر {{3}}) کی رکنیت کے بارے میں اطلاع:\n\nموضوع: {{4}}\nتفصیل: {{5}}\nمطلوبہ کارروائی: {{6}}\n\nمزید تفصیل کے لیے {{7}} دیکھیں یا ممبرشپ سیکشن سے رابطہ کریں۔\n\nممبرشپ سیکشن، ایوانِ تجارت و صنعت ملتان',
 'ایوانِ تجارت و صنعت ملتان'),
('events', 'en', 'MCCI Invitation',
 E'Dear {{1}},\n\nThe Multan Chamber of Commerce & Industry is pleased to invite {{2}} to the following:\n\nEvent: {{3}}\nDate: {{4}}\nTime: {{5}}\nVenue: {{6}}\n\nKindly confirm your participation by {{7}} at {{8}}\n\nWith regards,\nSecretariat, Multan Chamber of Commerce & Industry',
 'Reply STOP to stop these messages'),
('events', 'ur', 'ایم سی سی آئی دعوت نامہ',
 E'محترم {{1}}،\n\nایوانِ تجارت و صنعت ملتان {{2}} کو درج ذیل تقریب میں شرکت کی دعوت دیتا ہے:\n\nتقریب: {{3}}\nتاریخ: {{4}}\nوقت: {{5}}\nمقام: {{6}}\n\nبراہِ کرم {{7}} تک اپنی شرکت کی تصدیق {{8}} پر کریں۔\n\nنیک تمناؤں کے ساتھ،\nسیکرٹریٹ، ایوانِ تجارت و صنعت ملتان',
 'پیغامات بند کرنے کے لیے STOP لکھ کر بھیجیں'),
('opportunities', 'en', 'MCCI Business Opportunity',
 E'Dear {{1}},\n\nThe Multan Chamber of Commerce & Industry shares an opportunity that may interest {{2}}.\n\nOpportunity: {{3}}\nSector: {{4}}\nSummary: {{5}}\nLast date: {{6}}\n\nDetails and registration: {{7}}\n\nWith regards,\nSecretariat, Multan Chamber of Commerce & Industry',
 'Reply STOP to stop these messages'),
('opportunities', 'ur', 'ایم سی سی آئی کاروباری موقع',
 E'محترم {{1}}،\n\nایوانِ تجارت و صنعت ملتان ایک ایسا موقع پیش کر رہا ہے جو {{2}} کے لیے مفید ہو سکتا ہے۔\n\nموقع: {{3}}\nشعبہ: {{4}}\nخلاصہ: {{5}}\nآخری تاریخ: {{6}}\n\nتفصیل اور رجسٹریشن: {{7}}\n\nنیک تمناؤں کے ساتھ،\nسیکرٹریٹ، ایوانِ تجارت و صنعت ملتان',
 'پیغامات بند کرنے کے لیے STOP لکھ کر بھیجیں');

-- ───────── helpers ─────────
-- {{n}} filled from the values its slot names; used for the stored copy of what was sent and for previews
create function private.wa_fill(p_body text, p_var_map jsonb, p_values jsonb) returns text
  language plpgsql immutable set search_path = ''
  as $$
declare
  v_out text := coalesce(p_body, '');
  k text;
begin
  for k in select jsonb_object_keys(coalesce(p_var_map, '{}'::jsonb)) loop
    v_out := replace(v_out, '{{' || k || '}}', coalesce(p_values ->> (p_var_map ->> k), ''));
  end loop;
  return v_out;
end $$;

-- keeps the provider's copy of each master version in step with MCCI's wording; never touches the approval status
create function private.wa_master_apply() returns void
  language plpgsql volatile set search_path = ''
  as $$
begin
  insert into public.whatsapp_templates (name, language, category, status, header_type, header, body, footer, var_map)
  select m.name, v.language, m.meta_category, 'LOCAL', 'text', v.header, v.body, v.footer,
         (select jsonb_object_agg(s ->> 'n', s ->> 'key') from jsonb_array_elements(m.slots) s)
    from public.whatsapp_masters m join public.whatsapp_master_versions v on v.master_key = m.key
  on conflict (name, language) do update set header_type = 'text', header = excluded.header, body = excluded.body,
    footer = excluded.footer, var_map = excluded.var_map, updated_at = now();
end $$;

-- the campaign fields a master accepts, cleaned; a bad one raises with the field's key as hint
create function private.wa_master_fields(p_key text, p_language text, p_fields jsonb) returns jsonb
  language plpgsql stable set search_path = ''
  as $$
declare
  s jsonb;
  v text;
  v_out jsonb := '{}'::jsonb;
begin
  for s in select x from public.whatsapp_masters m, jsonb_array_elements(m.slots) x where m.key = p_key and x ->> 'source' = 'field' loop
    v := btrim(coalesce(p_fields ->> (s ->> 'key'), ''));
    if v = '' then v := coalesce(s ->> ('default_' || p_language), ''); end if;
    if v = '' and coalesce((s ->> 'required')::boolean, true) then
      raise exception 'missing field' using errcode = 'P0001', hint = 'field_' || (s ->> 'key');
    end if;
    -- Meta refuses line breaks, tabs and more than four spaces in a row inside a parameter
    if length(v) > (s ->> 'max')::int or v ~ '[\n\r\t]' or v ~ '     ' or v ~ '\{\{' then
      raise exception 'bad field' using errcode = 'P0001', hint = 'field_' || (s ->> 'key');
    end if;
    if s ->> 'key' = 'link' and v !~ '^https://[^\s]{4,200}$' then
      raise exception 'bad link' using errcode = 'P0001', hint = 'field_link';
    end if;
    v_out := v_out || jsonb_build_object(s ->> 'key', v);
  end loop;
  return v_out;
end $$;

-- ───────── staff: the masters ─────────
create function api.wa_masters() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 1 then raise exception 'not allowed' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'key', m.key, 'name', m.name, 'metaCategory', m.meta_category, 'slots', m.slots,
      'versions', (select jsonb_agg(jsonb_build_object(
          'language', v.language, 'version', v.version, 'header', v.header, 'body', v.body, 'footer', v.footer, 'updatedAt', v.updated_at,
          'templateId', t.id, 'status', coalesce(t.status, 'LOCAL'), 'providerCategory', t.category, 'syncedAt', t.synced_at,
          'locked', coalesce(t.status, 'LOCAL') in ('APPROVED', 'PENDING', 'IN_APPEAL'))
        order by v.language)
        from public.whatsapp_master_versions v
        left join public.whatsapp_templates t on t.name = m.name and t.language = v.language
       where v.master_key = m.key))
    order by m.sort) from public.whatsapp_masters m), '[]'::jsonb);
end $$;

-- authorised administrators (Approve level) edit a version's wording. Approved or pending wording is what Meta holds:
-- it cannot change here, so a change to it is a new submission, not an edit.
create function api.wa_master_save(p_key text, p_language text, p_header text, p_body text, p_footer text) returns int
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.whatsapp_masters;
  v_status text;
  v_n int;
  v_found int[];
  v_version int;
begin
  if private.staff_level('out') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into m from public.whatsapp_masters x where x.key = p_key;
  if m.key is null or p_language not in ('en', 'ur') then raise exception 'not found' using errcode = 'P0001', hint = 'fields'; end if;
  select t.status into v_status from public.whatsapp_templates t where t.name = m.name and t.language = p_language;
  if v_status in ('APPROVED', 'PENDING', 'IN_APPEAL') then raise exception 'locked' using errcode = 'P0001', hint = 'locked'; end if;
  v_n := jsonb_array_length(m.slots);
  select array_agg(distinct x[1]::int order by x[1]::int) into v_found from regexp_matches(coalesce(p_body, ''), '\{\{([0-9]+)\}\}', 'g') x;
  -- every slot exactly once in order of numbers, no others; never a variable first or last (Meta's rules)
  if length(btrim(coalesce(p_header, ''))) not between 1 and 60 or coalesce(p_header, '') ~ '\{\{'
     or length(btrim(coalesce(p_body, ''))) not between 1 and 1024 or length(coalesce(p_footer, '')) > 60 or coalesce(p_footer, '') ~ '\{\{'
     or v_found is distinct from (select array_agg(g order by g) from generate_series(1, v_n) g)
     or (select count(*) from regexp_matches(p_body, '\{\{[0-9]+\}\}', 'g')) <> v_n
     or btrim(p_body) ~ '^\{\{' or btrim(p_body) ~ '\}\}$' or p_body ~ '\}\}\s*\{\{' then
    raise exception 'check the wording' using errcode = 'P0001', hint = 'wording';
  end if;
  perform private.set_reason('master template wording changed');
  update public.whatsapp_master_versions set header = btrim(p_header), body = btrim(p_body), footer = nullif(btrim(coalesce(p_footer, '')), ''),
    version = version + 1, updated_by = auth.uid(), updated_at = now()
   where master_key = p_key and language = p_language returning version into v_version;
  perform private.wa_master_apply();
  return v_version;
end $$;

-- ───────── staff: the audience in five groups ─────────
-- Nobody is left out silently: every business in the selection lands in exactly one group.
create function api.wa_audience_breakdown(p_def jsonb, p_q text, p_ids uuid[], p_excluded uuid[], p_category text) returns jsonb
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
      select distinct on (r.company_id) r.company_id, r.member_id, r.business_name, r.member_no, o.phone,
             private.wa_block(r.company_id, o.phone, %L, 'session', null) as block
        from private.biz_rows r left join public.outreach_contacts o on o.company_id = r.company_id where %s
       order by r.company_id, r.valid_to desc),
    g as (select a.*, case when block is null then 'free_text' when block = 'window_closed' then 'template_required'
                           when block = 'suppressed' then 'opted_out' when block in ('no_consent', 'category') then 'no_consent'
                           else 'invalid' end as grp from a)
    select jsonb_build_object('total', (select count(*) from g),
      'groups', jsonb_build_object(
        'free_text', (select count(*) from g where grp = 'free_text'),
        'template_required', (select count(*) from g where grp = 'template_required'),
        'no_consent', (select count(*) from g where grp = 'no_consent'),
        'opted_out', (select count(*) from g where grp = 'opted_out'),
        'invalid', (select count(*) from g where grp = 'invalid')),
      'rows', coalesce((select jsonb_agg(jsonb_build_object('member_id', member_id, 'name', business_name, 'member_no', member_no, 'phone', phone,
                         'group', grp, 'block', block, 'values', private.wa_values(company_id)) order by grp, business_name)
                         from (select * from g order by grp, business_name limit 50) x), '[]'::jsonb))
    $q$, p_category, v_where) into v_out;
  return v_out;
end $$;

-- ───────── staff: a campaign from a master ─────────
-- p_mixed: the operator has reviewed both groups and chosen free text (p_body) for those with an open window and the
-- master template for the rest. Without it everyone who may receive it gets the template.
create function api.wa_campaign_create_master(p_name text, p_purpose text, p_mode text, p_master text, p_language text, p_fields jsonb,
                                              p_mixed boolean, p_body text, p_segment uuid, p_def jsonb, p_q text, p_ids uuid[], p_excluded uuid[]) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  m public.whatsapp_masters;
  t public.whatsapp_templates;
  v_fields jsonb;
  v_id uuid;
  v_total bigint;
  v_where text;
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into m from public.whatsapp_masters x where x.key = p_master;
  if m.key is null or p_language not in ('en', 'ur') or length(btrim(coalesce(p_name, ''))) not between 2 and 120 or p_mode not in ('campaign', 'selective')
     or (coalesce(p_mixed, false) and length(btrim(coalesce(p_body, ''))) not between 1 and 4096) then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  select * into t from public.whatsapp_templates x where x.name = m.name and x.language = p_language;
  -- a local master is not a WhatsApp template: nothing is prepared until Meta has approved this language version
  if t.id is null or t.status is distinct from 'APPROVED' then raise exception 'not approved' using errcode = 'P0001', hint = 'not_approved'; end if;
  v_fields := private.wa_master_fields(m.key, p_language, p_fields);
  v_where := private.biz_where(p_def, p_q, p_ids, p_excluded);
  execute format('select count(*) from private.biz_rows r where %s', v_where) into v_total;
  if v_total = 0 then raise exception 'no one' using errcode = 'P0001', hint = 'empty'; end if;
  if v_total > coalesce(private.wa_setting('maxCampaign')::int, 1000) then raise exception 'too many' using errcode = 'P0001', hint = 'toomany'; end if;
  perform private.set_reason('WhatsApp campaign created from a master template');
  insert into public.whatsapp_campaigns (name, purpose, mode, category, message_kind, template_id, body, segment_id, filter, master_key, language, fields)
  values (btrim(p_name), nullif(btrim(p_purpose), ''), p_mode, m.key, case when coalesce(p_mixed, false) then 'mixed' else 'template' end, t.id,
          case when coalesce(p_mixed, false) then btrim(p_body) end, p_segment,
          jsonb_build_object('filter', coalesce(p_def, '{}'::jsonb), 'search', nullif(btrim(coalesce(p_q, '')), ''), 'selected', cardinality(p_ids), 'excluded', cardinality(p_excluded)),
          m.key, p_language, v_fields)
  returning id into v_id;
  -- the snapshot: each recipient's message type and, for those who may not receive it, the reason
  execute format($q$
    insert into public.whatsapp_campaign_recipients (campaign_id, company_id, member_no, business_name, phone, kind, status, reason)
    select %L::uuid, x.company_id, x.member_no, x.business_name, x.phone, x.kind,
           case when x.block is null then 'pending' else 'skipped' end, x.block
      from (select distinct on (r.company_id) r.company_id, r.member_no, r.business_name, o.phone,
                   k.kind, private.wa_block(r.company_id, o.phone, %L, case k.kind when 'text' then 'session' else 'template' end, %L::uuid) as block
              from private.biz_rows r left join public.outreach_contacts o on o.company_id = r.company_id
              cross join lateral (select case when %L::boolean and private.wa_window_open(o.phone) then 'text' else 'template' end as kind) k
             where %s order by r.company_id, r.valid_to desc) x
    $q$, v_id, m.key, t.id, coalesce(p_mixed, false), v_where);
  return v_id;
end $$;

-- ───────── dispatch: per-recipient type, campaign fields, the chosen language ─────────
do $$
declare
  v text := pg_get_functiondef('api.wa_claim(int)'::regprocedure);
  pairs text[][] := array[
    array['v_lang text;', E'v_lang text;\n  v_kind text;'],
    array[E'    t := null;\n    if c.message_kind = ''template'' then',
          E'    t := null;\n    v_kind := case when c.message_kind = ''mixed'' then coalesce(r.kind, ''template'') else c.message_kind end;\n    if v_kind = ''template'' then'],
    array['if v_lang is not null and v_lang <> t.language then', 'if v_lang is not null and v_lang <> t.language and c.master_key is null then'],
    array['v_block := private.wa_block(r.company_id, r.phone, c.category, case when c.message_kind = ''template'' then ''template'' else ''session'' end, t.id);',
          'v_block := private.wa_block(r.company_id, r.phone, c.category, case when v_kind = ''template'' then ''template'' else ''session'' end, t.id);'],
    array[E'if v_block is null and c.message_kind = ''template'' then\n      v_payload := private.wa_template_payload(t, v_values);',
          E'if v_block is null and v_kind = ''template'' then\n      v_payload := private.wa_template_payload(t, v_values || coalesce(c.fields, ''{}''::jsonb));'],
    array['v_body := case when c.message_kind = ''template'' then t.body else private.wa_render(c.body, v_values) end;',
          'v_body := case when v_kind = ''template'' then private.wa_fill(t.body, t.var_map, v_values || coalesce(c.fields, ''{}''::jsonb)) else private.wa_render(c.body, v_values) end;'],
    array['''outbound'', r.phone, c.message_kind,', '''outbound'', r.phone, v_kind,'],
    array['''kind'', c.message_kind,', '''kind'', v_kind,']];
  i int;
begin
  for i in 1 .. array_length(pairs, 1) loop
    if position(pairs[i][1] in v) = 0 then raise exception 'wa_claim patch % not found', i; end if;
    v := replace(v, pairs[i][1], pairs[i][2]);
  end loop;
  execute v;
  -- after every sync the masters' wording is attached to the provider's rows again (status untouched)
  v := pg_get_functiondef('api.wa_templates_sync(jsonb)'::regprocedure);
  if position('  return v_n;' in v) = 0 then raise exception 'wa_templates_sync patch not found'; end if;
  execute replace(v, '  return v_n;', E'  perform private.wa_master_apply();\n  return v_n;');
  -- a master's provider row takes its wording and variables from the master only (api.wa_master_save)
  v := pg_get_functiondef('api.wa_template_save(uuid, text, text, text, text, jsonb)'::regprocedure);
  if position('perform private.set_reason(''template wording recorded'');' in v) = 0 then raise exception 'wa_template_save patch not found'; end if;
  execute replace(v, 'perform private.set_reason(''template wording recorded'');',
    E'if exists (select 1 from public.whatsapp_templates t join public.whatsapp_masters m on m.name = t.name where t.id = p_id) then\n    raise exception ''master'' using errcode = ''P0001'', hint = ''locked'';\n  end if;\n  perform private.set_reason(''template wording recorded'');');
end $$;

select private.wa_master_apply();

-- ───────── grants ─────────
revoke all on function private.wa_fill(text, jsonb, jsonb), private.wa_master_apply(), private.wa_master_fields(text, text, jsonb) from public, anon, authenticated;
revoke all on function api.wa_masters(), api.wa_master_save(text, text, text, text, text), api.wa_audience_breakdown(jsonb, text, uuid[], uuid[], text),
  api.wa_campaign_create_master(text, text, text, text, text, jsonb, boolean, text, uuid, jsonb, text, uuid[], uuid[]) from public, anon, service_role;
grant execute on function api.wa_masters(), api.wa_master_save(text, text, text, text, text), api.wa_audience_breakdown(jsonb, text, uuid[], uuid[], text),
  api.wa_campaign_create_master(text, text, text, text, text, jsonb, boolean, text, uuid, jsonb, text, uuid[], uuid[]) to authenticated;
