-- Certificates printed by the security press (migration 0450): scans registered once (duplicates refused), the reading
-- matched to the member with every conflict listed, nothing applied until a person confirms, conflicts only with the
-- approver's override and a reason, QR document created (an earlier certificate superseded), the member's number and
-- validity never changed, demo members never certified, revocation logged, and who may see what.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(32);

create temp table t_ids on commit drop as
  select gen_random_uuid() as clean, gen_random_uuid() as unknown, gen_random_uuid() as blurry, gen_random_uuid() as other,
         gen_random_uuid() as broken, gen_random_uuid() as demo;
grant select on t_ids to authenticated;
create function pg_temp.reg(p_who text, p_id uuid, p_sha text) returns void language sql as $$
  select tests.exec_as(tests.id(p_who), format('select api.cert_scan_register(%L, %L, %L, %L)', p_id, 'scans/' || p_id || '/original.png', p_sha, 'scan.png'))
$$;
create function pg_temp.read(p_id uuid, p_data jsonb) returns void language sql as $$
  select tests.exec_as(tests.id('mo'), format('select * from api.cert_scan_extracted(%L, %L)', p_id, p_data))
$$;
create function pg_temp.f(v text, c int) returns jsonb language sql as $$ select jsonb_build_object('value', v, 'confidence', c) $$;

-- ───────── who uploads; duplicates ─────────
select throws_ok(format($$ select pg_temp.reg('auditor', %L, %L) $$, (select clean from t_ids), repeat('a', 64)), '42501', null, 'view-only staff cannot upload');
select throws_ok(format($$ select pg_temp.reg('owner_a', %L, %L) $$, (select clean from t_ids), repeat('a', 64)), '42501', null, 'members cannot upload');
select lives_ok(format($$ select pg_temp.reg('mo', %L, %L) $$, (select clean from t_ids), repeat('a', 64)), 'the Membership Officer uploads a scan');
select throws_ok(format($$ select pg_temp.reg('mo', %L, %L) $$, (select other from t_ids), repeat('a', 64)), 'P0001', null, 'the same scan twice is refused');
select throws_ok($$ select tests.exec_as(tests.id('mo'), format('select api.cert_scan_register(%L, %L, %L, %L)', gen_random_uuid(), 'scans/x/../../etc.png', repeat('b', 64), 'x.png')) $$, 'P0001', null, 'only the expected path');
select lives_ok(format($$ select pg_temp.reg('mo', %L, %L), pg_temp.reg('mo', %L, %L), pg_temp.reg('mo', %L, %L), pg_temp.reg('mo', %L, %L), pg_temp.reg('mo', %L, %L) $$,
  (select unknown from t_ids), repeat('c', 64), (select blurry from t_ids), repeat('d', 64), (select other from t_ids), repeat('e', 64),
  (select broken from t_ids), repeat('f', 64), (select demo from t_ids), repeat('9', 64)), 'five more scans');

-- ───────── readings: match and conflicts; nothing applied ─────────
-- (member B's seed certificate is revoked here; a valid one would be flagged "already_certified")
update public.documents set status = 'Revoked', revoked_reason = 'test' where id = tests.id('cert_b');
select lives_ok(format($$ select pg_temp.read(%L, jsonb_build_object('membership_no', pg_temp.f('C-9001', 97), 'company_name', pg_temp.f('Company B (member)', 95),
  'class', pg_temp.f('Corporate', 96), 'serial_no', pg_temp.f('SB-001122', 92))) $$, (select clean from t_ids)), 'a clear reading');
select results_eq(format($$ select status, match_member = tests.id('member_b'), conflicts from public.certificate_scans where id = %L $$, (select clean from t_ids)),
  $$ values ('extracted', true, '{}'::text[]) $$, 'matched to member B (MCCI-C-9001 typed as C-9001), no conflicts');
select is((select serial from public.members where id = tests.id('member_b')), null, 'nothing is applied from the reading itself');
select lives_ok(format($$ select pg_temp.read(%L, jsonb_build_object('membership_no', pg_temp.f('C-777777', 95), 'company_name', pg_temp.f('Nobody Ltd', 95))) $$, (select unknown from t_ids)), 'an unknown number');
select is((select conflicts from public.certificate_scans where id = (select unknown from t_ids)), array['unknown_member'], 'flagged: unknown member');
select lives_ok(format($$ select pg_temp.read(%L, jsonb_build_object('membership_no', pg_temp.f('C-9002', 40), 'company_name', pg_temp.f('Company E (endorser)', 50))) $$, (select blurry from t_ids)), 'a blurry scan');
select ok((select conflicts from public.certificate_scans where id = (select blurry from t_ids)) @> array['low_confidence:membership_no', 'low_confidence:company_name'], 'flagged: low confidence');
select lives_ok(format($$ select pg_temp.read(%L, jsonb_build_object('membership_no', pg_temp.f('C-9002', 95), 'company_name', pg_temp.f('Totally Different Mills', 95), 'class', pg_temp.f('Associate', 90))) $$, (select other from t_ids)), 'a mismatched certificate');
select ok((select conflicts from public.certificate_scans where id = (select other from t_ids)) @> array['name_mismatch', 'class_mismatch'], 'flagged: name and class differ from the register');
select lives_ok(format($$ select pg_temp.read(%L, null) $$, (select broken from t_ids)), 'an unreadable scan');
select is((select status from public.certificate_scans where id = (select broken from t_ids)), 'failed', 'marked failed (reviewed by hand)');

-- ───────── confirmation ─────────
select lives_ok(format($$ select tests.exec_as(tests.id('mo'), format('select * from api.cert_scan_confirm(%%L, tests.id(''member_b''))', %L)) $$, (select clean from t_ids)), 'the officer confirms the clean scan');
select results_eq($$ select d.kind::text, d.status::text, d.valid_to = m.valid_to, m.member_no, m.serial
                     from public.certificate_scans s join public.documents d on d.id = s.document_id join public.members m on m.id = d.member_id
                     where s.id = (select clean from t_ids) $$,
  $$ values ('certificate', 'Valid', true, 'MCCI-C-9001', 'SB-001122') $$, 'QR document for the member; number and validity unchanged; the empty serial filled');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), format('select * from api.cert_scan_confirm(%%L, tests.id(''member_e''))', %L)) $$, (select other from t_ids)), 'P0001', null, 'a conflict is never confirmed without an override');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), format('select * from api.cert_scan_confirm(%%L, tests.id(''member_e''), true, ''Name changed in 2025, see file'')', %L)) $$, (select other from t_ids)), '42501', null, 'the Membership Officer cannot override (approver only)');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), format('select * from api.cert_scan_confirm(%%L, tests.id(''member_e''), true, '' '')', %L)) $$, (select other from t_ids)), 'P0001', null, 'an override needs a reason');
select lives_ok(format($$ select tests.exec_as(tests.id('sg'), format('select * from api.cert_scan_confirm(%%L, tests.id(''member_e''), true, ''Name changed in 2025, see file'')', %L)) $$, (select other from t_ids)), 'the SG overrides with a reason');
select ok((select log::text like '%override%' from public.certificate_scans where id = (select other from t_ids)), 'the override is in the scan''s log');

-- demo members
update public.companies set demo = true, demo_expires_at = now() + interval '7 days' where id = tests.id('company_e');
select lives_ok(format($$ select pg_temp.read(%L, jsonb_build_object('membership_no', pg_temp.f('C-9002', 95))) $$, (select demo from t_ids)), 'a demo member''s certificate is read');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), format('select * from api.cert_scan_confirm(%%L, tests.id(''member_e''), true, ''test override'')', %L)) $$, (select demo from t_ids)), 'P0001', null, 'demo members never get a certificate');
update public.companies set demo = false, demo_expires_at = null where id = tests.id('company_e');

-- ───────── reject, file access, revocation ─────────
create temp table t_code on commit drop as
  select d.code from public.documents d join public.certificate_scans c on c.document_id = d.id where c.id = (select clean from t_ids);
grant select on t_code to authenticated;
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), format('select api.cert_scan_reject(%%L, '''')', %L)) $$, (select broken from t_ids)), 'P0001', null, 'rejecting needs a reason');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from api.cert_file((select code from t_code))'), 1::bigint, 'the member reads their own certificate file');
select throws_ok($$ select tests.exec_as(tests.id('owner_a'), 'select * from api.cert_file((select code from t_code))') $$, '42501', null, 'another company cannot');
select is(tests.num_as(tests.id('owner_b'), 'select count(*) from public.certificate_scans'), 0::bigint, 'members never see the scan queue');
select lives_ok($$ select tests.exec_as(tests.id('sg'), 'select api.qr_revoke((select code from t_code), ''Issued in error'')') $$, 'the SG revokes the certificate''s QR');
select ok((select log::text like '%QR revoked%' from public.certificate_scans where id = (select clean from t_ids)), 'the revocation is in the scan''s log');

select * from finish();
rollback;
