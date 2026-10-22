-- Payment vouchers and receipts. Findings F-02, F-23.
select no_plan();

-- NT-20 / NT-21 (F-02): no client can change a voucher
select throws_ok($$ select tests.exec_as(tests.id('accounts_a'), 'update public.payment_vouchers set amount = 1 where id = tests.id(''voucher_a_unpaid'')') $$, '42501', null, 'NT-20 Accounts user cannot change the amount');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.payment_vouchers set lines = ''[]'' where id = tests.id(''voucher_a_unpaid'')') $$, '42501', null, 'NT-20 Owner cannot change the lines');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.payment_vouchers set status = ''Paid'' where id = tests.id(''voucher_a_unpaid'')') $$, '42501', null, 'NT-20 Owner cannot mark a voucher paid');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'update public.payment_vouchers set amount = 1') $$, '42501', null, 'NT-21 other company cannot touch vouchers');
select throws_ok($$ select tests.exec_as(tests.id('accounts_staff'), 'update public.payment_vouchers set status = ''Paid'' where id = tests.id(''voucher_a_unpaid'')') $$, '42501', null, 'staff verify only through api.pay_verify (M6)');

-- money fields are immutable after creation, for every path including the owner and trusted functions
select throws_ok($$ update public.payment_vouchers set amount = 1 where id = tests.id('voucher_a_unpaid') $$, '23514', null, 'F-02 amount immutable even for the owner role');
select throws_ok($$ update public.payment_vouchers set lines = '[]' where id = tests.id('voucher_a_unpaid') $$, '23514', null, 'F-02 lines immutable');
select throws_ok($$ update public.payment_vouchers set ref_id = tests.id('app_a_draft') where id = tests.id('voucher_a_unpaid') $$, '23514', null, 'F-02 reference immutable');
select lives_ok($$ update public.payment_vouchers set status = 'Cancelled' where id = tests.id('voucher_a_unpaid') $$, 'status can still move (through api.* in M6)');

-- NT-22 / F-23: receipts are never written or rewritten by clients; history is kept
select throws_ok($$ select tests.exec_as(tests.id('accounts_a'), 'insert into public.payment_receipts (voucher_id, company_id, path) values (tests.id(''voucher_a_unpaid''), tests.id(''company_a''), ''p'')') $$, '42501', null, 'NT-22 receipts only through api.receipt_upload (M6)');
select ok(not has_table_privilege('authenticated', 'public.payment_receipts', 'UPDATE'), 'F-23 receipts cannot be overwritten by clients');
select ok(not has_table_privilege('authenticated', 'public.payment_receipts', 'DELETE'), 'F-23 receipts cannot be deleted by clients');
select has_column('public', 'payment_receipts', 'bank_ref', 'F-23 bank reference captured (uniqueness: decision D-M9)');
select is((select provider from public.payment_vouchers where id = tests.id('voucher_a_paid')), 'manual', 'manual provider only this phase');
select throws_ok($$ insert into public.payment_vouchers (company_id, ref_type, ref_id, lines, amount, due_at, provider)
                    values (tests.id('company_a'), 'service', tests.id('app_a_draft'), '[]', 0, now(), 'card') $$, '23514', null, 'no gateway provider in this phase (docs/00)');

-- visibility follows the company role pay level (docs/06): Services = 0
select is(tests.num_as(tests.id('services_a'), 'select count(*) from public.payment_vouchers'), 0::bigint, 'Services user (pay 0) sees no vouchers');
select is(tests.num_as(tests.id('accounts_a'), 'select count(*) from public.payment_vouchers'), 2::bigint, 'Accounts user sees company vouchers');
select is(tests.num_as(tests.id('viewer_a'), 'select count(*) from public.payment_vouchers'), 2::bigint, 'Viewer (pay 1) sees them read-only');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.payment_vouchers'), 0::bigint, 'other company sees none');
select is(tests.num_as(tests.id('accounts_staff'), 'select count(*) from public.payment_vouchers'), 2::bigint, 'Accounts Officer (pay 3) sees all');
select is(tests.num_as(tests.id('cs'), 'select count(*) from public.payment_vouchers'), 0::bigint, 'Committee Secretary (pay 0) sees none');

-- voucher numbers: PV-<year>-<counter>, never truncated
select matches((select voucher_no from public.payment_vouchers where id = tests.id('voucher_a_unpaid')), '^PV-[0-9]{4}-[0-9]{4,}$', 'voucher number format');

select * from finish();
