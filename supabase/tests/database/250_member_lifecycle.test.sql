-- Member lifecycle (migration 0440, docs/22 §3): blacklist / whitelist with an audited reason (whitelisting required
-- before renewal, not tied to the ATL), staff-started renewal paid through Accounts (year to the next 31 March),
-- manual restoration by the Membership Officer, partner email / address required, a declined file's number kept
-- reserved unless MCCI allows re-use, and demo members never renewed or restored.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(31);

-- member B: active until 31 March of the current membership year
update public.members set valid_to = private.year_end_of(current_date), status = 'Permanent' where id = tests.id('member_b');

-- ───────── blacklist / whitelist ─────────
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select api.member_blacklist(tests.id(''member_b''), true, ''FBR list'')') $$, '42501', null, 'read-only staff cannot blacklist');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_blacklist(tests.id(''member_b''), true, '' '')') $$, 'P0001', null, 'a reason is required');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_blacklist(tests.id(''member_b''), true, ''Listed on the FBR notice of 1 Oct'')') $$, 'the officer records the blacklisting');
select ok((select count(*) from public.audit_log where object = 'members' and reason like 'blacklisted:%') >= 1, 'audited with the reason');

-- ───────── renewal: blocked while blacklisted ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_renew_start(tests.id(''member_b''))') $$, 'P0001', null, 'renewal refused while blacklisted');
select is((select count(*) from public.payment_vouchers where ref_type = 'renewal' and ref_id = tests.id('member_b')), 0::bigint, 'no renewal voucher');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_blacklist(tests.id(''member_b''), false, '''')') $$, 'P0001', null, 'whitelisting needs the evidence');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_blacklist(tests.id(''member_b''), false, ''FBR whitelisting letter No. 77 seen'')') $$, 'whitelisted with evidence');
select results_eq($$ select blacklisted, whitelisted_at is not null, whitelist_note from public.members where id = tests.id('member_b') $$,
  $$ values (false, true, 'FBR whitelisting letter No. 77 seen') $$, 'the clearance is kept on the record');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_blacklist(tests.id(''member_b''), false, ''again'')') $$, 'P0001', null, 'cannot whitelist someone not blacklisted');

-- ───────── renewal ─────────
select throws_ok($$ select tests.exec_as(tests.id('auditor'), 'select api.member_renew_start(tests.id(''member_b''))') $$, '42501', null, 'read-only staff cannot renew');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_renew_start(tests.id(''member_b''))') $$, 'the officer starts the renewal');
select results_eq($$ select amount, status::text, jsonb_array_length(lines) from public.payment_vouchers where ref_type = 'renewal' and ref_id = tests.id('member_b') $$,
  $$ values (12000, 'Unpaid', 1) $$, 'a renewal voucher: the annual subscription only');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_renew_start(tests.id(''member_b''))') $$, 'P0001', null, 'one open renewal voucher at a time');
select is((select count(*) from public.notifications where company_id = tests.id('company_b') and template = 'renewal.voucher'), 1::bigint, 'the member is told');
select lives_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select * from api.pay_counter((select voucher_no from public.payment_vouchers where ref_type = ''renewal'' and ref_id = tests.id(''member_b'')), ''MCCI-CASH-0100'')') $$, 'Accounts verify the renewal fee');
select results_eq($$ select status::text, valid_to from public.members where id = tests.id('member_b') $$,
  $$ values ('Permanent', (private.year_end_of(current_date) + interval '1 year')::date) $$, 'valid to the next 31 March (never 12 months from today)');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_renew_start(tests.id(''member_b''))') $$, 'P0001', null, 'a year already renewed is not renewed again');

-- ───────── restoration ─────────
update public.members set status = 'Expired', valid_to = '2024-03-31' where id = tests.id('member_e');
select throws_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select api.member_restore(tests.id(''member_e''), ''Dues for 2024-26 paid at the counter'')') $$, '42501', null, 'Accounts (reg 1) cannot restore');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_restore(tests.id(''member_e''), ''x'')') $$, 'P0001', null, 'a reason is required');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_restore(tests.id(''member_e''), ''Dues for 2024-26 paid at the counter, receipt 5512'')') $$, 'the Membership Officer restores by hand');
select results_eq($$ select status::text, valid_to = private.year_end_of(current_date), restored_at is not null from public.members where id = tests.id('member_e') $$,
  $$ values ('Permanent', true, true) $$, 'active to this year''s 31 March');
select ok((select count(*) from public.audit_log where object = 'members' and reason like 'restored by the Membership Officer:%') >= 1, 'audited with the reason');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_restore(tests.id(''member_e''), ''again please'')') $$, 'P0001', null, 'an active membership is not restored');

-- ───────── demo members ─────────
update public.companies set demo = true, demo_expires_at = now() + interval '7 days' where id = tests.id('company_e');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.member_renew_start(tests.id(''member_e''))') $$, 'P0001', null, 'demo members are never renewed');
update public.companies set demo = false, demo_expires_at = null where id = tests.id('company_e');

-- ───────── partner email / address required ─────────
update public.applications set form = '{"biz":"aop"}' where id = tests.id('app_a_review');
select ok(private.app_missing(tests.id('app_a_review')) @> array['partnerContacts'], 'a partner without email / address blocks submission');
update public.application_partners set email = 'p1@test.local', address = 'Multan' where application_id = tests.id('app_a_review');
select ok(not private.app_missing(tests.id('app_a_review')) @> array['partnerContacts'], 'complete once every partner has both');

-- ───────── a declined file keeps its number reserved (MCCI may allow re-use) ─────────
insert into public.committee_assignments (convener, members, status, proposed_by, decided_by, decided_at)
values (tests.id('cs'), '{}', 'Approved', tests.id('sg'), tests.id('president'), now());
update public.applications set stage = 'committee', class = 'Corporate', member_no = 'C-881' where id = tests.id('app_b_draft');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_b_draft''), ''Rejected'', ''Outside jurisdiction'')') $$, 'declined');
select is((select member_no from public.applications where id = tests.id('app_b_draft')), 'C-881', 'the number stays reserved by default');
update private.settings set value = value || '{"releaseNumberOnDecline": true}' where key = 'membership';
update public.applications set stage = 'committee', member_no = 'C-882' where id = tests.id('app_a_draft');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_draft''), ''Rejected'', ''Duplicate application'')') $$, 'declined with re-use allowed');
select is((select member_no from public.applications where id = tests.id('app_a_draft')), null, 'the number is released when MCCI allows re-use');

select * from finish();
rollback;
