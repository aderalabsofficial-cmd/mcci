-- Platform Settings (migration 0510): Platform ≥ 2 with the 2-step login only; listed keys and fields only, each
-- checked; values are merged; every save is audited.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

-- the Services Officer persona looks after the platform in this test (Platform 3)
update public.staff set designation = 'IT Convener' where user_id = tests.id('so');

select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.settings_save(''sla'', ''{"processDays":10,"hours":24}'')') $$,
  '42501', null, 'the Membership Officer cannot change settings');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.settings_save(''sla'', ''{"processDays":10,"hours":24}'')') $$,
  '42501', null, 'nor a member');
select throws_ok($$ select tests.exec_as_aal1(tests.id('so'), 'select api.settings_save(''sla'', ''{"processDays":10,"hours":24}'')') $$,
  '42501', null, 'nor platform staff without the 2-step login');
select lives_ok($$ select tests.exec_as(tests.id('so'), 'select api.settings_save(''sla'', ''{"processDays":10,"hours":24}'', ''MCCI asked for 10 days'')') $$,
  'platform staff change the process time');
select is((select (value ->> 'processDays')::int from private.settings where key = 'sla'), 10, 'saved');
select ok(exists (select 1 from public.audit_log where object = 'settings' and reason = 'MCCI asked for 10 days'), 'with its reason in the audit log');
select throws_ok($$ select tests.exec_as(tests.id('so'), 'select api.settings_save(''sla'', ''{"processDays":0,"hours":24}'')') $$,
  'P0001', null, 'values out of range are refused');
select throws_ok($$ select tests.exec_as(tests.id('so'), 'select api.settings_save(''sla'', ''{"processDays":5,"hours":24,"x":1}'')') $$,
  'P0001', null, 'unknown fields are refused');
select throws_ok($$ select tests.exec_as(tests.id('so'), 'select api.settings_save(''bank'', ''{"iban":"x"}'')') $$,
  'P0001', null, 'keys outside the list are refused (the bank account has its own checked form)');
select lives_ok($$ select tests.exec_as(tests.id('so'), 'select api.settings_save(''membership'', ''{"releaseNumberOnDecline":true,"certificateLowConfidence":80,"stampRequiredForProprietor":false}'')') $$,
  'membership decisions are saved');
select ok((select value ? 'checklist' and (value -> 'releaseNumberOnDecline')::boolean from private.settings where key = 'membership'),
  'merged: the fields not sent stay');

select * from finish();
rollback;
