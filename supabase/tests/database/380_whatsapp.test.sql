-- WhatsApp (0580): sending rules, opt-out, audience snapshot, duplicate protection, forward-only status, permissions.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(44);

update private.settings set value = value || '{"sendingEnabled":true,"approvalThreshold":1,"ratePerMinute":100}'::jsonb where key = 'whatsapp';

create temp table t on commit drop as
  select (select m.company_id from public.members m join public.companies c on c.id = m.company_id where not c.demo order by m.member_no limit 1) as c1,
         (select m.company_id from public.members m join public.companies c on c.id = m.company_id where not c.demo order by m.member_no desc limit 1) as c2;
grant select on t to authenticated, service_role;
insert into public.outreach_contacts (company_id, name, phone) select c1, 'One', '+923001110001' from t;
insert into public.outreach_contacts (company_id, name, phone) select c2, 'Two', '+923001110002' from t;
insert into public.whatsapp_templates (name, language, status, body, var_map) values ('notice_ok', 'en', 'APPROVED', 'Dear {{1}}', '{"1":"business_name"}'), ('notice_draft', 'en', 'PENDING', 'x', '{}');
create temp table tp on commit drop as select (select id from public.whatsapp_templates where name = 'notice_ok') as ok, (select id from public.whatsapp_templates where name = 'notice_draft') as draft;
grant select on tp to authenticated, service_role;
create function pg_temp.sg(q text) returns void language sql as $$ select tests.exec_as(tests.id('sg'), q) $$;
create function pg_temp.svc(q text) returns bigint language sql as $$ select tests.num_as(null, q, 'service_role') $$;

-- ── boundaries
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.wa_dashboard()') $$, '42501', null, 'a member cannot read the dashboard');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.whatsapp_messages'), 0::bigint, 'messages are not open to members');
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_send_prepare(%L, ''text'', ''x'', null, null, ''membership'')', (select c1 from t))), '42501', null, 'a member cannot send');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.wa_claim(5)') $$, '42501', null, 'staff cannot call the dispatcher directly');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.wa_webhook(''x'', ''messages'', ''{}'')') $$, '42501', null, 'staff cannot forge a webhook');
select is(tests.num_as(tests.id('president'), 'select (api.wa_dashboard()->>''suppressed'')::bigint'), 0::bigint, 'view-only staff read the aggregate figures');
select throws_ok(format($$ select tests.exec_as(tests.id('president'), %L) $$, format('select api.wa_send_prepare(%L, ''text'', ''x'', null, null, ''membership'')', (select c1 from t))), '42501', null, 'view-only staff cannot send');

-- ── sending rules
select throws_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_send_prepare(%L, ''template'', null, %L, null, ''membership'')', (select c1 from t), (select ok from tp))), 'P0001', null, 'no consent: blocked');
select lives_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_consent_record(%L, ''granted'', ''written'', ''Form 1'', array[''membership''])', (select c1 from t))), 'consent recorded for one category');
select throws_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_send_prepare(%L, ''template'', null, %L, null, ''events'')', (select c1 from t), (select ok from tp))), 'P0001', null, 'another category: blocked');
select throws_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_send_prepare(%L, ''template'', null, %L, null, ''membership'')', (select c1 from t), (select draft from tp))), 'P0001', null, 'an unapproved template: blocked');
select throws_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_send_prepare(%L, ''text'', ''hello'', null, null, ''membership'')', (select c1 from t))), 'P0001', null, 'free text outside the 24-hour window: blocked');
select lives_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_send_prepare(%L, ''template'', null, %L, null, ''membership'')', (select c1 from t), (select ok from tp))), 'an approved template with consent: allowed');
select is((select template_payload #>> '{components,0,parameters,0,text}' from public.whatsapp_messages order by created_at desc limit 1), (select name from public.companies where id = (select c1 from t)), 'the value is mapped explicitly');
select is((select count(*) from public.whatsapp_messages where state = 'submitting' and idempotency_key like 'mcci-m-%'), 1::bigint, 'one message with one key');

select is(private.wa_render('Hi {{business_name}} {{secret}}', '{"business_name":"ACME"}'), 'Hi ACME {{secret}}', 'only known names are replaced');

-- ── status only moves forward; duplicates ignored
create temp table tm on commit drop as select id from public.whatsapp_messages order by created_at desc limit 1;
grant select on tm to service_role;
select lives_ok(format($$ select pg_temp.svc(%L) $$, format('select 0::bigint from (select api.wa_result(%L, ''accepted'', ''prov-1'', ''wamid.A'', null, null)) x', (select id from tm))), 'accepted');
select is((select state from public.whatsapp_messages where id = (select id from tm)), 'submitted', 'accepted is only "submitted", not delivered');
select is(pg_temp.svc('select case api.wa_webhook(''e1'', ''messages'', ''{"statuses":[{"id":"wamid.A","status":"read"}]}'') when ''ok'' then 1::bigint else 0 end'), 1::bigint, 'a read event');
select is(pg_temp.svc('select case api.wa_webhook(''e2'', ''messages'', ''{"statuses":[{"id":"wamid.A","status":"delivered"}]}'') when ''ok'' then 1::bigint else 0 end'), 1::bigint, 'a late delivered event');
select is((select state from public.whatsapp_messages where id = (select id from tm)), 'read', 'a late event does not move it back');
select is(pg_temp.svc('select case api.wa_webhook(''e2'', ''messages'', ''{}'') when ''duplicate'' then 1::bigint else 0 end'), 1::bigint, 'a repeated event id is ignored');
select is(pg_temp.svc('select case api.wa_webhook(''e3'', ''messages'', ''{"statuses":[{"id":"wamid.LATER","status":"delivered"}]}'') when ''ok'' then 1::bigint else 0 end'), 1::bigint, 'an event before the id is known');
select is((select count(*) from public.whatsapp_pending_status where wa_id = 'wamid.LATER'), 1::bigint, 'is held, not lost');

-- ── ambiguous timeout keeps the key, then waits for a person
select pg_temp.sg(format('select api.wa_send_prepare(%L, ''template'', null, %L, null, ''membership'')', (select c1 from t), (select ok from tp)));
create temp table tm2 on commit drop as select id, idempotency_key from public.whatsapp_messages where state = 'submitting' order by created_at desc limit 1;
grant select on tm2 to service_role;
update public.whatsapp_messages set attempts = 3 where id = (select id from tm2);
select lives_ok(format($$ select pg_temp.svc(%L) $$, format('select 0::bigint from (select api.wa_result(%L, ''ambiguous'', null, null, ''timeout'', ''No answer'')) x', (select id from tm2))), 'a timeout at the limit');
select is((select state from public.whatsapp_messages where id = (select id from tm2)), 'unknown', 'becomes unknown, never resent blindly');
select is((select idempotency_key from public.whatsapp_messages where id = (select id from tm2)), (select idempotency_key from tm2), 'the key never changes');

-- ── inbound, window, matching, opt-out
select is(pg_temp.svc($q$select case api.wa_webhook('i1', 'messages', '{"contacts":[{"profile":{"name":"One"}}],"messages":[{"id":"wamid.IN1","from":"923001110001","type":"text","text":{"body":"Hello"},"timestamp":"1"}]}') when 'ok' then 1::bigint else 0 end$q$), 1::bigint, 'an inbound message');
select is((select company_id from public.whatsapp_conversations where phone = '+923001110001'), (select c1 from t), 'is matched to its one business');
select is(pg_temp.svc($q$select case api.wa_webhook('i2', 'messages', '{"messages":[{"id":"wamid.IN2","from":"923009999999","type":"text","text":{"body":"Who?"}}]}') when 'ok' then 1::bigint else 0 end$q$), 1::bigint, 'an unknown number');
select is((select company_id from public.whatsapp_conversations where phone = '+923009999999'), null::uuid, 'stays unmatched');
select lives_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_send_prepare(%L, ''text'', ''Thanks {{business_name}}'', null, null, ''membership'')', (select c1 from t))), 'free text is allowed inside the open window');
select is(pg_temp.svc($q$select case api.wa_webhook('i3', 'messages', '{"messages":[{"id":"wamid.IN3","from":"923001110001","type":"text","text":{"body":" stop "}}]}') when 'ok' then 1::bigint else 0 end$q$), 1::bigint, 'the recipient replies STOP');
select ok(exists (select 1 from public.outreach_suppressions where phone = '+923001110001' and active), 'the number is suppressed at once');
select throws_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_send_prepare(%L, ''template'', null, %L, null, ''membership'')', (select c1 from t), (select ok from tp))), 'P0001', null, 'and nothing more can be prepared');

-- ── campaign: snapshot, approval, recheck before dispatch
select pg_temp.sg(format('select api.wa_consent_record(%L, ''granted'', ''written'', ''Form 2'', array[''membership''])', (select c2 from t)));
update public.outreach_suppressions set active = false where phone = '+923001110001';
select pg_temp.sg(format('select api.wa_consent_record(%L, ''granted'', ''written'', ''Form 3'', array[''membership''])', (select c1 from t)));
select tests.exec_as(tests.id('mo'), format('select api.wa_campaign_create(''C1'', ''Test'', ''campaign'', ''membership'', ''template'', %L, null, null, null, ''{}'', '''', null, null)', (select ok from tp)));
create temp table tc on commit drop as select id from public.whatsapp_campaigns where name = 'C1';
grant select on tc to authenticated, service_role;
select is((select count(*) from public.whatsapp_campaign_recipients where campaign_id = (select id from tc) and status = 'pending'), 2::bigint, 'the audience is fixed when created');
select throws_ok($$ update public.whatsapp_campaign_recipients set phone = '+923000000000' where campaign_id = (select id from tc) $$, 'P0001', null, 'the snapshot cannot be edited');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_campaign_start(%L, null, 2)', (select id from tc))), 'P0001', null, 'a draft cannot start');
select tests.exec_as(tests.id('mo'), format('select api.wa_campaign_submit(%L)', (select id from tc)));
select is((select status from public.whatsapp_campaigns where id = (select id from tc)), 'pending_approval', 'above the threshold it waits for approval');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_campaign_decide(%L, true, '''')', (select id from tc))), '42501', null, 'the creator''s level cannot approve');
select lives_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_campaign_decide(%L, true, '''')', (select id from tc))), 'an approver approves');
select throws_ok(format($$ select pg_temp.sg(%L) $$, format('select api.wa_campaign_start(%L, null, 99)', (select id from tc))), 'P0001', null, 'the launch must repeat the exact count');
select pg_temp.sg(format('select api.wa_campaign_start(%L, null, 2)', (select id from tc)));
-- one recipient opts out after approval: the check right before dispatch still stops it
insert into public.outreach_suppressions (phone, reason, source) values ('+923001110002', 'Late opt-out', 'recipient');
update public.whatsapp_messages set next_attempt_at = now() + interval '1 hour' where state = 'submitting';
select is(pg_temp.svc('select jsonb_array_length(api.wa_claim(10))::bigint'), 1::bigint, 'only one message is released');
select is((select reason from public.whatsapp_campaign_recipients where phone = '+923001110002' and campaign_id = (select id from tc)), 'suppressed', 'the late opt-out is skipped with its reason');

select * from finish();
rollback;
