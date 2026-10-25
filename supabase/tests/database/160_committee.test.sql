-- Release 4 Membership Committee (migration 0330): meetings, automatic agenda, approve / defer / reject with the
-- permission, stage and duplicate checks in the database, membership number allocation, the payment voucher from the
-- fee settings, bilingual portal messages, minutes, and what members and other staff can and cannot do.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(47);

create temp table t_today on commit drop as select (now() at time zone 'Asia/Karachi')::date as d;
grant select on t_today to authenticated;

-- ───────── meetings: who may schedule ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today))') $$, '42501', null, 'a Membership Officer (cmt 0) cannot schedule');
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today))') $$, '42501', null, 'view-only staff cannot schedule');
select throws_ok($$ select tests.exec_as_aal1(tests.id('cs'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today))') $$, '42501', null, 'not without the 2-step login');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today))') $$, '42501', null, 'members cannot');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_meeting_create(''Board'', ''X'', (select d from t_today))') $$, 'P0001', null, 'only the known committees');
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.cmt_meeting_create(''Membership Committee'', ''MC #12'', (select d from t_today)) r where r.meeting_id ~ ''^MC-\d{4}-\d{2,}$'''), 1::bigint, 'the Committee Secretary schedules today''s meeting; the id is MC-<year>-<n>');
create temp table t_m on commit drop as select id, name from public.meetings where name in ('MC #12');
grant select on t_m to authenticated;

-- ───────── agenda: a file reaching the committee is placed automatically ─────────
update public.applications set class = 'Corporate', women = false, stage = 'proposer',
       form = '{"biz":"pvt","rep":"Owner A","name":"A Industries"}' where id = tests.id('app_a_review');
update public.applications set stage = 'committee' where id = tests.id('app_a_review');
select results_eq($$ select meeting_id, item_no, decision from public.committee_items where application_id = tests.id('app_a_review') $$,
  $$ select id, 1, null::text from t_m $$, 'placed as item 1 on the open meeting');
select is((select count(*) from public.application_history where application_id = tests.id('app_a_review') and step = 'agenda'), 1::bigint, 'the agenda step is in the history');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.committee_items'), 1::bigint, 'the applicant sees their agenda item');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.committee_items'), 0::bigint, 'other companies do not');

-- a second meeting (tomorrow) for the deferral
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC #13'', (select d + 1 from t_today))') $$, 'the SG schedules the next meeting');
insert into t_m select id, name from public.meetings where name = 'MC #13';

-- ───────── decisions: who, which state, which meeting ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #12''), ''Approved'')') $$, '42501', null, 'an officer cannot decide');
select throws_ok($$ select tests.exec_as(tests.id('president'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #12''), ''Approved'')') $$, '42501', null, 'cmt 1 (view) cannot decide');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #12''), ''Approved'')') $$, '42501', null, 'the applicant cannot approve themselves');
select throws_ok($$ select tests.exec_as_aal1(tests.id('cs'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #12''), ''Approved'')') $$, '42501', null, 'the Committee Secretary needs the 2-step login');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #13''), ''Approved'')') $$, 'P0001', null, 'not on a meeting the file is not on');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #12''), ''Deferred'', '' '')') $$, 'P0001', null, 'a deferral needs the committee''s reason');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #12''), ''Maybe'', ''x y z'')') $$, 'P0001', null, 'only approve, defer or reject');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide(tests.id(''app_a_draft''), (select id from t_m where name = ''MC #12''), ''Approved'')') $$, 'P0001', null, 'a draft cannot be decided');

-- defer → placed on the next meeting; the applicant is told in their language
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #12''), ''Deferred'', ''Bring the latest NTN certificate'') r where r.next_meeting = (select id from t_m where name = ''MC #13'')'), 1::bigint, 'deferred; moved to the next meeting');
select is((select stage::text from public.applications where id = tests.id('app_a_review')), 'committee', 'still with the committee');
select is((select count(*) from public.notifications where user_id = tests.id('owner_a') and template = 'committee.deferred' and vars ->> 'reason' = 'Bring the latest NTN certificate'), 1::bigint, 'portal message with a template for both languages');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #13''), ''Approved'')') $$, 'P0001', null, 'no decision before the meeting date');

-- approve on the next meeting (now held): number, voucher, stage, email, message
update public.meetings set held_on = (select d from t_today) where id = (select id from t_m where name = 'MC #13');
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #13''), ''Approved'') r where r.member_no ~ ''^MCCI-C-\d+$'' and r.voucher_no ~ ''^PV-\d{4}-\d{4,}$'' and r.amount = 17500 and r.to_email = ''owner.a@test.local'''), 1::bigint, 'approved: Corporate number, voucher of Rs. 17,500 (5,000 + 12,000 + 500), applicant to email');
create temp table t_ok on commit drop as select member_no from public.applications where id = tests.id('app_a_review');
grant select on t_ok to authenticated;
select results_eq($$ select stage::text, decided_at is not null from public.applications where id = tests.id('app_a_review') $$, $$ values ('payment', true) $$, 'the application waits for payment');
select results_eq($$ select v.ref_type, v.amount, v.status::text, jsonb_array_length(v.lines), v.due_at > now() + interval '6 days', v.company_id
                     from public.payment_vouchers v where v.ref_type = 'membership' and v.ref_id = tests.id('app_a_review') and v.id <> tests.id('voucher_a_unpaid') $$,
  $$ values ('membership', 17500, 'Unpaid', 3, true, tests.id('company_a')) $$, 'one Unpaid membership voucher with 3 lines, due after the configured days');
select is((select count(*) from public.email_log where application_id = tests.id('app_a_review') and template_key = 'membership_approved_voucher' and status = 'queued'), 1::bigint, 'the voucher email is queued for the app to send');
select is((select count(*) from public.notifications where user_id = tests.id('owner_a') and template = 'committee.approved' and vars ->> 'no' = (select member_no from t_ok)), 1::bigint, 'the applicant sees the approval with the number');
select is((select count(*) from public.audit_log where object = 'committee_items' and reason like 'committee approved%'), 1::bigint, 'the decision is in the audit log with the reason');

-- no second decision, no second number
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide(tests.id(''app_a_review''), (select id from t_m where name = ''MC #13''), ''Approved'')') $$, 'P0001', null, 'a decided file cannot be decided again');
select throws_ok($$ insert into public.committee_items (application_id, meeting_id, decision) values (tests.id('app_a_review'), 'MC-TEST-1', 'Rejected') $$, '23505', null, 'the database allows one final decision per application');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.applications set member_no = ''MCCI-C-1'' where id = tests.id(''app_a_review'')') $$, '42501', null, 'nobody changes the number from the browser');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.member_add(''Copy Co'', ''prop'', ''Corporate'', (select member_no from t_ok), ''Rep'', null, ''2027-03-31'', null, false, ''c@test.local'', ''C'')') $$, 'P0001', null, 'the register cannot reuse an allocated number');
insert into public.members (member_no, company_id, class, status, rep_name, since, valid_to)
select 'MCCI-A-' || (last_value + case when is_called then 1 else 0 end), tests.id('company_e'), 'Associate', 'Permanent', 'Typed Number', '2020-01-01', '2027-03-31'
from public.member_no_a;
select ok((select private.alloc_member_no('Associate') <> (select max(member_no) from public.members where rep_name = 'Typed Number')), 'allocation skips a number already typed into the register');

-- reject: reason required, final
update public.applications set class = 'Corporate', stage = 'committee' where id = tests.id('app_b_draft');
select is((select count(*) from public.committee_items where application_id = tests.id('app_b_draft') and decision is null), 1::bigint, 'company B''s file is on the agenda');
select throws_ok(format('select tests.exec_as(tests.id(''cs''), %L)', format('select * from api.cmt_decide(tests.id(''app_b_draft''), %L, ''Rejected'', '''')', (select meeting_id from public.committee_items where application_id = tests.id('app_b_draft')))), 'P0001', null, 'rejecting needs the committee''s reason');
select lives_ok(format('select tests.exec_as(tests.id(''cs''), %L)', format('select * from api.cmt_decide(tests.id(''app_b_draft''), %L, ''Rejected'', ''Outside the Chamber''''s jurisdiction'')', (select meeting_id from public.committee_items where application_id = tests.id('app_b_draft')))), 'the committee rejects with a reason');
select results_eq($$ select stage::text, reject_note, member_no from public.applications where id = tests.id('app_b_draft') $$,
  $$ values ('rejected', 'Outside the Chamber''s jurisdiction', null::text) $$, 'rejected, reason kept, no number');

-- approve all: Women rates and an extra partner card
insert into public.applications (id, company_id, created_by, stage, class, women, form)
values ('a1000000-0000-0000-0000-0000000000c3', tests.id('company_a'), tests.id('owner_a'), 'proposer', 'Associate', true, '{"biz":"prop","name":"A Women Traders"}');
insert into public.application_partners (application_id, position, name, extra_card) values ('a1000000-0000-0000-0000-0000000000c3', 1, 'Partner Two', true);
update public.applications set stage = 'committee' where id = 'a1000000-0000-0000-0000-0000000000c3';
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select * from api.cmt_approve_all((select id from t_m where name = ''MC #12''))') $$, '42501', null, 'view-only staff cannot approve all');
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.cmt_approve_all((select meeting_id from public.committee_items where application_id = ''a1000000-0000-0000-0000-0000000000c3'')) r where r.member_no ~ ''^MCCI-A-'' and r.amount = 8500'), 1::bigint, 'approve all: Women 2,000 + 5,000 + 500 and one extra card 1,000 = 8,500');

-- voucher view: the company and staff; the bank stays "to be confirmed"
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.voucher_view((select voucher_no from public.payment_vouchers where ref_type = ''membership'' and ref_id = tests.id(''app_a_review'') and id <> tests.id(''voucher_a_unpaid''))) v where v.amount = 17500 and (v.bank ->> ''confirmed'')::boolean = false'), 1::bigint, 'the applicant reads the voucher; bank details not confirmed yet');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.voucher_view((select voucher_no from public.payment_vouchers where ref_type = ''membership'' and ref_id = tests.id(''app_a_review'') and id <> tests.id(''voucher_a_unpaid'')))') $$, '42501', null, 'another company cannot');
select throws_ok($$ select tests.exec_as(null, 'select * from api.voucher_view(''PV-2026-0001'')') $$, '42501', null, 'anonymous cannot');

-- minutes
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select api.cmt_minutes((select id from t_m where name = ''MC #12''), ''Minutes'')') $$, '42501', null, 'view-only staff cannot record minutes');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select api.cmt_minutes((select id from t_m where name = ''MC #12''), ''Item 1 deferred; item 2 rejected.'')') $$, 'the Committee Secretary records the minutes');
select is((select status from public.meetings where id = (select id from t_m where name = 'MC #12')), 'Approved', 'the meeting shows its minutes as approved');

-- grants: nothing new for anonymous; helpers unreachable
select ok(not has_function_privilege('anon', 'api.cmt_decide(uuid,text,text,text)', 'execute')
      and not has_function_privilege('anon', 'api.cmt_meeting_create(text,text,date)', 'execute')
      and not has_function_privilege('authenticated', 'private.alloc_member_no(public.member_class)', 'execute')
      and not has_function_privilege('authenticated', 'private.cmt_decide_one(uuid,text,text,text)', 'execute')
      and not has_function_privilege('service_role', 'private.app_fee(uuid)', 'execute'), 'committee functions: no anonymous execute, helpers private');

select * from finish();
rollback;
