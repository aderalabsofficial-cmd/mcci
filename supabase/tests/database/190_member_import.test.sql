-- Existing-member import (migration 0360): a preview writes nothing to the register; every row is checked again here;
-- existing members are matched, never overwritten without an explicit "update", and never when the platform manages
-- them; numbers and statuses are kept as in the file; commit needs the word IMPORT; the number sequences move past
-- imported numbers; created rows can be rolled back; only reg ≥ 2 (roll back reg ≥ 3) and never the public.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(34);

create temp table t_counts on commit drop as select (select count(*) from public.members) as members, (select count(*) from public.companies) as companies;
insert into storage.objects (bucket_id, name) values ('imports', 'test/members.csv');

-- the rows as lib/import/normalize.ts sends them (data + the app's issues)
create temp table t_rows on commit drop as select $j$[
  {"data": {"membership_no": "MCCI-C-7001", "class": "Corporate", "women": false, "company_name": "Gamma Mills (Pvt) Ltd", "business_type": "pvt",
            "representative_name": "Rep G", "email": "g@test.local", "member_since": "2015-04-01", "valid_to": "2027-03-31", "status": "Permanent",
            "ntn": "NTN-G", "mobile": "0300-1234567"}, "issues": []},
  {"data": {"membership_no": "MCCI-C-9001", "class": "Corporate", "company_name": "Company B (member)", "business_type": "pvt",
            "representative_name": "Changed Rep", "valid_to": "2028-03-31", "status": "Permanent"}, "issues": []},
  {"data": {"membership_no": "MCCI-A-0042", "class": "Associate", "company_name": "Company E (Endorser)", "business_type": "pvt",
            "representative_name": "Rep X", "valid_to": "2025-03-31", "status": "Expired"}, "issues": []},
  {"data": {"membership_no": "12", "class": "Corporate", "company_name": "", "representative_name": "Rep Y", "valid_to": "2027-03-31", "status": "Permanent"}, "issues": []},
  {"data": {"membership_no": "MCCI-C-7001", "class": "Corporate", "company_name": "Again", "business_type": "prop",
            "representative_name": "Rep Z", "valid_to": "2027-03-31", "status": "Permanent"}, "issues": []},
  {"data": {"membership_no": "MCCI-A-0099", "class": "Associate", "company_name": "Delta Traders", "business_type": "prop",
            "representative_name": "Rep D", "valid_to": "2027-03-31", "status": "Suspended"},
   "issues": [{"field": "valid_to", "level": "warning", "code": "low_confidence"}], "confidence": 0.6}
]$j$::jsonb as rows;
grant select on t_rows to authenticated;
create temp table t_imp (id uuid) on commit drop;
grant select, insert on t_imp to authenticated;

-- who may import
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.import_stage(''test/members.csv'', ''m.csv'', ''csv'', false, (select rows from t_rows))') $$, '42501', null, 'members cannot import');
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select * from api.import_stage(''test/members.csv'', ''m.csv'', ''csv'', false, (select rows from t_rows))') $$, '42501', null, 'read-only staff cannot import');
select throws_ok($$ select tests.exec_as_aal1(tests.id('mo'), 'select * from api.import_stage(''test/members.csv'', ''m.csv'', ''csv'', false, (select rows from t_rows))') $$, '42501', null, 'not without the 2-step login');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.import_stage(''test/missing.csv'', ''m.csv'', ''csv'', false, (select rows from t_rows))') $$, 'P0001', null, 'the uploaded file must exist in the private store');
select ok(not has_function_privilege('anon', 'api.import_stage(text,text,text,boolean,jsonb)', 'execute')
      and not has_function_privilege('anon', 'api.import_commit(uuid,text)', 'execute')
      and not has_function_privilege('authenticated', 'private.import_row_errors(jsonb)', 'execute'), 'grants: no anonymous execute; helpers are private');

-- the Membership Officer stages the file: a preview only
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'insert into t_imp select import_id from api.import_stage(''test/members.csv'', ''m.csv'', ''csv'', false, (select rows from t_rows))') $$, 'the Membership Officer stages the file');
select results_eq($$ select (select count(*) from public.members), (select count(*) from public.companies) $$, $$ select members, companies from t_counts $$, 'a preview writes nothing to the register');
select results_eq($$ select row_no, match, decision from public.import_rows where import_id = (select id from t_imp) order by row_no $$,
  $$ values (1, 'new', 'create'), (2, 'exists', 'skip'), (3, 'possible', 'skip'), (4, 'new', 'skip'), (5, 'new', 'skip'), (6, 'new', 'skip') $$,
  'matched: new / same number / same name; only a clean new row is preselected (not an error row, not a low-certainty AI row)');
select ok((select issues @> '[{"code": "membership_no", "level": "error"}]' and issues @> '[{"field": "company_name", "code": "required"}]'
             from public.import_rows where import_id = (select id from t_imp) and row_no = 4), 'the database repeats the checks (bad number, missing company)');
select is((select count(*) from public.import_rows x, jsonb_array_elements(x.issues) i where x.import_id = (select id from t_imp) and x.row_no = 4 and i ->> 'field' = 'company_name'), 1::bigint, 'a problem found by the app and the database is listed once');
select ok((select issues @> '[{"code": "duplicate_in_file"}]' from public.import_rows where import_id = (select id from t_imp) and row_no = 5), 'a number used twice in the file is an error');
select is((select status from public.imports where id = (select id from t_imp)), 'preview', 'the import is a preview');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.import_rows'), 0::bigint, 'members cannot read import rows');
select is(tests.num_as(tests.id('mo'), 'select count(*) from public.import_rows where import_id = (select id from t_imp)'), 6::bigint, 'the Membership Officer reads the preview');

-- decisions are checked
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.import_decide((select id from t_imp), 2, ''create'')') $$, 'P0001', null, 'an existing member is never created again');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.import_decide((select id from t_imp), 4, ''create'')') $$, 'P0001', null, 'a row with errors cannot be created');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.import_decide((select id from t_imp), 2, ''update'')') $$, 'P0001', null, 'a member the platform manages is never updated by a file');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.import_decide((select id from t_imp), 1, ''update'')') $$, 'P0001', null, 'a new row cannot "update"');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.import_decide((select id from t_imp), 6, ''create'')') $$, 'a low-certainty row can be chosen after checking it');
select is((select count(*) from public.audit_log where object = 'import_rows' and new_value ->> 'decision' = 'create' and user_id = tests.id('mo')), 1::bigint, 'the decision is audited');

-- commit
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.import_commit((select id from t_imp), ''yes'')') $$, 'P0001', null, 'commit needs the word IMPORT');
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.import_commit((select id from t_imp), ''IMPORT'') r where r.created = 2 and r.updated = 0 and r.skipped = 4 and r.failed = 0'), 1::bigint, 'commit: 2 created, 4 skipped');
select results_eq($$ select m.member_no, m.class::text, m.status::text, m.rep_name, m.valid_to, m.since, m.imported, m.public_listing, c.name, c.ntn, c.tel
                     from public.members m join public.companies c on c.id = m.company_id where m.member_no in ('MCCI-C-7001', 'MCCI-A-0099') order by 1 desc $$,
  $$ values ('MCCI-C-7001', 'Corporate', 'Permanent', 'Rep G', '2027-03-31'::date, '2015-04-01'::date, true, false, 'Gamma Mills (Pvt) Ltd', 'NTN-G', '0300-1234567'),
            ('MCCI-A-0099', 'Associate', 'Suspended', 'Rep D', '2027-03-31'::date, (now() at time zone 'Asia/Karachi')::date, true, false, 'Delta Traders', null, null) $$,
  'numbers, classes and statuses exactly as in the file; marked imported; not listed publicly');
select is((select rep_name from public.members where member_no = 'MCCI-C-9001'), 'Rep B', 'the existing member is unchanged');
select ok((select last_value >= 7001 from public.member_no_c), 'the Corporate number sequence moved past the imported number');
select is((select count(*) from public.applications a join public.members m on m.company_id = a.company_id where m.member_no = 'MCCI-C-7001'), 0::bigint, 'an imported member is not an applicant');
select ok((select count(*) >= 2 from public.audit_log where object = 'members' and action = 'INSERT' and reason = 'member import committed'), 'each created member is audited with the reason');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.import_commit((select id from t_imp), ''IMPORT'')') $$, 'P0001', null, 'an import is committed once');

-- roll back (reg ≥ 3); a member in use is kept
insert into public.company_users (company_id, user_id, role)
select m.company_id, tests.id('fresh'), 'Owner' from public.members m where m.member_no = 'MCCI-A-0099';
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.import_rollback((select id from t_imp))') $$, '42501', null, 'the Membership Officer cannot roll back');
select is(tests.num_as(tests.id('sg'), 'select count(*) from api.import_rollback((select id from t_imp)) r where r.removed = 1 and r.kept = 1'), 1::bigint, 'the SG rolls back: one removed, one kept (someone signs in for it)');
select is((select count(*) from public.members where member_no = 'MCCI-C-7001'), 0::bigint, 'the created member and its company are gone');
select ok((select last_value >= 7001 from public.member_no_c), 'the sequence does not go back (a number is never handed out twice)');

-- an imported member (not managed on the platform) can be updated when an admin chooses it
update public.members set imported = true where member_no = 'MCCI-C-9001';
insert into storage.objects (bucket_id, name) values ('imports', 'test/again.csv');
truncate t_imp;
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'insert into t_imp select import_id from api.import_stage(''test/again.csv'', ''a.csv'', ''csv'', false, (select jsonb_build_array(rows -> 1) from t_rows)); select api.import_decide((select id from t_imp), 1, ''update''); select * from api.import_commit((select id from t_imp), ''IMPORT'')') $$,
  'an admin chooses "update" for an imported member and commits');
select is((select rep_name || ' ' || valid_to from public.members where member_no = 'MCCI-C-9001'), 'Changed Rep 2028-03-31', 'the member takes the file''s values (old values in the audit log)');

select * from finish();
rollback;
