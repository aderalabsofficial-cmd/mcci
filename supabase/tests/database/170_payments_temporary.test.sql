-- Release 5 payments and temporary membership (migration 0340): receipt upload only once the bank account is
-- confirmed, Accounts verify / reject / counter payment, automatic temporary membership (member, certificate with QR,
-- print queue, company particulars), extend / revoke / expiry job, public verification, QR revoke, voucher cancel /
-- reissue / expiry, and who may do what.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(56);

-- an approved application of company A (through the committee functions of 0330)
create temp table t_x on commit drop as select (now() at time zone 'Asia/Karachi')::date as d;
grant select on t_x to authenticated;
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_meeting_create(''Membership Committee'', ''MC R5'', (select d from t_x))') $$, 'meeting');
update public.applications set class = 'Corporate', women = false, stage = 'proposer',
       form = '{"biz":"pvt","rep":"Owner A","name":"A Industries (Pvt) Ltd","address":"1 Industrial Estate, Multan","ntn":"7654321-0"}'
 where id = tests.id('app_a_review');
-- since 0430: forwarded with a typed number; the Convener of the approved committee decides
insert into public.committee_assignments (convener, members, status, proposed_by, decided_by, decided_at)
values (tests.id('cs'), '{}', 'Approved', tests.id('sg'), tests.id('president'), now());
update public.applications set stage = 'committee', member_no = 'C-701' where id = tests.id('app_a_review');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_a_review''), ''Approved'')') $$, 'approved');
create temp table t_v on commit drop as
  select id, voucher_no, company_id from public.payment_vouchers
  where ref_type = 'membership' and ref_id = tests.id('app_a_review') and id <> tests.id('voucher_a_unpaid');
grant select on t_v to authenticated;
select is((select count(*) from t_v), 1::bigint, 'one new membership voucher');

-- ───────── no receipts before MCCI confirms the bank account ─────────
insert into storage.objects (bucket_id, name) select 'receipts', company_id || '/vouchers/' || id || '/r1.jpg' from t_v;
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.pay_upload((select voucher_no from t_v), (select company_id || ''/vouchers/'' || id || ''/r1.jpg'' from t_v))') $$,
  'P0001', null, 'receipt refused while the bank account is "to be confirmed"');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into storage.objects (bucket_id, name) select ''receipts'', company_id || ''/vouchers/'' || id || ''/x.jpg'' from t_v') $$,
  '42501', null, 'the storage policy refuses the upload too');

-- bank account: settings.save (plat ≥ 2); a placeholder IBAN never passes
select throws_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select api.settings_bank_save(''Bank X'', ''MCCI'', ''PK36SCBL0000001123456702'', ''Multan'', true)') $$, '42501', null, 'Accounts cannot set the bank account');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.settings_bank_save(''Bank X'', ''MCCI'', ''PK00 XXXX 0000 0000 0000 0000'', ''Multan'', true)') $$, 'P0001', null, 'the placeholder IBAN is refused');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.settings_bank_save(''Bank X'', ''MCCI'', ''12345'', ''Multan'', true)') $$, 'P0001', null, 'an invalid IBAN is refused');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.settings_bank_save(''Bank X'', ''Multan Chamber of Commerce & Industry'', ''pk36scbl0000001123456702'', ''Multan'', true)') $$, 'the SG confirms the bank account');
select is((select value ->> 'iban' from private.settings where key = 'bank'), 'PK36 SCBL 0000 0011 2345 6702', 'stored normalised');
select is(tests.num_as(tests.id('accounts_staff'), 'select count(*) from (select api.settings_bank()) s'), 1::bigint, 'Accounts read it');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.settings_bank()') $$, '42501', null, 'members read it only on their voucher');

-- ───────── upload ─────────
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'select * from api.pay_upload((select voucher_no from t_v), (select company_id || ''/vouchers/'' || id || ''/r1.jpg'' from t_v))') $$, '42501', null, 'a Viewer cannot upload');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.pay_upload((select voucher_no from t_v), (select company_id || ''/vouchers/'' || id || ''/r1.jpg'' from t_v))') $$, '42501', null, 'another company cannot');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.pay_upload((select voucher_no from t_v), ''a0000000-0000-0000-0000-00000000000a/vouchers/x/none.jpg'')') $$, 'P0001', null, 'the file must be stored for this voucher');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.pay_upload((select voucher_no from t_v), (select company_id || ''/vouchers/'' || id || ''/r1.jpg'' from t_v), null, ''TRX-77'') r where r.to_email = ''owner.a@test.local'''), 1::bigint, 'the Owner uploads; the applicant is emailed');
select results_eq($$ select v.status::text, (select count(*) from public.payment_receipts r where r.voucher_id = v.id and r.status = 'Submitted')::int from public.payment_vouchers v where v.id = (select id from t_v) $$,
  $$ values ('Receipt uploaded', 1) $$, 'voucher waits for Accounts with one submitted receipt');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.pay_upload((select voucher_no from t_v), (select company_id || ''/vouchers/'' || id || ''/r1.jpg'' from t_v))') $$, 'P0001', null, 'no second receipt while one waits');

-- ───────── reject, re-upload, verify → temporary membership ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.pay_reject((select voucher_no from t_v), ''Unreadable'')') $$, '42501', null, 'a Membership Officer (pay 1) cannot reject');
select throws_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select * from api.pay_reject((select voucher_no from t_v), '' '')') $$, 'P0001', null, 'rejecting needs a reason');
select lives_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select * from api.pay_reject((select voucher_no from t_v), ''The amount on the slip is not readable'')') $$, 'Accounts reject the receipt');
select is((select status::text from public.payment_vouchers where id = (select id from t_v)), 'Rejected', 'voucher Rejected');
select is((select count(*) from public.notifications where company_id = tests.id('company_a') and template = 'payment.rejected'), 1::bigint, 'the company sees why');
insert into storage.objects (bucket_id, name) select 'receipts', company_id || '/vouchers/' || id || '/r2.jpg' from t_v;
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.pay_upload((select voucher_no from t_v), (select company_id || ''/vouchers/'' || id || ''/r2.jpg'' from t_v))') $$, 'a clear receipt again');
select throws_ok($$ select tests.exec_as_aal1(tests.id('accounts_staff'), 'select * from api.pay_verify((select voucher_no from t_v))') $$, '42501', null, 'verifying needs the 2-step login');
select is(tests.num_as(tests.id('accounts_staff'), 'select count(*) from api.pay_verify((select voucher_no from t_v)) r where r.temp_code ~ ''^MCCI-QR-'' and r.member_no = ''C-701'''), 1::bigint, 'verified: temporary membership issued in the same request');
select results_eq($$ select a.stage::text, m.status::text, m.member_no = a.member_no, m.valid_to = private.membership_year_end()
                     from public.applications a join public.members m on m.id = a.member_id where a.id = tests.id('app_a_review') $$,
  $$ values ('temp', 'Temporary', true, true) $$, 'member Temporary with the committee''s number, valid to 31 March');
select results_eq($$ select t.status::text, t.expires_at between now() + interval '59 days' and now() + interval '61 days', d.status::text, d.kind::text,
                       (select count(*) from public.print_items p where p.member_id = t.member_id and p.status = 'queued')::int
                     from public.temp_memberships t join public.documents d on d.id = t.certificate_doc
                     where t.member_id = (select member_id from public.applications where id = tests.id('app_a_review')) $$,
  $$ values ('active', true, 'Temporary', 'temp_certificate', 1) $$, '60-day temporary membership, certificate with QR, queued for printing');
select is((select name from public.companies where id = tests.id('company_a')), 'A Industries (Pvt) Ltd', 'the company record takes the approved particulars');
select is((select count(*) from public.email_log where application_id = tests.id('app_a_review') and template_key = 'temp_issued'), 1::bigint, 'temp_issued email queued');
select throws_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select * from api.pay_verify((select voucher_no from t_v))') $$, 'P0001', null, 'no second verification');
create temp table t_c on commit drop as
  select d.code, t.id as temp_id from public.temp_memberships t join public.documents d on d.id = t.certificate_doc
  where t.member_id = (select member_id from public.applications where id = tests.id('app_a_review'));
grant select on t_c to authenticated, service_role;

-- ───────── certificate and public verification ─────────
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.cert_view((select code from t_c)) c where c.company = ''A Industries (Pvt) Ltd'' and c.temp_status = ''active'''), 1::bigint, 'the member opens the certificate');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.cert_view((select code from t_c))') $$, '42501', null, 'other companies cannot');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.doc_verify((select code from t_c))') $$, '42501', null, 'browsers do not call the verification directly');
select results_eq($$ select status, company, member_no is not null from api.doc_verify((select code from t_c)) $$,
  $$ values ('Temporary', 'A Industries (Pvt) Ltd', true) $$, 'public verification: Temporary, company, number');
select is((select scans from public.documents where code = (select code from t_c)), 1, 'the scan is counted');
select is((select count(*) from api.doc_verify('MCCI-QR-AAAAA-AAAAA')), 0::bigint, 'an unknown code shows nothing');

-- ───────── extend, expire, revoke ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.temp_extend((select temp_id from t_c), ''Printer late'')') $$, '42501', null, 'only temp level 3 (SG) extends');
update public.temp_memberships set expires_at = now() - interval '1 hour' where id = (select temp_id from t_c);
select ok((select count(*) from api.temp_jobs() j where j.kind = 'expired') >= 1, 'the job expires it');
select results_eq($$ select t.status::text, m.status::text, d.status::text from public.temp_memberships t join public.members m on m.id = t.member_id
                     join public.documents d on d.id = t.certificate_doc where t.id = (select temp_id from t_c) $$,
  $$ values ('expired', 'TempExpired', 'Expired') $$, 'temp, member and QR show expired');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select * from api.temp_extend((select temp_id from t_c), ''Security printer delayed'')') $$, 'the SG extends it');
select results_eq($$ select t.status::text, t.extensions::int, m.status::text, d.status::text from public.temp_memberships t join public.members m on m.id = t.member_id
                     join public.documents d on d.id = t.certificate_doc where t.id = (select temp_id from t_c) $$,
  $$ values ('active', 1, 'Temporary', 'Temporary') $$, 'active again for 30 days');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select * from api.temp_extend((select temp_id from t_c), ''Again'')') $$, 'P0001', null, 'not beyond the maximum extensions');
update public.temp_memberships set expires_at = now() + interval '10 days', alerts_sent = '{}' where id = (select temp_id from t_c);
select ok((select count(*) from api.temp_jobs() j where j.kind = 'alert_15') >= 1, '15-day alert sent');
select is((select count(*) from api.temp_jobs() j where j.kind = 'alert_15'), 0::bigint, 'only once');

-- ───────── counter payment (company B) and voucher cancel / reissue / expiry ─────────
update public.applications set class = 'Corporate', stage = 'committee', member_no = 'C-702', form = '{"biz":"pvt","rep":"Owner B","name":"B Traders"}' where id = tests.id('app_b_draft');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select * from api.cmt_decide_direct(tests.id(''app_b_draft''), ''Approved'')') $$, 'B approved');
select throws_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select * from api.pay_counter((select voucher_no from public.payment_vouchers where ref_id = tests.id(''app_b_draft'')), '' '')') $$, 'P0001', null, 'a counter payment needs the receipt reference');
select is(tests.num_as(tests.id('accounts_staff'), 'select count(*) from api.pay_counter((select voucher_no from public.payment_vouchers where ref_id = tests.id(''app_b_draft'')), ''MCCI-CASH-0007'') r where r.temp_code is not null'), 1::bigint, 'paid at the counter: temporary membership issued');
select is((select method from public.payment_receipts where voucher_id = (select id from public.payment_vouchers where ref_id = tests.id('app_b_draft'))), 'counter', 'recorded as a counter payment');
select lives_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select api.voucher_cancel((select voucher_no from public.payment_vouchers where id = tests.id(''voucher_a_unpaid'')), ''Duplicate test voucher'')') $$, 'Accounts cancel an unpaid voucher');
select throws_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'select api.voucher_reissue((select voucher_no from public.payment_vouchers where id = tests.id(''voucher_a_unpaid'')))') $$, 'P0001', null, 'no reissue while the membership is paid');
insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at)
values (tests.id('company_e'), 'service', gen_random_uuid(), '[{"label":"X","amount":1}]', 1, now() - interval '1 day');
select ok(api.voucher_jobs() >= 1, 'past-due Unpaid vouchers expire');

-- ───────── QR revoke, grants ─────────
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.qr_revoke((select code from t_c), ''Issued in error'')') $$, '42501', null, 'docs level 3 revokes');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.qr_revoke((select code from t_c), ''Issued in error'')') $$, 'the SG revokes a document');
select ok(not has_function_privilege('anon', 'api.pay_upload(text,text,text,text)', 'execute')
      and not has_function_privilege('authenticated', 'api.doc_verify(text)', 'execute')
      and not has_function_privilege('authenticated', 'api.temp_jobs()', 'execute')
      and not has_function_privilege('authenticated', 'private.temp_issue(uuid)', 'execute')
      and has_function_privilege('service_role', 'api.doc_verify(text)', 'execute'), 'grants: browsers get the api functions only; jobs and verification are server-side');
select ok(not has_function_privilege('anon', 'private.voucher_accepts_receipt(uuid,uuid)', 'execute')
      and has_function_privilege('authenticated', 'private.voucher_accepts_receipt(uuid,uuid)', 'execute'),
  'the receipt storage check: uploaders (authenticated) only, not anonymous or PUBLIC');

select * from finish();
rollback;
