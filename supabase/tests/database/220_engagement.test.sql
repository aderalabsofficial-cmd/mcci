-- Engagement (migration 0490): each person's own read state; events by engagement staff, registration by a company
-- with event rights, once, while seats last; tickets with replies on both sides, assign and resolve by staff; posts
-- by engagement staff, only Live ones public.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

create temp table t_ev (id uuid) on commit drop;
create temp table t_tk (id text) on commit drop;
grant select, insert on t_ev, t_tk to authenticated;

-- messages: read state per person
insert into public.notifications (company_id, area, title, body) values (tests.id('company_a'), 'mship', 'Hello A', 'For company A');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.note_read((select id from public.notifications where title = ''Hello A''))') $$, 'a member marks a company notice read');
select is((select count(*) from public.notification_reads r join public.notifications n on n.id = r.notification_id where n.title = 'Hello A' and r.user_id = tests.id('owner_a')), 1::bigint, 'read for that person');
select is(tests.num_as(tests.id('manager_a'), 'select count(*) from public.notification_reads'), 0::bigint, 'a colleague''s read state is their own');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.note_read((select id from public.notifications where title = ''Hello A''))') $$, 'P0001', null, 'another company''s notice cannot be marked');
select ok(tests.num_as(tests.id('manager_a'), 'select api.note_read_all()') >= 1, 'mark all read');

-- events
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select api.ev_save(null, ''Trade Fair'', null, ''Fair'', now() + interval ''10 days'', ''MCCI Hall'', 1, null, null, true)') $$, '42501', null, 'members cannot create events');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.ev_save(null, ''Trade Fair'', null, ''Fair'', now() + interval ''10 days'', ''MCCI Hall'', 1, null, null, true)') $$, '42501', null, 'eng 1 cannot create events');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'insert into t_ev select api.ev_save(null, ''Trade Fair'', ''تجارتی میلہ'', ''Fair'', now() + interval ''10 days'', ''MCCI Hall'', 1, ''Exporters meet buyers'', null, true)') $$, 'the Committee Secretary (eng 2) creates a published event with one seat');
select is((select count(*) from public.events where id = (select id from t_ev) and published), 1::bigint, 'it is published');
select throws_ok($$ select tests.exec_as(tests.id('viewer_a'), 'select * from api.event_register((select id from t_ev), tests.id(''company_a''))') $$, '42501', null, 'a Viewer cannot register the company');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from api.event_register((select id from t_ev), tests.id(''company_a'')) r where r.ticket_code is not null'), 1::bigint, 'the Owner registers the company');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.event_register((select id from t_ev), tests.id(''company_a''))') $$, 'P0001', null, 'once per company');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.event_register((select id from t_ev), tests.id(''company_b''))') $$, 'P0001', null, 'no seats left');
insert into public.events (id, title, starts_at, seats, published) values ('e7000000-0000-0000-0000-000000000077', 'Seminar', now() + interval '20 days', 5, true);
insert into public.event_registrations (event_id, company_id) values ('e7000000-0000-0000-0000-000000000077', tests.id('company_a')), ('e7000000-0000-0000-0000-000000000077', tests.id('company_b'));
select throws_ok($$ select tests.exec_as(tests.id('cs'), 'select api.ev_save(''e7000000-0000-0000-0000-000000000077'', ''Seminar'', null, null, now() + interval ''20 days'', null, 1, null, null, true)') $$, 'P0001', null, 'seats cannot go below the registrations');

-- tickets
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'insert into t_tk select api.ticket_new(tests.id(''company_a''), ''Certificate delay'', ''Our certificate has not arrived yet.'')') $$, 'a member opens a ticket');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.tickets where id = (select id from t_tk)'), 0::bigint, 'another company does not see it');
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.ticket_reply((select id from t_tk), ''We are checking with the printer.'') r where r.staff and r.to_email is not null'), 1::bigint, 'staff reply; the requester is emailed');
select is((select status::text from public.tickets where id = (select id from t_tk)), 'In progress', 'the ticket is in progress');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select * from api.ticket_resolve((select id from t_tk), ''done'')') $$, '42501', null, 'eng 1 cannot resolve');
select is(tests.num_as(tests.id('cs'), 'select count(*) from api.ticket_resolve((select id from t_tk), ''Delivered today.'')'), 1::bigint, 'resolved by staff');
select lives_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.ticket_reply((select id from t_tk), ''Not received yet, sorry.'')') $$, 'the member replies');
select is((select status::text from public.tickets where id = (select id from t_tk)), 'Open', 'a member reply reopens it');

-- content
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.post_save(null, ''News'', ''Hello'', null, ''Body text'', null, ''Live'')') $$, '42501', null, 'eng 1 cannot publish');
select lives_ok($$ select tests.exec_as(tests.id('cs'), 'select api.post_save(null, ''News'', ''Visitors see this'', null, ''Live body'', null, ''Live''); select api.post_save(null, ''Notice'', ''Draft only'', null, ''Draft body'', null, ''Draft'')') $$, 'engagement staff write a Live post and a draft');
select results_eq($$ select title from public.posts where title in ('Visitors see this', 'Draft only') and status = 'Live' and published_at is not null $$, $$ values ('Visitors see this') $$, 'only the Live post is published (visitors read status = Live, 0210 posts_select)');

select * from finish();
rollback;
