-- WhatsApp quota (0640) on 3,000 simulated businesses (never real members; all rolled back): the unique-recipient
-- limit at 250, 2,000 and 10,000, usage from other numbers, the rolling 24 hours, seven-day use, stale and unknown
-- limits, a campaign larger than today's capacity, duplicates, consent and opt-out exclusions, permissions.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(31);

update private.settings set value = value || '{"sendingEnabled":true,"ratePerMinute":100000,"dailyLimit":100000000,"maxCampaign":5000}'::jsonb where key = 'whatsapp';

-- 3,000 consented + 20 without consent + 10 opted out, all simulated
insert into public.companies (name, biz_type, nature_sector, address, tel, manufacturing)
select 'Load Test ' || i, 'pvt', 'LOADTEST-0640', 'Road ' || i, '061-0', false from generate_series(1, 3030) i;
insert into public.members (member_no, company_id, class, status, rep_name, since, valid_to)
select 'LT-' || lpad(substr(c.name, 11), 5, '0'), c.id, (case when substr(c.name, 11)::int % 2 = 0 then 'Corporate' else 'Associate' end)::public.member_class,
       'Permanent', 'Rep ' || substr(c.name, 11), '2026-01-01', '2099-01-01'
  from public.companies c where c.nature_sector = 'LOADTEST-0640';
insert into public.outreach_contacts (company_id, name, phone)
select c.id, 'Contact ' || substr(c.name, 11), '+92300' || lpad(substr(c.name, 11), 7, '0') from public.companies c where c.nature_sector = 'LOADTEST-0640';
insert into public.outreach_consents (company_id, phone, status, method, evidence, categories)
select o.company_id, o.phone, 'granted', 'written', 'Simulated form', array['membership']
  from public.outreach_contacts o join public.companies c on c.id = o.company_id
 where c.nature_sector = 'LOADTEST-0640' and substr(c.name, 11)::int <= 3010;
insert into public.outreach_suppressions (phone, reason, source)
select '+92300' || lpad(i::text, 7, '0'), 'Simulated opt-out', 'staff' from generate_series(3001, 3010) i;
insert into public.whatsapp_templates (name, language, status, body, var_map) values ('loadtest_notice', 'en', 'APPROVED', 'Dear {{1}}, a notice.', '{"1":"business_name"}');

create function pg_temp.svc(q text) returns bigint language sql as $$ select tests.num_as(null, q, 'service_role') $$;
create function pg_temp.claim() returns bigint language sql as $$ select pg_temp.svc('select jsonb_array_length(api.wa_claim(5000))::bigint') $$;
create function pg_temp.quota(p_limit int, p_external int default 0, p_age interval default interval '0', p_external_age interval default interval '0') returns void
  language sql as $$
    update public.whatsapp_quota set unique_limit = p_limit, confirmed_at = now() - p_age,
      external_recipients = p_external, external_at = case when p_external > 0 then now() - p_external_age end $$;
create function pg_temp.sent() returns bigint language sql as
  $$ select count(*) from public.whatsapp_messages m join public.outreach_contacts o on o.phone = m.phone join public.companies c on c.id = o.company_id where c.nature_sector = 'LOADTEST-0640' $$;

-- ── the campaign: 3,030 selected, 3,000 may receive it
select tests.exec_as(tests.id('mo'), format($f$select api.wa_campaign_create('Load test', 'Simulated', 'campaign', 'membership', 'template', %L, null, null, null,
  '{"groups":[{"match":"all","exclude":false,"rules":[{"field":"nature","op":"in","value":["LOADTEST-0640"]}]}]}', '', null, null)$f$,
  (select id from public.whatsapp_templates where name = 'loadtest_notice')));
create temp table tc on commit drop as select id from public.whatsapp_campaigns where name = 'Load test';
grant select on tc to authenticated, service_role;
select is((select count(*) from public.whatsapp_campaign_recipients where campaign_id = (select id from tc)), 3030::bigint, 'all 3,030 selected are in the snapshot');
select is((select count(*) from public.whatsapp_campaign_recipients where campaign_id = (select id from tc) and status = 'pending'), 3000::bigint, '3,000 may receive it');
select is((select count(*) from public.whatsapp_campaign_recipients where campaign_id = (select id from tc) and reason = 'no_consent'), 20::bigint, 'no consent: recorded, not silently dropped');
select is((select count(*) from public.whatsapp_campaign_recipients where campaign_id = (select id from tc) and reason = 'suppressed'), 10::bigint, 'opted out: recorded, never sent');

-- ── schedule at 250 a day
select pg_temp.quota(250);
select is(tests.num_as(tests.id('mo'), format('select (api.wa_campaign_schedule(%L) #>> ''{windows,0,recipients}'')::bigint', (select id from tc))), 250::bigint, 'the first window takes 250');
select is(tests.num_as(tests.id('mo'), format('select jsonb_array_length(api.wa_campaign_schedule(%L) -> ''windows'')::bigint', (select id from tc))), 12::bigint, '3,000 at 250 a day: 12 windows');
update public.whatsapp_campaigns set status = 'queued' where id = (select id from tc);

-- ── 250, with 100 already reached from another number of the portfolio
select pg_temp.quota(250, 100);
select is(private.wa_quota_room(), 150, 'other numbers'' recipients share the limit');
select is(pg_temp.claim(), 150::bigint, 'only 150 go');
select pg_temp.quota(250, 100, interval '0', interval '25 hours');
select is(private.wa_quota_room(), 100, 'usage older than 24 hours no longer counts');
select is(pg_temp.claim(), 100::bigint, 'the next 100 go');
select is(pg_temp.claim(), 0::bigint, 'at 250 nothing more goes');
select is((select count(*) from public.whatsapp_campaign_recipients where campaign_id = (select id from tc) and status = 'pending'), 2750::bigint,
  'the rest wait as pending, none skipped for capacity');
select is((select count(*) from public.whatsapp_campaign_recipients where campaign_id = (select id from tc) and status = 'skipped'), 30::bigint, 'skipped are only the 30 not allowed');

-- ── stale or unknown: fail safe
select pg_temp.quota(2000, 0, interval '8 days');
select is(private.wa_quota_problem(), 'stale', 'confirmed 8 days ago is stale');
select is(pg_temp.claim(), 0::bigint, 'a stale limit sends nothing, even a higher one');
update public.whatsapp_quota set unique_limit = null, confirmed_at = now();
select is(private.wa_quota_problem(), 'unknown', 'no limit is unknown');
select is(pg_temp.claim(), 0::bigint, 'an unknown limit sends nothing');

-- ── 2,000
select pg_temp.quota(2000);
select is(private.wa_quota_room(), 1750, '2,000 less the 250 reached today');
select is(pg_temp.claim(), 1750::bigint, '1,750 go');
select is(pg_temp.claim(), 0::bigint, 'then nothing until the window moves');

-- ── the rolling window moves: messages from 25 hours ago no longer count; 10,000
update public.whatsapp_messages set created_at = now() - interval '25 hours'
 where phone in (select o.phone from public.outreach_contacts o join public.companies c on c.id = o.company_id where c.nature_sector = 'LOADTEST-0640');
select pg_temp.quota(10000);
select is(private.wa_used(24), 0, 'nothing in the last 24 hours');
select is(private.wa_used(24 * 7), 2000, 'seven-day use keeps the 2,000');
select is(pg_temp.claim(), 1000::bigint, 'the last 1,000 go at 10,000');
select is(pg_temp.sent(), 3000::bigint, 'exactly 3,000 messages for 3,000 recipients');
select is((select count(*) from (select recipient_id from public.whatsapp_messages where campaign_id = (select id from tc) group by 1 having count(*) > 1) x), 0::bigint,
  'never two messages for one recipient');
select is(pg_temp.claim(), 0::bigint, 'claiming again sends nothing more');
select is(tests.num_as(tests.id('mo'), 'select (api.wa_quota_status() ->> ''weekTarget'')::bigint'), 5000::bigint, 'the scaling target is half the confirmed limit');

-- ── one person already reached today needs no new place; a new one does
select pg_temp.quota(1000);   -- exactly the 1,000 reached in the last 24 hours: no room left
select is(private.wa_quota_room(), 0, 'no room');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_send_prepare(%L, ''template'', null, %L, null, ''membership'')',
  (select o.company_id from public.outreach_contacts o join public.companies c on c.id = o.company_id join public.outreach_consents k on k.company_id = o.company_id and k.status = 'granted' where c.nature_sector = 'LOADTEST-0640' and not private.wa_recent(o.phone) and not exists (select 1 from public.outreach_suppressions x where x.phone = o.phone and x.active) limit 1), (select id from public.whatsapp_templates where name = 'loadtest_notice'))),
  'P0001', null, 'a new recipient (reached 25 hours ago) is refused when there is no room');

-- ── who may confirm the account figures
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.wa_quota_confirm(''{"tier":"TIER_2K","limit":2000,"verification":"verified","phoneQuality":"HIGH","templateQuality":"HIGH","source":"admin","note":"x y z","external":0,"staleDays":7}'')') $$,
  '42501', null, 'campaign staff cannot change the limit');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.wa_quota_status()') $$, '42501', null, 'members cannot read it');

select * from finish();
rollback;
