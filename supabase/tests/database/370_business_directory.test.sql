-- Business directory (0570): permissions, filter safety, consent and suppression, export control and log.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(38);

-- two businesses with known details ('mo' = Membership Officer biz 2 out 2; 'sg' = biz 3 out 3)
create temp table t_m on commit drop as
  select m.id as member_id, m.company_id, m.member_no from public.members m join public.companies c on c.id = m.company_id
   where not c.demo order by m.member_no limit 2;
grant select on t_m to authenticated;
create temp table t_ids on commit drop as
  select (select member_id from t_m order by member_no limit 1) as m1, (select company_id from t_m order by member_no limit 1) as c1,
         (select member_id from t_m order by member_no desc limit 1) as m2, (select company_id from t_m order by member_no desc limit 1) as c2;
grant select on t_ids to authenticated;
update public.companies set name = 'Alpha Textile Mills', manufacturing = true, nature_sector = 'Textile', address = 'Road 1', tel = '061-1' where id = (select c1 from t_ids);
update public.companies set name = 'Beta Traders', manufacturing = false, nature_sector = 'Trading', ntn = '7777777' where id = (select c2 from t_ids);

-- ── modules
select is(tests.num_as(tests.id('sg'), 'select private.staff_level(''biz'')'), 3::bigint, 'Secretary General biz = 3');
select is(tests.num_as(tests.id('mo'), 'select private.staff_level(''biz'')'), 2::bigint, 'Membership Officer biz = 2');
select is(tests.num_as(tests.id('sg'), 'select (api.my_access()->''staff''->''levels''->>''out'')::bigint'), 3::bigint, 'my_access reports the new modules');
select ok(pg_get_functiondef('api.role_permission_set(text,text,smallint)'::regprocedure) like '%''biz'',''out''%', 'the new modules can be set in Staff & Roles');

-- ── members and outsiders get nothing
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.biz_search(''{}'', '''', '''', '''', 1, 25)') $$, '42501', null, 'a member cannot read the directory');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.biz_export(''{}'', '''', null, null, array[''business_name''], ''csv'', '''', true)') $$, '42501', null, 'a member cannot export');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.seg_save(null, ''Nope'', '''', ''{}'')') $$, '42501', null, 'a member cannot save a segment');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.segments'), 0::bigint, 'a member sees no segments');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from public.outreach_contacts') $$, '42501', null, 'contacts are not readable directly');

-- ── outreach details never touch the official record
select lives_ok(format($$ select tests.exec_as(tests.id('mo'), %L) $$, format('select api.biz_meta_save(%L, ''Multan'', ''Multan'', ''note'')', (select c1 from t_ids))), 'staff save outreach details');
select is((select name from public.companies where id = (select c1 from t_ids)), 'Alpha Textile Mills', 'the official name is unchanged');
select ok(exists (select 1 from public.audit_log where object = 'outreach_profiles' and reason = 'outreach details updated'), 'the change is audited');

-- ── filters: AND, OR, exclusion, values
create function pg_temp.cnt(d text) returns bigint language sql as $$
  select tests.num_as(tests.id('mo'), format('select (api.biz_count(%L::jsonb, '''')->>''total'')::bigint', d)) $$;
select is(pg_temp.cnt('{"groups":[{"match":"all","rules":[{"field":"business_category","op":"in","value":["manufacturing"]},{"field":"nature","op":"in","value":["textile"]},{"field":"city","op":"in","value":["Multan"]}]}]}') >= 1, true, 'AND across fields, ignoring case');
select is(pg_temp.cnt('{"groups":[{"match":"any","rules":[{"field":"nature","op":"in","value":["Textile"]},{"field":"nature","op":"in","value":["Trading"]}]}]}'), 2::bigint, 'OR inside a group');
select is(pg_temp.cnt('{"groups":[{"match":"any","exclude":true,"rules":[{"field":"nature","op":"in","value":["Textile"]}]},{"match":"any","rules":[{"field":"nature","op":"in","value":["Textile","Trading"]}]}]}'), 1::bigint, 'an excluding group removes what it matches');
select is(pg_temp.cnt('{"groups":[{"match":"all","rules":[{"field":"nature","op":"contains","value":"Text"}]}]}'), 1::bigint, 'contains');
select is(pg_temp.cnt('{"groups":[{"match":"all","rules":[{"field":"nature","op":"contains","value":"%"}]}]}'), 0::bigint, 'a wildcard in a value is only text');
select is(pg_temp.cnt('{"groups":[{"match":"all","rules":[{"field":"whatsapp_available","op":"is","value":true}]}]}'), 0::bigint, 'no contact yet');

select throws_ok($$ select pg_temp.cnt('{"groups":[{"match":"all","rules":[{"field":"c.ntn","op":"in","value":["1"]}]}]}') $$, 'P0001', null, 'an unknown field is refused');
select throws_ok($$ select pg_temp.cnt('{"groups":[{"match":"all","rules":[{"field":"nature","op":"; drop table public.members; --","value":["1"]}]}]}') $$, 'P0001', null, 'an unknown operator is refused');
select lives_ok($$ select pg_temp.cnt('{"groups":[{"match":"all","rules":[{"field":"nature","op":"in","value":["x''); delete from public.members; --"]}]}]}') $$, 'a hostile value is only a value');
select ok((select count(*) from public.members) >= 2, 'and nothing happened');

-- ── contact, consent, suppression
select throws_ok(format($$ select tests.exec_as(tests.id('president'), %L) $$, format('select api.biz_contact_save(%L, ''A'', ''+923001234567'')', (select c1 from t_ids))), '42501', null, 'view-only staff cannot manage contacts');
select lives_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.biz_contact_save(%L, ''A'', ''+92 300 1234567'')', (select c1 from t_ids))), 'contact saved and normalised');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.biz_contact_save(%L, ''A'', ''0300-123'')', (select c1 from t_ids))), 'P0001', null, 'a bad number is refused');
select is((select coalesce(new_value, '{}'::jsonb) ? 'phone' from public.audit_log where object = 'outreach_contacts' order by id desc limit 1), false, 'the number stays out of the audit log');
select is(tests.num_as(tests.id('mo'), format('select (api.biz_count(''{}'', %L)->>''eligible'')::bigint', 'Alpha')), 0::bigint, 'a contact without consent is not eligible');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.biz_consent_record(%L, ''granted'', ''written'', '''')', (select c1 from t_ids))), 'P0001', null, 'consent needs evidence');
select lives_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.biz_consent_record(%L, ''granted'', ''written'', ''Signed form 12'')', (select c1 from t_ids))), 'consent recorded');
select is(tests.num_as(tests.id('mo'), format('select (api.biz_count(''{}'', %L)->>''eligible'')::bigint', 'Alpha')), 1::bigint, 'now eligible');
select lives_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.biz_consent_record(%L, ''withdrawn'', ''written'', '''')', (select c1 from t_ids))), 'consent withdrawn');
select is(tests.num_as(tests.id('mo'), format('select (api.biz_count(''{}'', %L)->>''optedOut'')::bigint', 'Alpha')), 1::bigint, 'withdrawing suppresses the number at once');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.biz_consent_record(%L, ''granted'', ''written'', ''Form 13'')', (select c1 from t_ids))), 'P0001', null, 'consent cannot be recorded over an opt-out');

-- ── exports: limits and log
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.biz_export(''{}'', '''', null, null, array[''business_name'',''ntn''], ''csv'', ''because I can'', true)') $$, '42501', null, 'sensitive columns need level 3');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.biz_export(''{}'', '''', null, null, array[''email''], ''csv'', '''', true)') $$, 'P0001', null, 'sensitive columns need a reason');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.biz_export(''{}'', '''', null, null, array[''password''], ''csv'', '''', true)') $$, 'P0001', null, 'an unknown column is refused');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.biz_export(''{}'', ''Beta'', null, null, array[''business_name'',''nature''], ''xlsx'', '''', true)') $$, 'a plain export runs');
select is((select record_count || ':' || format || ':' || array_to_string(fields, ',') from public.export_log order by id desc limit 1), '1:xlsx:business_name,nature', 'and is logged with count, format and fields');

select * from finish();
rollback;
