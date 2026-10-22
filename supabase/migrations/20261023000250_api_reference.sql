-- 0250 · first api.* transition functions — the reference pattern for every later milestone (decision 4)
--
-- Pattern (docs/17 §B3):
--   SECURITY DEFINER + set search_path = ''      → runs as the table owner, immune to search_path tricks (F-14)
--   permission checked here, inside the database  → a missed check in app code cannot bypass it
--   lock the row (for update), check the state     → transaction integrity, no lost updates
--   private.set_reason(...)                        → the audit trigger stores the human "why"
--   write history, return the minimum              → no broad row leaks
--   revoke from public/anon; grant to authenticated only
-- Errors: 42501 = not allowed, P0001 = flow error with a stable hint the UI maps to a bilingual message.

-- A1 / F-01: the only way to create an application. Owner or Manager of the company (docs/06 mship >= 2).
create function api.app_create(p_company uuid) returns table (id uuid, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_id uuid;
  v_token text;
begin
  if auth.uid() is null or private.company_level(p_company, 'mship') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('application started');
  insert into public.applications (company_id, created_by)
  values (p_company, auth.uid())
  returning applications.id, applications.token into v_id, v_token;
  insert into public.application_history (application_id, step, by_user)
  values (v_id, 'created', auth.uid());
  return query select v_id, v_token;
end $$;
revoke all on function api.app_create(uuid) from public, anon;
grant execute on function api.app_create(uuid) to authenticated;

-- F-04: accept / reject one document (action adm.doc.ok / adm.doc.reject → mem >= 2, docs/06), only in 'review'.
create function api.doc_review(p_document uuid, p_ok boolean, p_reason text default null) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_app uuid;
  v_stage public.app_stage;
begin
  if auth.uid() is null or private.staff_level('mem') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select d.application_id, a.stage into v_app, v_stage
  from public.application_documents d join public.applications a on a.id = d.application_id
  where d.id = p_document
  for update of d, a;
  if v_app is null then
    raise exception 'document not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if v_stage <> 'review' then
    raise exception 'documents can only be reviewed while the application is in review' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if not p_ok and coalesce(btrim(p_reason), '') = '' then
    raise exception 'a reason is required to reject a document' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason(coalesce(p_reason, case when p_ok then 'document accepted' end));
  update public.application_documents
     set status = case when p_ok then 'ok'::public.doc_status else 'rejected'::public.doc_status end,
         reject_reason = case when p_ok then null else p_reason end,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_document;
  insert into public.application_history (application_id, step, note, by_user)
  values (v_app, case when p_ok then 'document accepted' else 'document rejected' end, p_reason, auth.uid());
end $$;
revoke all on function api.doc_review(uuid, boolean, text) from public, anon;
grant execute on function api.doc_review(uuid, boolean, text) to authenticated;
