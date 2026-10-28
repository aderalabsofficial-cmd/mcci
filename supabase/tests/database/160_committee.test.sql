-- Membership Committee (0330; decisions since 0430): meetings and minutes stay as a record and no file is placed on an
-- agenda; the Convener of the committee the President approved approves, declines or returns every forwarded file;
-- the payment voucher from the fee settings; bilingual portal messages; what members and other staff cannot do.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(40);

create temp table t_today on commit drop as select (now() at time zone 'Asia/Karachi')::date as d;
grant select on t_today to authenticated;

-- ───────── meetings (a record): who may schedule ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today))') $$, '42501', null, 'a Membership Officer (cmt 0) cannot schedule');
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today))') $$, '42501', null, 'view-only staff cannot schedule');
select throws_ok($$ select tests.exec_as_aal1(tests.id('cs'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today))') $$, '42501', null, 'not without the 2-step login');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today))') $$, '42501', null, 'members cannot');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_meeting_create(''Board'', ''X'', (select d from t_today))') $$, 'P0001', null, 'only the known committees');
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today)) r where r.meeting_id ~ ''^MC-\d{4}-\d{2,}$'''), 1::bigint, 'the Committee Secretary schedules today''s meeting; the id is MC-<year>-<n>');
create temp table t_m on commit drop as select id, name from public.meetings where name in ('MC #12');
grant select on t_m to authenticated;

-- ───────── a forwarded file: no agenda needed ─────────
update public.applications set class = 'Corporate', women = false, stage = 'committee', member_no = 'C-501',
       form = '{"biz":"pvt","rep":"Owner A","name":"A Industries"}' where id = tests.id('app_a_review');
select is((select count(*) from public.committee_items where application_id = tests.id('app_a_review')), 0::bigint, 'not placed on any agenda (0430)');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.committee_items'), 0::bigint, 'other companies see no agenda items');

-- the committee in force: the Committee Secretary as Convener, the President as a member
insert into public.committee_assignments (convener, members, status, proposed_by, decided_by, decided_at)
values (tests.id('cs'), array[tests.id('president')], 'Approved', tests.id('sg'), tests.id('president'), now());

-- ───────── decisions: who and which state ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$, '42501', null, 'an officer cannot decide');
select throws_ok($$ select tests.exec_as(tests.id('president'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$, '42501', null, 'a committee member is not the Convener');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$, '42501', null, 'the SG does not decide');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$, '42501', null, 'the applicant cannot approve themselves');
select throws_ok($$ select tests.exec_as_aal1(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$, '42501', null, 'the Convener needs the 2-step login');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Returned'', '' '')') $$, 'P0001', null, 'returning needs the reason');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Maybe'', ''x y z'')') $$, 'P0001', null, 'only approve, decline or return');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_draft''), ''Approved'')') $$, 'P0001', null, 'a draft cannot be decided');
select ok(not has_function_privilege('authenticated', 'api.cmt_decide(uuid,text,text,text)', 'execute')
      and not has_function_privilege('authenticated', 'api.cmt_approve_all(text)', 'execute'), 'the meeting path no longer decides');

-- return to the officer, who forwards again
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.cmt_decide_direct(tests.id(''app_a_review''), ''Returned'', ''Bring the latest NTN certificate'') r where r.member_no = ''C-501'''), 1::bigint, 'returned to the Membership Officer');
select is((select stage::text from public.applications where id = tests.id('app_a_review')), 'proposer', 'back with the officer, number kept');
update public.endorsements set status = 'Approved', decided_at = now() where id = tests.id('endorsement_1');
insert into public.endorsements (application_id, role, endorser_member_id, expires_at, status, decided_at)
values (tests.id('app_a_review'), 'seconder', tests.id('member_b'), now() + interval '7 days', 'Approved', now());
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_forward(tests.id(''app_a_review''), ''C-501'')') $$, 'the officer forwards again');

-- approve: voucher, stage, email, message, audit
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'') r where r.member_no = ''C-501'' and r.voucher_no ~ ''^PV-\d{4}-\d{4,}$'' and r.amount = 17500 and r.to_email = ''owner.a@test.local'''), 1::bigint, 'approved: the typed number, voucher of Rs. 17,500 (5,000 + 12,000 + 500), applicant to email');
select results_eq($$ select stage::text, decided_at is not null from public.applications where id = tests.id('app_a_review') $$, $$ values ('payment', true) $$, 'the application waits for payment; date of enrollment recorded');
select results_eq($$ select v.ref_type, v.amount, v.status::text, jsonb_array_length(v.lines), v.due_at > now() + interval '6 days', v.company_id
                     from public.payment_vouchers v where v.ref_type = 'membership' and v.ref_id = tests.id('app_a_review') and v.id <> tests.id('voucher_a_unpaid') and v.created_at = now() $$,
  $$ values ('membership', 17500, 'Unpaid', 3, true, tests.id('company_a')) $$, 'one Unpaid membership voucher with 3 lines, due after the configured days');
select is((select count(*) from public.email_log where application_id = tests.id('app_a_review') and template_key = 'membership_approved_voucher' and status = 'queued'), 1::bigint, 'the voucher email is queued for the app to send');
select is((select count(*) from public.notifications where user_id = tests.id('owner_a') and template = 'committee.approved' and vars ->> 'no' = 'C-501'), 1::bigint, 'the applicant sees the approval with the number');
select ok((select count(*) from public.audit_log where object = 'applications' and reason like 'Convener: approved%') >= 1, 'the decision is in the audit log with the reason');

-- no second decision, no number from the browser
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$, 'P0001', null, 'a decided file cannot be decided again');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.applications set member_no = ''C-1'' where id = tests.id(''app_a_review'')') $$, '42501', null, 'nobody changes the number from the browser');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_forward(tests.id(''app_a_review''), ''C-502'')') $$, 'P0001', null, 'an approved file is not forwarded again');

-- decline: reason required, final, the number stays reserved unless MCCI allows re-use
update public.applications set class = 'Corporate', stage = 'committee', member_no = 'C-502' where id = tests.id('app_b_draft');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_b_draft''), ''Rejected'', '''')') $$, 'P0001', null, 'declining needs the reason');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_b_draft''), ''Rejected'', ''Outside the Chamber''''s jurisdiction'')') $$, 'the Convener declines with a reason');
select results_eq($$ select stage::text, reject_note, member_no from public.applications where id = tests.id('app_b_draft') $$,
  $$ values ('rejected', 'Outside the Chamber''s jurisdiction', 'C-502') $$, 'declined, reason kept, number kept reserved (MCCI policy default, 0440)');

-- Women rates and an extra partner card
insert into public.applications (id, company_id, created_by, stage, class, women, member_no, form)
values ('a1000000-0000-0000-0000-0000000000c3', tests.id('company_a'), tests.id('owner_a'), 'committee', 'Associate', true, 'A-601', '{"biz":"prop","name":"A Women Traders"}');
insert into public.application_partners (application_id, position, name, extra_card) values ('a1000000-0000-0000-0000-0000000000c3', 1, 'Partner Two', true);
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.cmt_decide_direct(''a1000000-0000-0000-0000-0000000000c3'', ''Approved'') r where r.member_no = ''A-601'' and r.amount = 8500'), 1::bigint, 'Women 2,000 + 5,000 + 500 and one extra card 1,000 = 8,500');

-- voucher view: the company and staff; the bank stays "to be confirmed"
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.voucher_view((select voucher_no from public.payment_vouchers where ref_type = ''membership'' and ref_id = tests.id(''app_a_review'') and id <> tests.id(''voucher_a_unpaid'') and created_at = now())) v where v.amount = 17500 and (v.bank ->> ''confirmed'')::boolean = false'), 1::bigint, 'the applicant reads the voucher; bank details not confirmed yet');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.voucher_view((select voucher_no from public.payment_vouchers where ref_type = ''membership'' and ref_id = tests.id(''app_a_review'') and id <> tests.id(''voucher_a_unpaid'') and created_at = now()))') $$, '42501', null, 'another company cannot');
select throws_ok($$ select tests.exec_as(null, 'select * from api.voucher_view(''PV-2026-0001'')') $$, '42501', null, 'anonymous cannot');

-- minutes
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select api.cmt_minutes((select id from t_m where name = ''MC #12''), ''Minutes'')') $$, '42501', null, 'view-only staff cannot record minutes');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select api.cmt_minutes((select id from t_m where name = ''MC #12''), ''Two files approved, one declined.'')') $$, 'the Committee Secretary records the minutes');
select is((select status from public.meetings where id = (select id from t_m where name = 'MC #12')), 'Approved', 'the meeting shows its minutes as approved');

-- grants: nothing for anonymous; helpers unreachable
select ok(not has_function_privilege('anon', 'api.cmt_decide_direct(uuid,text,text)', 'execute')
      and not has_function_privilege('anon', 'api.app_forward(uuid,text)', 'execute')
      and not has_function_privilege('anon', 'api.cmt_meeting_create(text,text,date)', 'execute')
      and not has_function_privilege('authenticated', 'private.is_convener()', 'execute')
      and not has_function_privilege('authenticated', 'private.typed_member_no(text)', 'execute')
      and not has_function_privilege('service_role', 'private.app_fee(uuid)', 'execute'), 'committee functions: no anonymous execute, helpers private');

select * from finish();
rollback;
