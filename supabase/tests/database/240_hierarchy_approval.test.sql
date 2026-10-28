-- Hierarchy and approval (migration 0430): new designations, the SG assigns the Membership Committee and the President
-- approves it, proposer / seconder consent only, the officer types the number and forwards, the Convener decides.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(28);

select is((select count(*) from public.designations
            where name in ('Membership Committee Convener', 'Membership Committee Member', 'IT Convener')), 3::bigint,
  'three new designations');

-- ───────── the committee: SG proposes, President approves ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.cmt_assign_propose(tests.id(''cs''), array[tests.id(''auditor'')])') $$,
  '42501', null, 'only the Secretary General assigns the committee');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.cmt_assign_propose(tests.id(''owner_a''), ''{}'')') $$,
  'P0001', null, 'the Convener must be a staff account');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.cmt_assign_propose(tests.id(''mo''), ''{}'')') $$,
  'P0001', null, 'the Convener needs Membership Committee access (a Membership Officer has none)');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.cmt_assign_propose(tests.id(''cs''), array[tests.id(''auditor''), tests.id(''cs'')], ''for 2026–27'')') $$,
  'the SG proposes the Committee Secretary as Convener with one member');
select results_eq($$ select status, members = array[tests.id('auditor')] from public.committee_assignments $$,
  $$ values ('Pending', true) $$, 'waiting for the President; the Convener is not repeated among the members');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.cmt_assign_decide((select id from public.committee_assignments where status = ''Pending''), true)') $$,
  '42501', null, 'the SG cannot approve their own assignment');
select throws_ok($$ select tests.exec_as(tests.id('president'), 'select api.cmt_assign_decide((select id from public.committee_assignments where status = ''Pending''), false)') $$,
  'P0001', null, 'not approving needs a reason');
select lives_ok($$ select tests.exec_as(tests.id('president'), 'select api.cmt_assign_decide((select id from public.committee_assignments where status = ''Pending''), true)') $$,
  'the President approves');
select is((select status from public.committee_assignments), 'Approved', 'the committee is in force');

-- ───────── proposer / seconder: consent only ─────────
update public.applications set stage = 'proposer', class = 'Corporate', member_no = null where id = tests.id('app_a_review');
insert into public.endorsements (application_id, role, endorser_member_id, expires_at)
values (tests.id('app_a_review'), 'seconder', tests.id('member_b'), now() + interval '7 days');
select ok(not has_function_privilege('authenticated', 'api.end_sign(uuid,text,text,text,text,text,text)', 'execute'),
  'the code-and-signature path is retired');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.end_approve(tests.id(''endorsement_1''))') $$,
  '42501', null, 'only the chosen member approves their own request');
select lives_ok($$ select tests.exec_as(tests.id('owner_e'), 'select api.end_approve(tests.id(''endorsement_1''), ''203.0.113.5'', ''test'')') $$,
  'the proposer approves in their portal — no code, no signature');
select lives_ok($$ select tests.exec_as(tests.id('owner_b'),
  'select api.end_approve((select id from public.endorsements where application_id = tests.id(''app_a_review'') and role = ''seconder''))') $$,
  'the seconder approves');
select results_eq($$ select stage::text, (select count(*) from public.endorsements where application_id = tests.id('app_a_review') and status = 'Approved' and signature_path is null)
                     from public.applications where id = tests.id('app_a_review') $$,
  $$ values ('proposer', 2::bigint) $$, 'both consents in; the file waits for the officer (nothing moves by itself)');

-- ───────── the officer types the number and forwards ─────────
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select api.app_forward(tests.id(''app_a_review''), ''C-201'')') $$,
  '42501', null, 'read-only staff cannot forward');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_forward(tests.id(''app_a_review''), ''A-201'')') $$,
  'P0001', null, 'A is for Associate: this file is Corporate');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_forward(tests.id(''app_a_review''), ''C-9002'')') $$,
  'P0001', null, 'a number already in the register (MCCI-C-9002) is refused');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_forward(tests.id(''app_a_review''), ''201'')') $$,
  'P0001', null, 'the class letter is required');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.app_forward(tests.id(''app_a_review''), ''c 0201'')') $$,
  'the Membership Officer forwards with No. C-201');
select results_eq($$ select stage::text, member_no from public.applications where id = tests.id('app_a_review') $$,
  $$ values ('committee', 'C-201') $$, 'with the committee, number as typed (normalised)');
select is((select count(*) from public.committee_items where application_id = tests.id('app_a_review')), 0::bigint,
  'not placed on any meeting agenda');

-- ───────── the Convener decides ─────────
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$,
  '42501', null, 'the SG does not approve: only the Convener');
select throws_ok($$ select tests.exec_as_aal1(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$,
  '42501', null, 'the Convener needs the 2-step login');
select lives_ok($$ select tests.exec_as(tests.id('auditor'), 'select api.cmt_note(tests.id(''app_a_review''), ''Checked the NTN myself.'')') $$,
  'a committee member leaves a note for the Convener');
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Rejected'')') $$,
  'P0001', null, 'declining needs a reason');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$,
  'the Convener approves');
select results_eq($$ select a.stage::text, a.decided_at::date = current_date, a.member_no,
                            (select count(*) from public.payment_vouchers v where v.ref_id = a.id and v.ref_type = 'membership' and v.created_at = now())
                       from public.applications a where a.id = tests.id('app_a_review') $$,
  $$ values ('payment', true, 'C-201', 1::bigint) $$, 'fee voucher issued; date of enrollment = today; the typed number is kept');

select * from finish();
rollback;
