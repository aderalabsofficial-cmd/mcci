-- Release 3 proposer & seconder (migration 0320): eligibility, request / withdraw / remind, inbox, one-time code,
-- sign / decline, automatic move to committee, hourly job, Members Register (add member + owner invitation).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(36);

-- company A applies as a Pvt Ltd (Corporate); members B and E (Corporate) can endorse
update public.applications set form = '{"biz":"pvt","rep":"Owner A","name":"A Industries"}', stage = 'draft'
 where id = tests.id('app_a_draft');
create temp table t_e (role text, id uuid) on commit drop;
grant select on t_e to authenticated;

-- candidates: applicant only, ineligible members carry the reason
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'select * from api.end_candidates(tests.id(''app_a_draft''), ''proposer'')') $$, '42501', null, 'a Viewer cannot choose endorsers');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.end_candidates(tests.id(''app_a_draft''), ''proposer'')') $$, '42501', null, 'another company cannot see the picker for this application');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.end_candidates(tests.id(''app_a_draft''), ''proposer'') c where c.member_no = ''MCCI-C-9001'' and c.why is null'), 1::bigint, 'member B is eligible');
update public.applications set form = form || '{"biz":"prop"}' where id = tests.id('app_a_draft');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.end_candidates(tests.id(''app_a_draft''), ''proposer'') c where c.member_no = ''MCCI-C-9001'' and c.why like ''Different class%'''), 1::bigint, 'a different class is shown with the reason');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.end_request(tests.id(''app_a_draft''), ''proposer'', tests.id(''member_b''), ''Please'')') $$, 'P0001', null, 'the server refuses a forged request for an ineligible member');
update public.applications set form = form || '{"biz":"pvt"}' where id = tests.id('app_a_draft');

-- request
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.end_request(tests.id(''app_a_draft''), ''proposer'', tests.id(''member_b''), ''Kindly be my proposer'') r where r.email = ''owner.b@test.local'''), 1::bigint, 'the applicant asks member B; B''s owner is the contact to email');
insert into t_e select 'proposer', id from public.endorsements where application_id = tests.id('app_a_draft') and role = 'proposer';
select is((select status::text from public.endorsements where id = (select id from t_e where role = 'proposer')), 'Pending', 'request is pending');
select ok((select expires_at > now() + interval '6 days' from public.endorsements where id = (select id from t_e where role = 'proposer')), 'it expires after the configured days');
select is((select count(*) from public.notifications where user_id = tests.id('owner_b') and title = 'New proposer request'), 1::bigint, 'B''s owner gets a portal message');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.end_request(tests.id(''app_a_draft''), ''seconder'', tests.id(''member_b''), '''')') $$, 'P0001', null, 'the same member cannot be both');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.end_request(tests.id(''app_a_draft''), ''proposer'', tests.id(''member_e''), '''')') $$, 'P0001', null, 'one live request per role');

-- inbox and privacy
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from api.end_inbox() i where i.business = ''A Industries'' and i.status = ''Pending'''), 1::bigint, 'the endorser sees the request with the applicant summary');
select is(tests.num_as(tests.id('owner_e'), 'select count(*) from api.end_inbox() i where i.business = ''A Industries'''), 0::bigint, 'other members do not');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.application_documents'), 0::bigint, 'the endorser never reads documents (docs/04 AC 6)');

-- remind (applicant once a day, officers)
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.end_remind((select id from t_e where role = ''proposer''))') $$, 'the applicant sends a reminder');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.end_remind((select id from t_e where role = ''proposer''))') $$, 'P0001', null, 'not twice within 24 hours');
update public.endorsements set last_reminded_at = now() - interval '2 days' where id = (select id from t_e where role = 'proposer');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.end_remind((select id from t_e where role = ''proposer''))') $$, 'an officer can remind too');

-- one-time code: issued by the server (service role) only; wrong codes count; the right one signs
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.end_code_issue((select id from t_e where role = ''proposer''), tests.id(''owner_b''))') $$, '42501', null, 'a browser session cannot get the code itself');
select throws_ok(format('select * from api.end_code_issue(%L, %L)', (select id from t_e where role = 'proposer'), tests.id('owner_a')), '42501', null, 'the code is only issued for the endorser''s own users');
create temp table t_code on commit drop as select code from api.end_code_issue((select id from t_e where role = 'proposer'), tests.id('owner_b'));
grant select on t_code to authenticated;
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.end_sign((select id from t_e where role = ''proposer''), (select code from t_code), ''I propose'', ''x/s.png'', null, null, null)') $$, '42501', null, 'the applicant cannot sign for the endorser');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from (select api.end_sign((select id from t_e where role = ''proposer''), ''000000x'', ''I propose'', ''x/s.png'', null, null, null) r) s where r = ''wrong_code'''), 1::bigint, 'a wrong code is refused');
select is((select attempts from private.endorsement_otps where endorsement_id = (select id from t_e where role = 'proposer')), 1::smallint, 'and counted');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from (select api.end_sign((select id from t_e where role = ''proposer''), (select code from t_code), ''I propose this application'', ''x/s.png'', null, ''203.0.113.9'', ''test'') r) s where r = ''signed'''), 1::bigint, 'the right code signs');
select results_eq($$ select status::text, ref ~ '^[0-9A-F]{12}$', otp_verified_at is not null, host(ip) from public.endorsements where id = (select id from t_e where role = 'proposer') $$,
  $$ values ('Approved', true, true, '203.0.113.9') $$, 'approved with reference, code time and address');
select is((select count(*) from private.endorsement_otps where endorsement_id = (select id from t_e where role = 'proposer')), 0::bigint, 'the code is gone after use');

-- decline, then another member; both signed while in "proposer" → committee
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.end_request(tests.id(''app_a_draft''), ''seconder'', tests.id(''member_e''), ''Kindly second'')') $$, 'the applicant asks member E to second');
insert into t_e select 'seconder', id from public.endorsements where application_id = tests.id('app_a_draft') and role = 'seconder' and status = 'Pending';
select throws_ok($$ select tests.exec_as(tests.id('owner_e'), 'select api.end_decline((select id from t_e where role = ''seconder''), '' '')') $$, 'P0001', null, 'declining needs a reason');
select lives_ok($$ select tests.exec_as(tests.id('owner_e'), 'select api.end_decline((select id from t_e where role = ''seconder''), ''I do not know the applicant'')') $$, 'E declines');
select is((select count(*) from public.notifications where user_id = tests.id('owner_a') and title = 'Your seconder declined'), 1::bigint, 'the applicant is told');
update public.applications set stage = 'proposer' where id = tests.id('app_a_draft');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.end_request(tests.id(''app_a_draft''), ''seconder'', tests.id(''member_e''), ''Please reconsider'')') $$, 'after a decline the applicant can ask again');
update public.endorsements set status = 'Approved', decided_at = now() where application_id = tests.id('app_a_draft') and role = 'seconder' and status = 'Pending';
select ok(private.endorse_advance(tests.id('app_a_draft')), 'both signed in "proposer" → moves on');
select is((select stage::text from public.applications where id = tests.id('app_a_draft')), 'committee', 'the application is with the committee');

-- hourly job: expiry
insert into public.endorsements (application_id, role, endorser_member_id, expires_at, status)
values (tests.id('app_a_review'), 'seconder', tests.id('member_b'), now() - interval '1 hour', 'Pending');
select ok((select count(*) from api.end_jobs() j where j.kind = 'expired') >= 1, 'expired requests are closed by the job');

-- Members Register: staff add an existing member and invite its owner
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.member_add(''X'', ''prop'', ''Associate'', null, ''Rep X'', null, ''2027-03-31'', null, false, ''x@test.local'', ''X'')') $$, '42501', null, 'members cannot add members');

select is(tests.num_as(tests.id('mo'), 'select count(*) from api.member_add(''Bosan Traders'', ''prop'', ''Associate'', ''MCCI-A-2301'', ''Imran Bosan'', ''2018-04-01'', ''2027-03-31'', ''trade'', false, ''imran@test.local'', ''Imran Bosan'') m where m.member_no = ''MCCI-A-2301'' and m.token is not null'), 1::bigint, 'an officer adds an existing member; the owner gets an invitation link');
select results_eq($$ select m.status::text, m.imported, (select count(*) from public.invitations i where i.company_id = m.company_id and i.company_role = 'Owner' and i.status = 'Invited')::int from public.members m where m.member_no = 'MCCI-A-2301' $$,
  $$ values ('Permanent', true, 1) $$, 'permanent, marked as imported, owner invited');

select * from finish();
rollback;
