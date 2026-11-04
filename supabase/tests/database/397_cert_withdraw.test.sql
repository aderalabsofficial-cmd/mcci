-- Certificate scans (migration 0650): a scan confirmed for the wrong company is withdrawn by the approver (its QR
-- reference revoked, the member's previous certificate valid again, the copied serial cleared, the member told, the
-- scan back in review to be confirmed for the right member); a scan uploaded by mistake is deleted (record and log
-- kept, the file may be uploaded again); a rejected scan may be uploaded again too; who may do what.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(27);

create temp table t_ids on commit drop as
  select gen_random_uuid() as wrong, gen_random_uuid() as junk, gen_random_uuid() as again, gen_random_uuid() as bad,
         gen_random_uuid() as bad2;
grant select on t_ids to authenticated;
create function pg_temp.reg(p_who text, p_id uuid, p_sha text) returns void language sql as $$
  select tests.exec_as(tests.id(p_who), format('select api.cert_scan_register(%L, %L, %L, %L)', p_id, 'scans/' || p_id || '/original.png', p_sha, 'scan.png'))
$$;
create function pg_temp.read(p_id uuid, p_data jsonb) returns void language sql as $$
  select tests.exec_as(tests.id('mo'), format('select * from api.cert_scan_extracted(%L, %L)', p_id, p_data))
$$;
create function pg_temp.f(v text, c int) returns jsonb language sql as $$ select jsonb_build_object('value', v, 'confidence', c) $$;
create function pg_temp.scan(p_id uuid) returns public.certificate_scans language sql as $$ select * from public.certificate_scans where id = p_id $$;

-- ───────── a scan confirmed for the wrong member (B), over B's valid certificate ─────────
update public.members set serial = null where id = tests.id('member_b');
select lives_ok(format($$ select pg_temp.reg('mo', %L, %L) $$, (select wrong from t_ids), repeat('a', 64)), 'uploaded');
select lives_ok(format($$ select pg_temp.read(%L, jsonb_build_object('membership_no', pg_temp.f('C-9001', 97), 'company_name', pg_temp.f('Company B (member)', 95),
  'serial_no', pg_temp.f('SB-7001', 92))) $$, (select wrong from t_ids)), 'read as member B');
select lives_ok(format($$ select tests.exec_as(tests.id('sg'), format('select * from api.cert_scan_confirm(%%L, tests.id(''member_b''), true, ''Replacing the old certificate'')', %L)) $$,
  (select wrong from t_ids)), 'confirmed for member B by the approver');
create temp table t_doc on commit drop as select (pg_temp.scan((select wrong from t_ids))).document_id as id;
grant select on t_doc to authenticated;
select is((select status::text from public.documents where id = tests.id('cert_b')), 'Superseded', 'B''s earlier certificate was superseded');
select is((select serial from public.members where id = tests.id('member_b')), 'SB-7001', 'the empty serial was filled from the scan');

-- ───────── withdraw ─────────
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), format('select api.cert_scan_withdraw(%%L, ''wrong company'')', %L)) $$, (select wrong from t_ids)),
  '42501', null, 'the Membership Officer cannot withdraw (approver only)');
select throws_ok(format($$ select tests.exec_as(tests.id('owner_b'), format('select api.cert_scan_withdraw(%%L, ''wrong company'')', %L)) $$, (select wrong from t_ids)),
  '42501', null, 'a member cannot withdraw');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), format('select api.cert_scan_withdraw(%%L, '' '')', %L)) $$, (select wrong from t_ids)),
  'P0001', null, 'a reason is required');
select lives_ok(format($$ select tests.exec_as(tests.id('sg'), format('select api.cert_scan_withdraw(%%L, ''Uploaded under the wrong company'')', %L)) $$, (select wrong from t_ids)),
  'the approver withdraws with a reason');
select results_eq($$ select status::text, revoked_reason like 'Confirmed by mistake: Uploaded under the wrong company%' from public.documents where id = (select id from t_doc) $$,
  $$ values ('Revoked', true) $$, 'its QR reference is revoked, with the reason');
select results_eq($$ select status::text, superseded_by from public.documents where id = tests.id('cert_b') $$,
  $$ values ('Valid', null::uuid) $$, 'B''s earlier certificate is valid again');
select is((select serial from public.members where id = tests.id('member_b')), null, 'the serial copied by this confirmation is cleared');
select results_eq(format($$ select status, document_id, stamped_path from public.certificate_scans where id = %L $$, (select wrong from t_ids)),
  $$ values ('extracted', null::uuid, null::text) $$, 'the scan is back in review');
select ok(exists (select 1 from public.notifications n join public.members m on m.company_id = n.company_id
                   where m.id = tests.id('member_b') and n.title = 'A certificate was withdrawn' and n.channel = 'Portal'), 'member B is told in the portal');
select ok((select log::text like '%withdrawn%' from public.certificate_scans where id = (select wrong from t_ids)), 'the scan''s log has the step');
select ok(exists (select 1 from public.audit_log where reason like 'certificate confirmation withdrawn: Uploaded under the wrong company%'), 'audited with the reason');
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), format('select api.cert_scan_withdraw(%%L, ''again'')', %L)) $$, (select wrong from t_ids)),
  'P0001', null, 'only a confirmed scan is withdrawn');

-- confirmed again, for the right member, without uploading it again
select lives_ok(format($$ select tests.exec_as(tests.id('sg'), format('select * from api.cert_scan_confirm(%%L, tests.id(''member_e''), true, ''The right company'')', %L)) $$,
  (select wrong from t_ids)), 'confirmed for the right member');
select is((select d.member_id from public.certificate_scans s join public.documents d on d.id = s.document_id where s.id = (select wrong from t_ids)),
  tests.id('member_e'), 'the new QR reference belongs to the right member');

-- ───────── delete ─────────
select throws_ok(format($$ select tests.exec_as(tests.id('sg'), format('select api.cert_scan_remove(%%L, ''by mistake'')', %L)) $$, (select wrong from t_ids)),
  'P0001', null, 'a confirmed scan is withdrawn first, not deleted');
select lives_ok(format($$ select pg_temp.reg('mo', %L, %L) $$, (select junk from t_ids), repeat('b', 64)), 'a scan uploaded by mistake');
select throws_ok(format($$ select tests.exec_as(tests.id('auditor'), format('select api.cert_scan_remove(%%L, ''by mistake'')', %L)) $$, (select junk from t_ids)),
  '42501', null, 'view-only staff cannot delete');
select throws_ok(format($$ select tests.exec_as(tests.id('mo'), format('select api.cert_scan_remove(%%L, ''x'')', %L)) $$, (select junk from t_ids)),
  'P0001', null, 'deleting needs a reason');
select lives_ok(format($$ select tests.exec_as(tests.id('mo'), format('select api.cert_scan_remove(%%L, ''Wrong company name'')', %L)) $$, (select junk from t_ids)),
  'the Membership Officer deletes it with a reason');
select results_eq(format($$ select status, review_note from public.certificate_scans where id = %L $$, (select junk from t_ids)),
  $$ values ('removed', 'Wrong company name') $$, 'the record stays, marked removed, with the reason');
select lives_ok(format($$ select pg_temp.reg('mo', %L, %L) $$, (select again from t_ids), repeat('b', 64)), 'the same file can be uploaded again');

-- ───────── a rejected scan may be uploaded again (0450 refused it at the database by mistake) ─────────
select lives_ok(format($$ select pg_temp.reg('mo', %L, %L); select tests.exec_as(tests.id('mo'), format('select api.cert_scan_reject(%%L, ''not a certificate'')', %L));
                         select pg_temp.reg('mo', %L, %L) $$,
  (select bad from t_ids), repeat('c', 64), (select bad from t_ids), (select bad2 from t_ids), repeat('c', 64)), 'rejected, then the same file again');

select * from finish();
rollback;
