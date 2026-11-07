-- WhatsApp consent wording edited by MCCI (0700): seeded, read by members, saved by platform admins only, a changed
-- wording needs a new version, limits, and every change is in the audit log.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

-- run one query as a user and return its text result
create function pg_temp.t(p_uid uuid, q text) returns text language plpgsql as $$
declare r text;
begin
  perform tests._become(p_uid, 'authenticated');
  execute q into r;
  perform tests._restore();
  return r;
exception when others then
  perform tests._restore();
  raise;
end $$;

create function pg_temp.save(p_uid uuid, p_version text, p_en text, p_ur text) returns void language plpgsql as $$
begin
  perform tests.exec_as(p_uid, format('select api.wa_settings_save(%L::jsonb)', jsonb_build_object(
    'ratePerMinute', 60, 'maxCampaign', 1000, 'approvalThreshold', 25, 'sendingEnabled', false, 'consentOpen', true,
    'consentVersion', p_version, 'consentWordingEn', p_en, 'consentWordingUr', p_ur)));
end $$;

select ok((select (value #>> '{consentWording,en}') like 'I agree that the Multan Chamber%' from private.settings where key = 'whatsapp'),
  'the launch wording is in settings');
select ok((select length(value #>> '{consentWording,ur}') > 50 from private.settings where key = 'whatsapp'), 'in Urdu too');

select is(pg_temp.t(tests.id('owner_b'), 'select api.wa_consent_wording() ->> ''version'''),
  (select value ->> 'consentVersion' from private.settings where key = 'whatsapp'), 'a member reads the wording and its version');
select throws_ok($$ select tests.exec_as(null, 'select api.wa_consent_wording()') $$, '42501', null, 'not without signing in');

select throws_ok($$ select pg_temp.save(tests.id('mo'), 'v-new', 'New text', '') $$, '42501', null,
  'only a platform administrator changes it');
select throws_ok(format($$ select pg_temp.save(tests.id('sg'), %L, 'Changed text', '') $$,
  (select value ->> 'consentVersion' from private.settings where key = 'whatsapp')),
  'P0001', 'wording changed without a new version', 'a changed wording without a new version is refused');
select throws_ok($$ select pg_temp.save(tests.id('sg'), 'v-long', repeat('x', 1501), '') $$, 'P0001', 'check the fields',
  'too long is refused');
select lives_ok($$ select pg_temp.save(tests.id('sg'), 'MCCI-test-v2', 'MCCI approved text', 'منظور شدہ عبارت') $$,
  'with a new version it is saved');
select is(pg_temp.t(tests.id('owner_b'), 'select api.wa_consent_wording() ->> ''en'''), 'MCCI approved text',
  'members see the new wording');
select ok(exists (select 1 from public.audit_log where object = 'settings' and new_value::text like '%MCCI approved text%'),
  'the change is in the audit log');

select * from finish();
rollback;
