-- WhatsApp master templates (0630): seeds, wording rules, approval gate, fields, audience groups, mixed snapshots,
-- dispatch with campaign fields, and the provider sync never taking the wording or faking an approval.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(34);

update private.settings set value = value || '{"sendingEnabled":true,"consentOpen":true,"approvalThreshold":100,"ratePerMinute":100,"dailyLimit":100}'::jsonb where key = 'whatsapp';

create temp table t on commit drop as
  select x.company_id as c1, x.member_id as m1, y.company_id as c2, y.member_id as m2
    from (select m.company_id, m.id as member_id from public.members m join public.companies c on c.id = m.company_id where not c.demo order by m.member_no limit 1) x,
         (select m.company_id, m.id as member_id from public.members m join public.companies c on c.id = m.company_id where not c.demo order by m.member_no desc limit 1) y;
grant select on t to authenticated, service_role;
insert into public.outreach_contacts (company_id, name, phone) select c1, 'Ayesha Khan', '+923001110101' from t;
insert into public.outreach_contacts (company_id, name, phone) select c2, 'Bilal Ahmed', '+923001110102' from t;
create function pg_temp.sg(q text) returns void language sql as $$ select tests.exec_as(tests.id('sg'), q) $$;
create function pg_temp.svc(q text) returns bigint language sql as $$ select tests.num_as(null, q, 'service_role') $$;
create function pg_temp.fields() returns text language sql as
  $$ select '{"subject":"Revised office timings","summary":"Open 9 to 4 from 1 December.","link":"https://example.org/news"}' $$;

-- ── seeds
select is((select count(*) from public.whatsapp_masters), 4::bigint, 'four masters');
select is((select count(*) from public.whatsapp_master_versions), 8::bigint, 'each in English and Urdu');
select is((select meta_category from public.whatsapp_masters where key = 'membership'), 'UTILITY', 'membership updates are Utility');
select is((select count(*) from public.whatsapp_masters where meta_category = 'MARKETING'), 3::bigint, 'the other three are Marketing, not forced into Utility');
select is((select count(*) from public.whatsapp_templates t join public.whatsapp_masters m on m.name = t.name where t.status = 'LOCAL'), 8::bigint,
  'every version starts as not submitted: nothing pretends to be approved');
select is((select count(*) from public.whatsapp_master_versions v join public.whatsapp_masters m on m.key = v.master_key
            where (select count(distinct x[1]) from regexp_matches(v.body, '\{\{([0-9]+)\}\}', 'g') x) <> jsonb_array_length(m.slots)), 0::bigint,
  'every version uses each of its variables');

-- ── who may do what
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.wa_masters()') $$, '42501', null, 'a member cannot read the masters');
select is(tests.num_as(tests.id('president'), 'select jsonb_array_length(api.wa_masters())::bigint'), 4::bigint, 'view-only staff read them');
select throws_ok($$ select tests.exec_as(tests.id('president'), 'select api.wa_master_save(''announcements'', ''en'', ''H'', ''x'', null)') $$, '42501', null, 'view-only staff cannot edit');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.wa_master_save(''announcements'', ''en'', ''H'', ''x'', null)') $$, '42501', null, 'Send level cannot edit wording');

-- ── wording rules
select throws_ok($$ select pg_temp.sg('select api.wa_master_save(''announcements'', ''en'', ''Notice'', ''{{1}} hello {{2}} {{3}} {{4}} and {{5}} end'', null)') $$, 'P0001', null, 'a variable may not start the body');
select throws_ok($$ select pg_temp.sg('select api.wa_master_save(''announcements'', ''en'', ''Notice'', ''Dear {{1}}, {{2}} end'', null)') $$, 'P0001', null, 'every variable must be used');
select throws_ok($$ select pg_temp.sg('select api.wa_master_save(''announcements'', ''en'', ''Notice'', ''Dear {{1}} {{2}}, {{3}} {{4}} {{5}} {{6}} end'', null)') $$, 'P0001', null, 'no variable beyond the slots');
select lives_ok($$ select pg_temp.sg('select api.wa_master_save(''announcements'', ''en'', ''MCCI Official Announcement'', ''Dear {{1}}, for {{2}}. Subject: {{3}}. Summary: {{4}}. See {{5}} at the Secretariat.'', ''Reply STOP to stop these messages'')') $$,
  'valid wording is saved');
select is((select version from public.whatsapp_master_versions where master_key = 'announcements' and language = 'en'), 2, 'as a new version');
select is((select body from public.whatsapp_templates where name = 'mcci_official_announcement' and language = 'en'),
  'Dear {{1}}, for {{2}}. Subject: {{3}}. Summary: {{4}}. See {{5}} at the Secretariat.', 'the provider row follows the master');
select throws_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_template_save(%L, ''text'', ''x'', ''Dear {{1}}'', null, ''{"1":"business_name"}'')',
  (select id from public.whatsapp_templates where name = 'mcci_official_announcement' and language = 'en'))), 'P0001', null, 'the generic editor cannot touch a master');

-- ── the approval gate
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_campaign_create_master(''A1'', '''', ''selective'', ''announcements'', ''en'', %L, false, null, null, ''{}'', '''', array[%L, %L]::uuid[], null)',
  pg_temp.fields(), (select m1 from t), (select m2 from t))), 'P0001', null, 'a version Meta has not approved cannot become a campaign');
select pg_temp.sg($$select api.wa_templates_sync('[{"name":"mcci_official_announcement","language":"en","status":"APPROVED","category":"MARKETING","id":"tpl-1"}]')$$);
select is((select status from public.whatsapp_templates where name = 'mcci_official_announcement' and language = 'en'), 'APPROVED', 'approval comes from the provider list');
select is((select body from public.whatsapp_templates where name = 'mcci_official_announcement' and language = 'en'),
  'Dear {{1}}, for {{2}}. Subject: {{3}}. Summary: {{4}}. See {{5}} at the Secretariat.', 'the sync keeps MCCI''s wording');
select is((select status from public.whatsapp_templates where name = 'mcci_official_announcement' and language = 'ur'), 'NOT_ON_PROVIDER', 'the Urdu version is not approved by the English one');
select throws_ok($$ select pg_temp.sg('select api.wa_master_save(''announcements'', ''en'', ''H'', ''Dear {{1}}, {{2}} {{3}} {{4}} see {{5}} end'', null)') $$, 'P0001', null, 'approved wording is locked');

-- ── fields
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_campaign_create_master(''A1'', '''', ''selective'', ''announcements'', ''en'', %L, false, null, null, ''{}'', '''', array[%L]::uuid[], null)',
  '{"subject":"Line one\nline two","summary":"x","link":"https://example.org"}', (select m1 from t))), 'P0001', null, 'a line break in a field is refused (Meta rule)');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_campaign_create_master(''A1'', '''', ''selective'', ''announcements'', ''en'', %L, false, null, null, ''{}'', '''', array[%L]::uuid[], null)',
  '{"subject":"S","summary":"x","link":"http://example.org"}', (select m1 from t))), 'P0001', null, 'a link must be https');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_campaign_create_master(''A1'', '''', ''selective'', ''announcements'', ''en'', %L, false, null, null, ''{}'', '''', array[%L]::uuid[], null)',
  '{"summary":"x","link":"https://example.org"}', (select m1 from t))), 'P0001', null, 'a required field cannot be left empty');

-- ── audience groups: c1 consented with an open conversation, c2 consented without one
select pg_temp.sg(format('select api.wa_consent_record(%L, ''granted'', ''written'', ''Form 1'', array[''announcements''], true)', (select c1 from t)));
select pg_temp.sg(format('select api.wa_consent_record(%L, ''granted'', ''written'', ''Form 2'', array[''announcements''], true)', (select c2 from t)));
insert into public.whatsapp_conversations (phone, company_id, last_inbound_at) values ('+923001110101', (select c1 from t), now() - interval '1 hour');
create function pg_temp.bd(path text) returns bigint language sql as $f$
  select tests.num_as(tests.id('mo'), format('select (api.wa_audience_breakdown(''{}'', '''', array[%L, %L]::uuid[], null, ''announcements'') %s)::bigint',
    (select m1 from t), (select m2 from t), path)) $f$;
select is(pg_temp.bd($$#>> '{groups,free_text}'$$), 1::bigint, 'one can receive free text');
select is(pg_temp.bd($$#>> '{groups,template_required}'$$), 1::bigint, 'one needs the template');
select is(pg_temp.bd($$->> 'total'$$), 2::bigint, 'both are counted, each in exactly one group');

-- ── a mixed campaign fixes each recipient's type; dispatch fills the fields
select tests.exec_as(tests.id('mo'), format('select api.wa_campaign_create_master(''Office timings'', ''Notice'', ''selective'', ''announcements'', ''en'', %L, true, ''Dear {{business_name}}, the office now opens 9 to 4.'', null, ''{}'', '''', array[%L, %L]::uuid[], null)',
  pg_temp.fields(), (select m1 from t), (select m2 from t)));
create temp table tc on commit drop as select id from public.whatsapp_campaigns where name = 'Office timings';
grant select on tc to authenticated, service_role;
select is((select message_kind from public.whatsapp_campaigns where id = (select id from tc)), 'mixed', 'a mixed campaign');
select is((select kind from public.whatsapp_campaign_recipients where campaign_id = (select id from tc) and company_id = (select c1 from t)), 'text', 'open conversation: free text');
select is((select kind from public.whatsapp_campaign_recipients where campaign_id = (select id from tc) and company_id = (select c2 from t)), 'template', 'otherwise: the template');
update public.whatsapp_campaigns set status = 'queued' where id = (select id from tc);
select is(pg_temp.svc('select jsonb_array_length(api.wa_claim(10))::bigint'), 2::bigint, 'both are released');
select is((select template_payload #>> '{components,0,parameters,2,text}' from public.whatsapp_messages where campaign_id = (select id from tc) and kind = 'template'),
  'Revised office timings', 'the subject fills {{3}}');
select ok((select body !~ '\{\{' and body like '%Revised office timings%' from public.whatsapp_messages where campaign_id = (select id from tc) and kind = 'template'),
  'the stored copy is the filled message');

select * from finish();
rollback;
