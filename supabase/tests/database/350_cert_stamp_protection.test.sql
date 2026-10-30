-- A certificate whose QR copy is not saved yet stays with staff (migration 0550): members never get the original scan.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);

create temp table _d on commit drop as select code from public.documents where id = tests.id('cert_b');
grant select on _d to authenticated;
insert into public.certificate_scans (id, path, file_name, sha256, status, document_id, match_member)
values ('5c000000-0000-0000-0000-000000000001', 'scans/5c000000-0000-0000-0000-000000000001/original.png', 'scan.png',
        repeat('a', 64), 'confirmed', tests.id('cert_b'), tests.id('member_b'));
update public.documents set path = 'scans/5c000000-0000-0000-0000-000000000001/original.png' where id = tests.id('cert_b');

-- ───────── confirmed, QR not saved: the member gets nothing ─────────
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.cert_file((select code from _d))') $$,
  '42501', null, 'cert_file refuses the member while only the original exists');
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select * from api.cert_view((select code from _d))') $$,
  '42501', null, 'cert_view refuses too');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.documents where id = tests.id(''cert_b'')'), 0::bigint,
  'the document is not listed for the member');
select is(tests.num_as(tests.id('mo'), 'select count(*) from api.cert_file((select code from _d))'), 1::bigint,
  'certificate staff can open it during processing');

-- ───────── saving ─────────
select throws_ok($$ select tests.exec_as(tests.id('owner_b'), 'select api.cert_scan_stamped(''5c000000-0000-0000-0000-000000000001'', ''scans/5c000000-0000-0000-0000-000000000001/stamped.png'', ''{"cx":0.5,"cy":0.83,"mm":27}'')') $$,
  '42501', null, 'a member cannot save the QR copy');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.cert_scan_stamped(''5c000000-0000-0000-0000-000000000001'', ''scans/5c000000-0000-0000-0000-000000000001/original.png'', ''{"cx":0.5,"cy":0.83,"mm":27}'')') $$,
  'P0001', null, 'only the stamped-copy path is accepted');
select throws_ok($$ select tests.exec_as(tests.id('mo'), 'select api.cert_scan_stamped(''5c000000-0000-0000-0000-000000000001'', ''scans/5c000000-0000-0000-0000-000000000001/stamped.png'', ''{"cx":0.5,"cy":0.83,"mm":99}'')') $$,
  'P0001', null, 'a size outside the limits is refused');
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.cert_scan_stamped(''5c000000-0000-0000-0000-000000000001'', ''scans/5c000000-0000-0000-0000-000000000001/stamped.png'', ''{"cx":0.5,"cy":0.83,"mm":27}'')') $$,
  'certificate staff save it');
select is((select (qr_placement ->> 'mm')::int from public.certificate_scans where id = '5c000000-0000-0000-0000-000000000001'), 27, 'the placement is stored');
select is((select path from public.certificate_scans where id = '5c000000-0000-0000-0000-000000000001'),
  'scans/5c000000-0000-0000-0000-000000000001/original.png', 'the original scan stays recorded');

-- ───────── saved: the member gets the stamped copy only ─────────
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from api.cert_file((select code from _d)) where path like ''%/stamped.png'''), 1::bigint,
  'the member now receives the stamped copy');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.documents where id = tests.id(''cert_b'')'), 1::bigint, 'and sees the document');
select is(tests.num_as(tests.id('owner_a'), 'select count(*) from public.documents where id = tests.id(''cert_b'')'), 0::bigint, 'another company still does not');

-- ───────── saving again: same document, audited ─────────
select lives_ok($$ select tests.exec_as(tests.id('mo'), 'select api.cert_scan_stamped(''5c000000-0000-0000-0000-000000000001'', ''scans/5c000000-0000-0000-0000-000000000001/stamped.png'', ''{"cx":0.4,"cy":0.8,"mm":30}'')') $$,
  'regenerating replaces the copy');
select ok(exists (select 1 from public.audit_log where reason = 'QR copy of the certificate replaced'), 'the replacement is in the audit trail');

select * from finish();
rollback;
