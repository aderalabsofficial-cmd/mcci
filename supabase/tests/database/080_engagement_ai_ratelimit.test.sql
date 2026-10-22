-- Notifications, settings, tickets, change requests, opportunities, events, AI cost guard, rate limits.
-- Findings F-16, F-19, F-22, NT-47 (PostgreSQL rate-limit fallback, decision 3).
-- Runs in its own transaction and rolls back (supabase test db / pg_prove run each file in a separate session).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(36);

-- NT-46 (F-19): company notifications follow the company role's area level (default for decision D-M11)
select is(tests.num_as(tests.id('services_a'), 'select count(*) from public.notifications'), 1::bigint, 'NT-46 Services user (pay 0) does not see the payment notice');
select is(tests.num_as(tests.id('accounts_a'), 'select count(*) from public.notifications'), 2::bigint, 'Accounts user sees payment + service notices');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.notifications'), 0::bigint, 'other companies see none');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'update public.notifications set title = ''x''') $$, '42501', null, 'only read_at is writable');
select is(tests.num_as(tests.id('owner_a'), 'with u as (update public.notifications set read_at = now() returning 1) select count(*) from u'), 0::bigint, 'company-wide notices are not marked read by one user (per-user read state: gap in docs/17)');

-- NT-48 (F-16): settings
select is(tests.num_as(null, 'select count(*) from public.public_settings'), 4::bigint, 'NT-48 anonymous sees the 4 whitelisted keys');
select is(tests.num_as(null, 'select count(*) from public.public_settings where key in (''bank'', ''endorse'', ''temp'')'), 0::bigint, 'NT-48 internal settings are not public');
select throws_ok($$ select tests.exec_as(null, 'select count(*) from private.settings') $$, '42501', null, 'private settings closed to anonymous');
select throws_ok($$ select tests.exec_as(tests.id('sg'), 'select api.settings_for_server()') $$, '42501', null, 'server settings function is service-role only');
select is(tests.num_as(null, 'select count(*) from jsonb_object_keys(api.settings_for_server())', 'service_role'), 12::bigint, 'service role reads all 12 settings for PDFs and jobs');
select is((select value ->> 'dueDays' from private.settings where key = 'voucher'), '7', 'voucher.dueDays mapped from prototype psidDays');

-- tickets
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.tickets (company_id, subject, body) values (tests.id(''company_a''), ''Help'', ''Question'')') $$, 'member opens a ticket for own company');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.tickets (company_id, subject, body) values (tests.id(''company_b''), ''x'', ''y'')') $$, '42501', null, 'not for another company');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.tickets'), 0::bigint, 'other companies cannot read it');
select matches((select public_ref from public.tickets limit 1), '^[0-9a-f]{32}$', 'tracking reference is random (B6)');

-- change requests: Owner only (docs/06 profile.change → profile 3)
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.change_requests (company_id, field, new_value) values (tests.id(''company_a''), ''address'', ''New address'')') $$, 'Owner requests a change of particulars');
select throws_ok($$ select tests.exec_as(tests.id('manager_a'), 'insert into public.change_requests (company_id, field, new_value) values (tests.id(''company_a''), ''address'', ''x'')') $$, '42501', null, 'Manager (profile 1) cannot');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.change_requests (company_id, field, new_value, status) values (tests.id(''company_a''), ''address'', ''x'', ''Approved'')') $$, '42501', null, 'cannot self-approve');

-- trade opportunities: member posts start Pending (decision D-M17)
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.opportunities (kind, company_id, title, body) values (''requirement'', tests.id(''company_a''), ''Need cotton'', ''100 bales'')') $$, 'member posts a requirement');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.opportunities'), 0::bigint, 'a pending post is not visible to other members');
update public.opportunities set status = 'Published';
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.opportunities'), 1::bigint, 'once published it is visible');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.opportunities (kind, company_id, title, body) values (''inquiry'', tests.id(''company_a''), ''x'', ''y'')') $$, '42501', null, 'members cannot post MCCI buyer inquiries');

-- events: unpublished events are invisible
insert into public.events (id, title, starts_at) values ('e7000000-0000-0000-0000-000000000001', 'Draft event', now() + interval '10 days');
select is(tests.num_as(null, 'select count(*) from public.events'), 0::bigint, 'unpublished event invisible to the public');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.event_registrations (event_id, company_id) values (''e7000000-0000-0000-0000-000000000001'', tests.id(''company_a''))') $$, '42501', null, 'cannot register for an unpublished event');

-- NT-36 (F-22): AI cost guard, 15 extraction calls per application per day (docs/08)
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'select count(api.ai_extraction_begin(tests.id(''app_a_draft''), ''cnic'')) from generate_series(1, 15)') $$, '15 extractions in a day are allowed');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.ai_extraction_begin(tests.id(''app_a_draft''), ''cnic'')') $$, 'P0001', null, 'NT-36 the 16th extraction is refused');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.ai_extraction_begin(tests.id(''app_a_draft''), ''cnic'')') $$, '42501', null, 'cannot spend another company''s quota');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.ai_extraction_begin(tests.id(''app_a_review''), ''cnic'')') $$, '42501', null, 'no AI filling after submission');
-- NT-35 (F-22): extraction results stay within the company
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.ai_extractions'), 0::bigint, 'NT-35 other company reads no extraction results');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.ai_extractions'), 15::bigint, 'own company reads its results');
-- Ask AI history is private to the user
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into public.ai_conversations (messages) values (''[{"q":"fees?"}]'')') $$, 'user stores own conversation');
select is(tests.num_as(tests.id('manager_a'), 'select count(*) from public.ai_conversations'), 0::bigint, 'colleagues cannot read it');
select is(tests.num_as(tests.id('sg'), 'select count(*) from public.ai_conversations'), 0::bigint, 'staff cannot read it');

-- NT-47 (decision 3): PostgreSQL rate-limit fallback for trusted handlers
select is(tests.num_as(null, 'select count(*) filter (where api.rate_limit_take(''verify:ip:203.0.113.7'', 3, 60)) from generate_series(1, 5)', 'service_role'), 3::bigint, 'NT-47 3 of 5 calls allowed with limit 3');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.rate_limit_take(''x'', 1000, 60)') $$, '42501', null, 'members cannot reset or probe limits');
select throws_ok($$ select tests.exec_as(null, 'select api.rate_limit_take(''x'', 1, 0)', 'service_role') $$, '22023', null, 'invalid window rejected');

select * from finish();
rollback;
