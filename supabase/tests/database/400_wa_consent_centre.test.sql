-- WhatsApp consent centre (0690): number rules, member self-service, consent gate, number change and history,
-- JOIN verification (exact number, one use, expiry, replay), STOP and re-subscription, staff limits, statuses, filters.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(74);

update private.settings set value = value || '{"consentOpen":false,"consentVersion":"v-test"}'::jsonb where key = 'whatsapp';
update public.companies set tel = '061-4512345, 0300-7654321' where id = tests.id('company_b');

-- run one statement as a user and return its text result
create function pg_temp.t(p_uid uuid, q text) returns text language plpgsql as $$
declare r text;
begin
  perform tests._become(p_uid, 'authenticated');
  begin
    execute q into r;
  exception when others then
    perform tests._restore();
    raise;
  end;
  perform tests._restore();
  return r;
end $$;
create function pg_temp.mine(k text) returns text language sql as $$
  select pg_temp.t(tests.id('owner_b'), format('select api.wa_my_whatsapp(%L) ->> %L', tests.id('company_b'), k)) $$;
-- the webhook runs as the server's secret-key client
create function pg_temp.hook(p_event text, p_from text, p_body text) returns text language plpgsql as $$
declare r text;
begin
  perform tests._become(null, 'service_role');
  begin
    r := api.wa_webhook(p_event, 'messages', jsonb_build_object('messages', jsonb_build_array(jsonb_build_object(
      'id', 'wamid.' || p_event, 'from', p_from, 'type', 'text', 'text', jsonb_build_object('body', p_body)))));
  exception when others then
    perform tests._restore();
    raise;
  end;
  perform tests._restore();
  return r;
end $$;

-- ── numbers
select is(private.wa_phone('0300-1234567'), '+923001234567', 'a local mobile gets +92');
select is(private.wa_phone('92 300 1234567'), '+923001234567', '92… gets the plus');
select is(private.wa_phone('0092 300 1234567'), '+923001234567', '0092… becomes +92…');
select is(private.wa_phone('061-4512345'), null, 'a Pakistani landline is not a WhatsApp mobile');
select is(private.wa_phone('+44 7700 900123'), '+447700900123', 'international numbers are kept');
select is(private.wa_phone('hello'), null, 'text is not a number');

-- ── a member sees only their own company
select is(pg_temp.mine('status'), 'no_number', 'nothing set up yet');
select throws_ok(format($$ select pg_temp.t(tests.id('owner_b'), %L) $$, format('select api.wa_my_whatsapp(%L)::text', tests.id('company_e'))),
  '42501', null, 'another company''s WhatsApp is not readable');
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_contact(%L, ''X'', ''03001234567'')', tests.id('company_e'))),
  '42501', null, 'nor changeable');
select throws_ok(format($$ select tests.exec_as(tests.id('viewer_a'), %L) $$, format('select api.wa_member_contact(%L, ''Viewer'', ''03001234567'')', tests.id('company_a'))),
  '42501', null, 'a Viewer cannot change the company''s number');
select is(pg_temp.mine('suggestions'), '["+923007654321"]', 'the registered mobile is only suggested; the landline is not');

-- ── contact: always allowed; consent: only once MCCI opens it (decision A)
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_contact(%L, ''Bilal'', ''0300-12'')', tests.id('company_b'))),
  'P0001', null, 'a bad number is refused');
select lives_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_contact(%L, ''Bilal Ahmed'', ''0300 111 2233'')', tests.id('company_b'))),
  'the member saves a number while consent is closed');
select is(pg_temp.mine('phone'), '+923001112233', 'stored in international form');
select is(pg_temp.mine('status'), 'not_collected', 'a number is not consent');
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_consent(%L, array[''events''], true)', tests.id('company_b'))),
  'P0001', 'closed', 'new consent waits for MCCI''s approval of the wording');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.wa_consent_record(%L, ''granted'', ''phone'', ''Called 6 Nov'', array[''events''], true)', tests.id('company_b'))),
  'P0001', 'closed', 'for staff too');

update private.settings set value = value || '{"consentOpen":true}'::jsonb where key = 'whatsapp';
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_consent(%L, array[''events''], false)', tests.id('company_b'))),
  'P0001', 'agree', 'consent needs the member''s explicit agreement');
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_consent(%L, array[]::text[], true)', tests.id('company_b'))),
  'P0001', 'categories', 'and at least one category');
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_consent(%L, array[''marketing''], true)', tests.id('company_b'))),
  'P0001', 'categories', 'only the five categories exist');
select is(pg_temp.t(tests.id('owner_b'), format('select api.wa_member_consent(%L, array[''events'',''services''], true)', tests.id('company_b'))), 'partial',
  'two categories: partial consent');
select is((select wording_version from public.outreach_consents where company_id = tests.id('company_b') order by id desc limit 1), 'v-test', 'the wording version is recorded');
select is((select confirmed from public.outreach_consents where company_id = tests.id('company_b') order by id desc limit 1), true, 'and the member''s own yes');
select is(pg_temp.mine('categories'), '["events", "services"]', 'the member sees exactly what they chose');
select is(pg_temp.t(tests.id('owner_b'), format('select api.wa_member_consent(%L, array[''announcements'',''membership'',''events'',''opportunities'',''services''], true)', tests.id('company_b'))),
  'full', 'all five: full consent');

-- ── staff: what they may see and do
select is(pg_temp.t(tests.id('president'), format('select api.wa_member_whatsapp(%L) ->> ''phone''', tests.id('company_b'))), '+92 300 •••• 233',
  'view-only staff see the status and a masked number');
select is(pg_temp.t(tests.id('mo'), format('select api.wa_member_whatsapp(%L) ->> ''phone''', tests.id('company_b'))), '+923001112233',
  'staff with contact access see the number');
select is(pg_temp.t(tests.id('president'), format('select api.wa_register_status() -> %L ->> ''status''', tests.id('company_b'))), 'full',
  'the register shows the status');
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_whatsapp(%L)', tests.id('company_b'))),
  '42501', null, 'members cannot use the staff view');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.wa_register_status()') $$, '42501', null, 'nor the register column');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select api.wa_register_status()') $$, '42501', null, 'staff without outreach access cannot either');
select is(tests.num_as(tests.id('mo'), format('select (api.biz_count(%L, '''')->>''total'')::bigint',
  '{"groups":[{"match":"all","rules":[{"field":"wa_categories","op":"in","value":["services"]},{"field":"wa_status","op":"in","value":["full","partial"]}]}]}')),
  1::bigint, 'the audience can be filtered by consented category and status');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, 'select api.biz_count(''{"groups":[{"match":"all","rules":[{"field":"wa_categories","op":"in","value":["spam"]}]}]}'', '''')'),
  'P0001', 'bad value', 'an unknown category in a filter is refused');

-- ── JOIN verification
create temp table jc on commit drop as
  select pg_temp.t(tests.id('owner_b'), format('select api.wa_join_code(%L)::text', tests.id('company_b')))::jsonb as j;
select ok((select j ->> 'code' from jc) ~ '^[A-Z2-9]{6}$', 'a six-character code');
select is((select count(*) from public.outreach_join_codes where code_hash = (select j ->> 'code' from jc)), 0::bigint, 'the code itself is not stored');
select is((select count(*) from public.outreach_join_codes where code_hash = encode(extensions.digest((select j ->> 'code' from jc), 'sha256'), 'hex')), 1::bigint, 'only its hash');
select is(pg_temp.hook('j1', '923009998877', 'JOIN ' || (select j ->> 'code' from jc)), 'ok', 'a JOIN from another number');
select is((select outcome from public.outreach_verifications order by id desc limit 1), 'mismatch', 'is recorded as a mismatch');
select is(pg_temp.mine('verified_at'), null, 'and verifies nothing');
select is((select company_id from public.whatsapp_conversations where phone = '+923009998877'), null::uuid, 'nor links that number to the company');
select is(pg_temp.hook('j2', '923001112233', 'join mcci ' || lower((select j ->> 'code' from jc))), 'ok', 'the JOIN from the saved number');
select is((select outcome from public.outreach_verifications order by id desc limit 1), 'verified', 'verifies it');
select isnt(pg_temp.mine('verified_at'), null, 'the member sees the number confirmed');
select is(pg_temp.hook('j2', '923001112233', 'JOIN ' || (select j ->> 'code' from jc)), 'duplicate', 'a repeated event is ignored');
select is(pg_temp.hook('j3', '923001112233', 'JOIN ' || (select j ->> 'code' from jc)), 'ok', 'the same code again');
select is((select outcome from public.outreach_verifications order by id desc limit 1), 'used', 'is refused as used');
create temp table jc2 on commit drop as
  select pg_temp.t(tests.id('owner_b'), format('select api.wa_join_code(%L)::text', tests.id('company_b')))::jsonb as j;
update public.outreach_join_codes set expires_at = now() - interval '1 minute' where company_id = tests.id('company_b') and used_at is null;
select is(pg_temp.hook('j4', '923001112233', 'JOIN ' || (select j ->> 'code' from jc2)), 'ok', 'an expired code');
select is((select outcome from public.outreach_verifications order by id desc limit 1), 'expired', 'is refused as expired');

-- ── number change: consent and verification stay with the old number, which is kept in history
select lives_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.wa_member_contact(%L, ''Bilal Ahmed'', ''03004445566'')', tests.id('company_b'))),
  'the member changes the number');
select is(pg_temp.mine('status'), 'not_collected', 'consent is not carried to the new number');
select is(pg_temp.mine('verified_at'), null, 'nor the verification');
select is((select phone from public.outreach_contact_history where company_id = tests.id('company_b') order by id desc limit 1), '+923001112233', 'the old number is kept in history');
select is((select method from public.outreach_consents where company_id = tests.id('company_b') and phone = '+923001112233' order by id desc limit 1), 'number_change',
  'and its consent ends with a recorded row');

-- ── STOP, and only the member subscribes again (decision C)
select is(pg_temp.t(tests.id('owner_b'), format('select api.wa_member_consent(%L, array[''membership''], true)', tests.id('company_b'))), 'partial', 'consent for the new number');
select is(pg_temp.hook('s1', '923004445566', 'STOP'), 'ok', 'the member replies STOP');
select is(pg_temp.mine('status'), 'opted_out', 'turned off at once');
-- (everything in this test shares one transaction time; the STOP happened earlier than what follows)
update public.outreach_suppressions set created_at = now() - interval '1 minute' where phone = '+923004445566';
select is((select status from public.outreach_consents where company_id = tests.id('company_b') order by id desc limit 1), 'withdrawn', 'with a recorded withdrawal');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.wa_consent_record(%L, ''granted'', ''phone'', ''Asked on the phone'', array[''membership''], true)', tests.id('company_b'))),
  'P0001', 'member opted out', 'not even the Secretary General can record consent over it');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.biz_unsuppress(%L, ''Member asked'')', tests.id('company_b'))),
  'P0001', 'member opted out', 'nor lift it');
select is(pg_temp.t(tests.id('owner_b'), format('select api.wa_member_consent(%L, array[''events''], true)', tests.id('company_b'))), 'awaiting_verification',
  'the member subscribes again: waits for a fresh WhatsApp confirmation');
select is(private.wa_block(tests.id('company_b'), '+923004445566', 'events', 'session', null), 'suppressed', 'nothing can be sent before it');
select is(pg_temp.mine('categories'), '["events"]', 'earlier categories are not restored');
create temp table jc3 on commit drop as
  select pg_temp.t(tests.id('owner_b'), format('select api.wa_join_code(%L)::text', tests.id('company_b')))::jsonb as j;
select is(pg_temp.hook('j5', '923004445566', 'JOIN ' || (select j ->> 'code' from jc3)), 'ok', 'the confirmation arrives');
select is(pg_temp.mine('status'), 'partial', 'consent is active again');
select is((select count(*) from public.outreach_consents where company_id = tests.id('company_b') and phone = '+923004445566' and status = 'withdrawn'), 1::bigint,
  'and the STOP stays in the history');

-- ── staff-assisted consent states method, evidence and the member's yes
select lives_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.biz_contact_save(%L, ''Rep E'', ''0300 222 3344'')', tests.id('company_e'))),
  'staff save a number for another business');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_consent_record(%L, ''granted'', ''phone'', ''Called'', array[''events''], false)', tests.id('company_e'))),
  'P0001', 'confirm', 'without confirming the member''s explicit yes it is refused');
select lives_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.wa_consent_record(%L, ''granted'', ''in_person'', ''Visited the office 6 Nov'', array[''events''], true)', tests.id('company_e'))),
  'with method, evidence and confirmation it is recorded');

-- ── the new tables are closed to direct access: everything goes through the api functions
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select count(*) from public.outreach_join_codes') $$, '42501', null, 'members cannot read JOIN codes');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select count(*) from public.outreach_join_codes') $$, '42501', null, 'nor can staff');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select count(*) from public.outreach_contact_history') $$, '42501', null, 'number history is read through api functions only');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select count(*) from public.outreach_verifications') $$, '42501', null, 'verification records too');
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, 'insert into public.outreach_consents (company_id, phone, status, method, categories) values (''b0000000-0000-0000-0000-00000000000b'', ''+923001112233'', ''granted'', ''member_portal'', array[''events''])'),
  '42501', null, 'nobody writes consent directly');
select is((select count(*) from public.audit_log where object = 'outreach_contact_history' and new_value ? 'phone'), 0::bigint, 'numbers stay out of the audit log');

select * from finish();
rollback;
