-- 0670 · Clean-up of the owner's own test records before launch (owner, 4 Nov 2026: the draft applications and the
-- sign-up accounts that never applied). Called only by scripts/ops/launch-cleanup.mjs on the server (service role), by
-- the owner, after a verified backup. It marks the named companies as demo so the tested api.demo_purge (0530) removes
-- them with their applications, files and the accounts that belong to nothing else (never staff). A company is
-- refused, and nothing is marked, when it holds anything real: a member (so it never endorsed anyone), an application
-- past draft, a payment voucher, or a certificate or other document. Proposer / seconder requests a test draft made go
-- with it (the purge removes them; the members asked keep everything else).

create function api.launch_cleanup_mark(p_companies uuid[], p_apply boolean default false)
  returns table (company_id uuid, company text, drafts text, accounts int, refused text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  c uuid;
  v_why text;
  v_bad int := 0;
begin
  foreach c in array coalesce(p_companies, '{}') loop
    v_why := case
      when not exists (select 1 from public.companies x where x.id = c) then 'not found'
      when exists (select 1 from public.members x where x.company_id = c) then 'has a member'
      when exists (select 1 from public.applications x where x.company_id = c and x.stage <> 'draft') then 'has an application past draft'
      when exists (select 1 from public.payment_vouchers x where x.company_id = c) then 'has a payment voucher'
      when exists (select 1 from public.documents x where x.company_id = c) then 'has a document'
      else null end;
    if v_why is not null then v_bad := v_bad + 1; end if;
    return query
      select c, (select x.name from public.companies x where x.id = c),
             (select string_agg(a.token, ', ' order by a.token) from public.applications a where a.company_id = c),
             (select count(*)::int from public.company_users cu where cu.company_id = c),
             v_why;
  end loop;
  if p_apply then
    if v_bad > 0 then
      raise exception 'refused: % of the companies hold real records', v_bad using errcode = 'P0001', hint = 'refused';
    end if;
    perform private.set_reason('owner''s pre-launch clean-up of test records (4 Nov 2026)');
    update public.companies x set demo = true, demo_expires_at = now() where x.id = any(p_companies);
  end if;
end $$;

-- what could be cleaned up: every company that is not demo and has no member, with its drafts and accounts
create function api.launch_cleanup_candidates()
  returns table (company_id uuid, company text, drafts text, accounts int, refused text)
  language sql volatile security definer set search_path = ''
  as $$
    select m.* from api.launch_cleanup_mark(
      (select coalesce(array_agg(c.id order by c.created_at), '{}') from public.companies c
        where not c.demo and not exists (select 1 from public.members x where x.company_id = c.id)), false) m
  $$;

revoke all on function api.launch_cleanup_mark(uuid[], boolean) from public, anon, authenticated;
revoke all on function api.launch_cleanup_candidates() from public, anon, authenticated;
grant execute on function api.launch_cleanup_candidates() to service_role;
grant execute on function api.launch_cleanup_mark(uuid[], boolean) to service_role;
