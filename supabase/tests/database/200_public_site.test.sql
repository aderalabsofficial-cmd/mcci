-- Public website data (migration 0370): only the app's server (service role) calls these; visitors and signed-in users
-- cannot; nothing returns a name, contact or document; demo companies are never shown; the directory lists only
-- members who chose to be listed.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);

-- who may call
select ok(not has_function_privilege('anon', 'api.site_stats()', 'execute')
      and not has_function_privilege('anon', 'api.site_feed(int)', 'execute')
      and not has_function_privilege('anon', 'api.site_track(text)', 'execute')
      and not has_function_privilege('anon', 'api.site_contact(text,text,text,text,text,text,text)', 'execute'), 'visitors cannot call the site functions directly');
select ok(not has_function_privilege('authenticated', 'api.site_track(text)', 'execute')
      and not has_function_privilege('authenticated', 'api.site_contact(text,text,text,text,text,text,text)', 'execute'), 'nor signed-in users');
select ok(has_function_privilege('service_role', 'api.site_stats()', 'execute')
      and has_function_privilege('service_role', 'api.site_contact(text,text,text,text,text,text,text)', 'execute'), 'the app server can');

-- nothing personal in what they return
select is((select string_agg(x::text, ',' order by x::text collate "C") from unnest((select proargnames from pg_proc where proname = 'site_track')) x),
  'decided_at,due_at,kind,p_token,printing,status,submitted_at,token', 'site_track: kind, token, status, dates and a printing flag — no names');
select is((select string_agg(x::text, ',' order by x::text collate "C") from unnest((select proargnames from pg_proc where proname = 'site_feed')) x),
  'at,kind,p_limit,status,token', 'site_feed: kind, token, status, time — no names');

-- a real token shows its stage
update public.applications set submitted_at = now() - interval '1 day' where id = tests.id('app_a_review');
select is((select status from api.site_track((select token from public.applications where id = tests.id('app_a_review')))), 'review', 'a submitted application shows its stage');
select is((select count(*) from api.site_track((select token from public.applications where id = tests.id('app_a_draft')))), 0::bigint, 'a draft is not trackable');
select is((select count(*) from api.site_track('MCCI-2099-M-9999')), 0::bigint, 'an unknown token finds nothing');

-- demo data stays out of the public figures and the feed
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select * from api.demo_add(''member'', ''Site Demo'', ''Associate'', ''Rep'', ''sitedemo@test.local'', ''Rep'')') $$, 'a demo member exists');
select is((select members from api.site_stats()), (select count(*)::int from public.members m join public.companies c on c.id = m.company_id
            where not c.demo and m.status in ('Permanent', 'Temporary')), 'the member count leaves demo members out');
update public.members set public_listing = true where member_no like 'DEMO-%';
select is((select count(*) from public.public_directory where member_no like 'DEMO-%'), 0::bigint, 'the public directory never lists a demo company');
select is((select count(*) from public.public_directory where member_no = 'MCCI-C-9001'), 0::bigint, 'a member who chose not to be listed is not listed');

-- contact form
select is((select count(*) from api.site_contact('contact', 'Test Visitor', 'visitor@test.local', 'Hello', null, null, 'A question about membership')), 1::bigint, 'a message creates a ticket');
select results_eq($$ select subject, email::text, status::text, created_by from public.tickets where name = 'Test Visitor' $$,
  $$ values ('Hello', 'visitor@test.local', 'Open', null::uuid) $$, 'the ticket keeps the subject and the email; nobody is signed in');
select throws_ok($$ select * from api.site_contact('contact', 'X', '', '', null, null, '') $$, 'P0001', null, 'empty fields are refused');

select * from finish();
rollback;
