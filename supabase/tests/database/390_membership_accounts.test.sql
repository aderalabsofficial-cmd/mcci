-- Owner's list of 1 Nov 2026 (0590-0610): voter rules, restoration keeps the date, renewal period and declaration, change
-- declarations, accounts with a second person's verification and month closing, assigned service officers, media.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(53);

insert into public.companies (id, name, biz_type) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Rule Co A', 'prop'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Rule Co B', 'prop'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Rule Co C', 'prop'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Rule Co D', 'prop');
insert into public.members (id, member_no, company_id, class, status, rep_name, since, valid_to, enrollment_source) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'MCCI-C-90001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Corporate', 'Permanent', 'A', '2026-07-13', '2099-03-31', 'register'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'MCCI-C-90002', 'aaaaaaaa-0000-4000-8000-000000000002', 'Corporate', 'Permanent', 'B', '2026-07-14', '2099-03-31', 'register'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'MCCI-A-90003', 'aaaaaaaa-0000-4000-8000-000000000003', 'Associate', 'Expired', 'C', '2010-01-01', '2024-03-31', 'register'),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'MCCI-A-90004', 'aaaaaaaa-0000-4000-8000-000000000004', 'Associate', 'Permanent', 'D', null, '2099-03-31', 'import');

create function pg_temp.reason(p_member uuid, p_cutoff date) returns text language sql as $$
  select private.voter_reason(m, p_cutoff) from public.members m where m.id = p_member $$;

-- ── voter rules, the owner's own example
select is(pg_temp.reason('bbbbbbbb-0000-4000-8000-000000000001', '2028-07-13'), null, 'enrolled exactly 2 years before the announcement: eligible');
select is(pg_temp.reason('bbbbbbbb-0000-4000-8000-000000000002', '2028-07-13'), 'too_new', 'enrolled one day after the cutoff (14 Jul 2026, announced 13 Jul 2028): not eligible');
select is(pg_temp.reason('bbbbbbbb-0000-4000-8000-000000000003', current_date), 'lapsed', 'a lapsed member is not eligible');
select is(pg_temp.reason('bbbbbbbb-0000-4000-8000-000000000004', '2028-07-13'), 'no_date', 'a legacy member without a date is held back with a reason, not given today''s date');

update public.members set valid_to = '2099-03-31', status = 'Permanent', restored_at = '2028-01-01 12:00+05' where id = 'bbbbbbbb-0000-4000-8000-000000000003';
select is(pg_temp.reason('bbbbbbbb-0000-4000-8000-000000000003', '2028-07-13'), 'restored_recently', 'restored less than a year before the cutoff: not eligible');
select is(pg_temp.reason('bbbbbbbb-0000-4000-8000-000000000003', '2029-01-01'), null, 'restored more than a year before: eligible');
update public.members set restored_at = null, valid_to = '2024-03-31', status = 'Expired' where id = 'bbbbbbbb-0000-4000-8000-000000000003';

update private.settings set value = value || '{"minYears":3}'::jsonb where key = 'voter';
select is(pg_temp.reason('bbbbbbbb-0000-4000-8000-000000000001', '2028-07-13'), 'too_new', 'the rule is a setting: a by-law change needs no deploy');
update private.settings set value = value || '{"minYears":2}'::jsonb where key = 'voter';

select is(tests.num_as(tests.id('sg'), $$select count(*) from api.voter_list('2028-07-13', 'Associate') where member_no = 'MCCI-C-90001'$$), 0::bigint, 'the class filter works');
select is(tests.num_as(tests.id('sg'), $$select count(*) from api.voter_list('2028-07-13', null) where member_no = 'MCCI-C-90001' and reason is null$$), 1::bigint, 'the list gives the result');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select count(*) from api.voter_list(''2028-07-13'')') $$, '42501', null, 'a member cannot read the voter list');
select throws_ok($$ select tests.exec_as(tests.id('membership_officer'), 'select api.voter_export_log(''2028-07-13'', null, ''eligible'', 1)') $$, '42501', null, 'view level cannot export');

-- ── enrollment date for legacy members
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_enrollment_set(''bbbbbbbb-0000-4000-8000-000000000004'', ''2005-06-01'', ''2003-02-01'')') $$, 'a missing date is set from the records');
select is((select since from public.members where id = 'bbbbbbbb-0000-4000-8000-000000000004'), '2003-02-01'::date, 'the oldest date is used');
select is((select enrollment_source from public.members where id = 'bbbbbbbb-0000-4000-8000-000000000004'), 'fbr', 'and which record it came from');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_enrollment_set(''bbbbbbbb-0000-4000-8000-000000000004'', ''2001-06-01'', null)') $$, 'P0001', null, 'correcting a date needs a reason');
update public.members set enrollment_source = 'application' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_enrollment_set(''bbbbbbbb-0000-4000-8000-000000000001'', ''2001-06-01'', null, ''try'')') $$, 'P0001', null, 'an approved application''s date is never changed');

-- ── restoration: dues and tax returns; the date stays
select is((tests.num_as(tests.id('sg'), $$select jsonb_array_length(api.member_restore_quote('bbbbbbbb-0000-4000-8000-000000000003') -> 'lines')::bigint$$) >= 2), true, 'every unpaid year is listed');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_restore_start(''bbbbbbbb-0000-4000-8000-000000000003'', ''[]'')') $$, 'P0001', null, 'tax returns are required');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_restore_start(''bbbbbbbb-0000-4000-8000-000000000003'', ''[{"path":"aaaaaaaa-0000-4000-8000-000000000001/taxreturns/x.pdf","name":"x"}]'')') $$, 'P0001', null, 'another company''s file is refused');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_restore_start(''bbbbbbbb-0000-4000-8000-000000000003'', ''[{"path":"aaaaaaaa-0000-4000-8000-000000000003/taxreturns/x.pdf","name":"x"}]'')') $$, 'a restoration voucher is issued');
create temp table tv on commit drop as select v.id, v.voucher_no, v.amount from public.payment_vouchers v where v.ref_type = 'restoration' and v.ref_id = 'bbbbbbbb-0000-4000-8000-000000000003';
select is((select count(*) from tv), 1::bigint, 'one voucher of the restoration kind');
select is((select amount from tv), (select sum((l ->> 'amount')::int)::int from public.payment_vouchers v, jsonb_array_elements(v.lines) l where v.id = (select id from tv)), 'its amount is the sum of the years');
select is((select status::text from public.members where id = 'bbbbbbbb-0000-4000-8000-000000000003'), 'Expired', 'nothing is restored before the payment is verified');
select lives_ok(format($$ select private.restoration_paid(%L) $$, (select id from tv)), 'payment verified');
select is((select status::text from public.members where id = 'bbbbbbbb-0000-4000-8000-000000000003'), 'Permanent', 'restored');
select is((select since from public.members where id = 'bbbbbbbb-0000-4000-8000-000000000003'), '2010-01-01'::date, 'the original enrollment date is retained');
select ok((select restored_at is not null from public.members where id = 'bbbbbbbb-0000-4000-8000-000000000003'), 'the date of restoration is recorded');

-- ── renewal: a declaration is required; the period is editable with a reason
update public.members set valid_to = '2026-03-31' where id = 'bbbbbbbb-0000-4000-8000-000000000002';
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_renew_start(''bbbbbbbb-0000-4000-8000-000000000002'')') $$, 'P0001', null, 'a renewal without a declaration is refused');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_renew_start(''bbbbbbbb-0000-4000-8000-000000000002'', ''2027-01-15'', null, true)') $$, 'P0001', null, 'a changed period needs its reason');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.member_renew_start(''bbbbbbbb-0000-4000-8000-000000000002'', ''2027-01-15'', ''2027-12-31'', true, null, ''DGTO order'')') $$, 'the Secretary can start the renewal from another date');
select is((select valid_from from public.membership_requests where member_id = 'bbbbbbbb-0000-4000-8000-000000000002' and status = 'open'), '2027-01-15'::date, 'the period is kept for when it is paid');

-- ── change declarations
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.declaration_submit(''aaaaaaaa-0000-4000-8000-000000000002'', ''anytime'', ''new partner'', ''[]'', ''[{"path":"aaaaaaaa-0000-4000-8000-000000000002/declarations/x.pdf","name":"x"}]'')') $$, '42501', null, 'another company cannot declare');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.declaration_submit(''aaaaaaaa-0000-4000-8000-000000000002'', ''anytime'', ''address moved'', ''[{"field":"address","value":"New Road"},{"field":"rep_name","value":"New Rep"}]'', ''[{"path":"aaaaaaaa-0000-4000-8000-000000000002/declarations/x.pdf","name":"x"}]'')') $$, 'a change is declared with its document');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.declaration_submit(''aaaaaaaa-0000-4000-8000-000000000002'', ''anytime'', ''no file'', ''[]'', ''[]'')') $$, 'P0001', null, 'the document is required');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.declaration_submit(''aaaaaaaa-0000-4000-8000-000000000002'', ''anytime'', ''bad field'', ''[{"field":"id","value":"x"}]'', ''[{"path":"aaaaaaaa-0000-4000-8000-000000000002/declarations/x.pdf","name":"x"}]'')') $$, 'P0001', null, 'only the listed fields can change');
select is((select address from public.companies where id = 'aaaaaaaa-0000-4000-8000-000000000002'), null, 'the live profile is untouched until approved');
create temp table td on commit drop as select id from public.change_declarations where summary = 'address moved';
grant select on td to authenticated;
select throws_ok(format($$ select tests.exec_as(tests.id('membership_officer'), %L) $$, format('select api.declaration_decide(%L, true)', (select id from td))), '42501', null, 'view level cannot approve');
select lives_ok(format($$ select tests.exec_as(tests.id('president'), %L) $$, format('select api.declaration_decide(%L, true)', (select id from td))), 'the President can approve');
select is((select address from public.companies where id = 'aaaaaaaa-0000-4000-8000-000000000002'), 'New Road', 'approval updates the live profile');
select is((select rep_name from public.members where id = 'bbbbbbbb-0000-4000-8000-000000000002'), 'New Rep', 'and the representative');

-- ── accounts
create temp table ta on commit drop as select (select id from public.fin_accounts where group_code = 'A-7' and name_en = 'Electricity') as elec;
grant select on ta to authenticated;
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), %L) $$, format('select api.fin_entry_add(%L, 100, current_date, null, null, null, null, null, null)', (select elec from ta))), '42501', null, 'a member cannot enter');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.fin_entries'), 0::bigint, 'a member cannot read entries');
select lives_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.fin_entry_add(%L, 123450, ''2026-09-10'', null, ''WAPDA'', ''B1'', null, null, null)', (select elec from ta))), 'an expense is recorded, with paisa');
create temp table te on commit drop as select id from public.fin_entries where party = 'WAPDA';
grant select on te to authenticated;
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.fin_entry_verify(%L)', (select id from te))), 'P0001', null, 'the person who recorded it cannot verify it');
select is(tests.num_as(tests.id('sg'), format('select paisa from api.fin_figures(''2026-09-01'', ''2026-09-30'') where account_id = %L', (select elec from ta))), 123450::bigint, 'the figure reaches the statement');
select is((select count(*) from public.fin_groups where kind = 'expense'), 11::bigint, 'the chart has MCCI''s expense groups');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.fin_month_set(''2026-09-01'', true, ''audit done'')') $$, 'a month can be closed');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.fin_entry_add(%L, 100, ''2026-09-11'', null, null, null, null, null, null)', (select elec from ta))), 'P0001', null, 'a closed month takes no new entries');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.fin_entry_void(%L, ''wrong'')', (select id from te))), 'P0001', null, 'and nothing in it can be voided');

-- ── access changes need the password, in the database too
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.designation_add(''Media Officer'', 2::smallint, null)') $$, 'P0001', null, 'no designation without the fresh password check');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.staff_override_set(%L, ''fin'', 3::smallint, ''because'')', tests.id('mo'))), 'P0001', null, 'no personal limit without it');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), %L) $$, format('select api.service_assignees_set(''co'', array[%L]::uuid[], ''x'')', tests.id('mo'))), 'P0001', null, 'no service officer without it');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.designation_add(''Media Officer'', 2::smallint, null)') $$, '42501', null, 'only Staff & Roles Approve level adds a designation');

select * from finish();
rollback;
