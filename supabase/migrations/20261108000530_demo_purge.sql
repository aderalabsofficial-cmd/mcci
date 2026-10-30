-- 0530 · Selective demo purge for the production cleanup (owner, 30 Oct 2026; Part 2).
--
-- api.demo_clear (0350) removes EVERY demo company and predates later tables. Launch cleanup needs a named, reviewable
-- set: api.demo_purge(companies, apply) takes the exact company ids the owner approved and
--   * refuses any company that is not demo (companies.demo), so a genuine record can never be passed by mistake;
--   * refuses when a record that stays depends on one that would go (an endorsement by a purged member on a kept
--     application, a kept document replaced by a purged one) — nothing is half-deleted;
--   * with apply = false only reports what it would remove (row counts per table, the sign-in accounts that belong
--     to these companies only, and the storage folders); with apply = true deletes in dependency order in one
--     transaction and writes the audit reason "demo data removed (launch cleanup)".
-- audit_log is append-only and is never touched: the history of what existed and who removed it stays.
-- Sign-in accounts and stored files are removed afterwards by scripts/ops/demo-purge.mjs (Auth admin API, Storage API).
-- Server only (service role).

create function api.demo_purge(p_companies uuid[], p_apply boolean default false)
  returns table (kind text, item text, n bigint)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_c uuid[] := coalesce(p_companies, '{}');
  v_m uuid[];
  v_a uuid[];
  v_d uuid[];
  v_s uuid[];
  v_t text[];
  v_users uuid[];
  v_bad text;
begin
  if cardinality(v_c) = 0 then
    raise exception 'no companies given' using errcode = 'P0001';
  end if;
  select string_agg(x::text, ', ') into v_bad
    from unnest(v_c) x where not exists (select 1 from public.companies c where c.id = x and c.demo);
  if v_bad is not null then
    raise exception 'not demo companies (refused): %', v_bad using errcode = 'P0001';
  end if;

  v_m := array(select m.id from public.members m where m.company_id = any (v_c));
  v_a := array(select a.id from public.applications a where a.company_id = any (v_c));
  v_d := array(select d.id from public.documents d where d.company_id = any (v_c) or d.member_id = any (v_m));
  v_s := array(select s.id from public.service_requests s where s.company_id = any (v_c));
  v_t := array(select t.id from public.tickets t where t.company_id = any (v_c));
  v_users := array(
    select distinct cu.user_id from public.company_users cu
     where cu.company_id = any (v_c)
       and not exists (select 1 from public.company_users o where o.user_id = cu.user_id and not (o.company_id = any (v_c)))
       and not exists (select 1 from public.staff s where s.user_id = cu.user_id));

  -- records that stay must not depend on records that go
  select string_agg(a.token || ' (' || e.role || ')', ', ') into v_bad
    from public.endorsements e join public.applications a on a.id = e.application_id
   where e.endorser_member_id = any (v_m) and not (e.application_id = any (v_a));
  if v_bad is not null then
    raise exception 'members of these companies endorsed applications that would stay: %', v_bad using errcode = 'P0001';
  end if;
  if exists (select 1 from public.documents d where d.superseded_by = any (v_d) and not (d.id = any (v_d))) then
    raise exception 'a kept document is replaced by a document of these companies' using errcode = 'P0001';
  end if;
  select string_agg(x::text, ', ') into v_bad from unnest(v_users) x
   where exists (select 1 from public.applications a where a.created_by = x and not (a.id = any (v_a)))
      or exists (select 1 from public.service_requests s where s.created_by = x and not (s.id = any (v_s)))
      or exists (select 1 from public.tickets t where t.created_by = x and not (t.id = any (v_t)))
      or exists (select 1 from public.invitations i where i.invited_by = x and not (i.company_id = any (v_c)));
  if v_bad is not null then
    raise exception 'accounts of these companies created records that would stay: %', v_bad using errcode = 'P0001';
  end if;

  return query
    select 'rows', t.item, t.n from (values
      ('companies', cardinality(v_c)::bigint),
      ('members', cardinality(v_m)::bigint),
      ('applications (+ partners, documents, versions, snapshots, history, committee items cascade)', cardinality(v_a)::bigint),
      ('endorsements', (select count(*) from public.endorsements e where e.application_id = any (v_a) or e.endorser_member_id = any (v_m))),
      ('ai_extractions', (select count(*) from public.ai_extractions x where x.company_id = any (v_c) or x.application_id = any (v_a) or x.service_request_id = any (v_s))),
      ('documents', cardinality(v_d)::bigint),
      ('payment_vouchers / receipts', (select count(*) from public.payment_vouchers v where v.company_id = any (v_c)) + (select count(*) from public.payment_receipts r where r.company_id = any (v_c))),
      ('service_requests', cardinality(v_s)::bigint),
      ('tickets', cardinality(v_t)::bigint),
      ('company_users / invitations / notifications (cascade)', (select count(*) from public.company_users x where x.company_id = any (v_c)) + (select count(*) from public.invitations x where x.company_id = any (v_c)) + (select count(*) from public.notifications x where x.company_id = any (v_c))),
      ('demo-only sign-in accounts (removed by the ops script)', cardinality(v_users)::bigint)
    ) as t(item, n);
  return query select 'user', x::text, 0::bigint from unnest(v_users) x;
  return query select 'company', x::text, 0::bigint from unnest(v_c) x;

  if not p_apply then
    return;
  end if;

  perform private.set_reason('demo data removed (launch cleanup)');
  delete from public.endorsements e where e.application_id = any (v_a) or e.endorser_member_id = any (v_m);
  delete from public.ai_extractions x where x.company_id = any (v_c) or x.application_id = any (v_a) or x.service_request_id = any (v_s);
  delete from public.payment_receipts x where x.company_id = any (v_c);
  delete from public.payment_vouchers x where x.company_id = any (v_c);
  delete from public.service_requests x where x.id = any (v_s);
  delete from public.ticket_messages x where x.ticket_id = any (v_t);
  delete from public.tickets x where x.id = any (v_t);
  delete from public.event_registrations x where x.company_id = any (v_c);
  delete from public.opportunity_replies x where x.company_id = any (v_c);
  delete from public.opportunities x where x.company_id = any (v_c);
  delete from public.change_requests x where x.company_id = any (v_c);
  delete from public.reminders x where x.company_id = any (v_c) or x.member_id = any (v_m);
  delete from public.applications x where x.id = any (v_a);
  delete from public.print_items x where x.member_id = any (v_m);
  delete from public.member_cards x where x.company_id = any (v_c) or x.member_id = any (v_m);
  update public.temp_memberships set certificate_doc = null where certificate_doc = any (v_d);
  update public.documents set superseded_by = null where id = any (v_d);
  delete from public.documents x where x.id = any (v_d);
  delete from public.members x where x.id = any (v_m);
  delete from public.companies x where x.id = any (v_c);
end $$;

revoke all on function api.demo_purge(uuid[], boolean) from public, anon, authenticated;
grant execute on function api.demo_purge(uuid[], boolean) to service_role;
