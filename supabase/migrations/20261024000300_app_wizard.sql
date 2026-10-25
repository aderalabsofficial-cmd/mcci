-- M3 · membership application wizard (docs/05 M3, docs/03 §1, docs/08, prototype member/join).
--
-- A person who registers on the website has an account but no company. api.app_start gives them one: an applicant
-- company (they are its Owner) and a draft application, or returns the open application they already have. The draft
-- is edited through the column grants of migration 0150 (form, photo/sign/stamp paths, declarations, jurisdiction,
-- women) plus field_confidence (AI read-back, informative only). Submit, resubmit and withdraw are api.* functions:
-- each checks the caller, the stage and — for submit — the same missing-items rule as lib/flow/application.ts
-- (private.app_missing), then writes history; audit rows come from the triggers of migration 0240.
--
-- applications.form keys: biz (prop|aop|pvt|mnc|public), manufacturing, salesTax, turnover50 (booleans),
-- nature {sector, items[], other}, addrMatch (boolean), step (wizard position), and the page-2 particulars of
-- docs/catalogue/reference-data.md: name, address, ntn, gst, tel, fax, email, web, particulars, est, rep, desig,
-- cnic, mobile.

-- Rules MCCI can change without a deploy (CLAUDE.md rule 9).
-- stampRequiredForProprietor: docs/03 "stamp (not for proprietorship if MCCI agrees)" — TODO(MCCI) confirm.
-- requireEndorsersAtSubmit: docs/03 guard "proposer and seconder each have a live request"; switched on with M4.
insert into private.settings (key, value) values
  ('membership', '{"stampRequiredForProprietor": false, "requireEndorsersAtSubmit": false}'::jsonb)
on conflict (key) do nothing;
-- the wizard shows these rules to applicants (nothing secret in them, F-16)
create or replace view public.public_settings with (security_invoker = false) as
  select key, value from private.settings where key in ('chamber', 'fees', 'lang', 'app', 'membership', 'sla');

-- The applicant marks AI-filled fields as checked (confidence 100) when they edit them (prototype M.onBind).
grant update (field_confidence) on public.applications to authenticated;

-- ───────── rules ─────────

-- Corporate vs Associate, as printed on the form (prototype F.classOf).
create function private.class_of(p_form jsonb) returns public.member_class
  language sql immutable set search_path = ''
  as $$
    select (case
      when p_form->>'biz' in ('pvt', 'public', 'mnc') then 'Corporate'
      when coalesce(p_form->'manufacturing' = 'true'::jsonb, false) and coalesce(p_form->'salesTax' = 'true'::jsonb, false) then 'Corporate'
      when coalesce(p_form->'salesTax' = 'true'::jsonb, false) and coalesce(p_form->'turnover50' = 'true'::jsonb, false) then 'Corporate'
      else 'Associate' end)::public.member_class
  $$;

-- What still blocks submission, as stable codes (lib/flow/application.ts turns them into plain EN/UR words):
-- biz, nature, juris, addr, field:<key>, doc:<key>, partners, sign, stamp, decl.
create function private.app_missing(p_app uuid) returns text[]
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  a public.applications;
  f jsonb;
  biz text;
  k text;
  miss text[] := '{}';
  rules jsonb := coalesce((select s.value from private.settings s where s.key = 'membership'), '{}'::jsonb);
begin
  select * into a from public.applications x where x.id = p_app;
  if a.id is null then
    return array['not_found'];
  end if;
  f := a.form;
  biz := f->>'biz';
  if biz is null or biz not in ('prop', 'aop', 'pvt', 'mnc', 'public') then
    miss := miss || 'biz'::text;
    biz := 'prop';
  end if;
  if coalesce(f#>>'{nature,sector}', '') = ''
     or (jsonb_typeof(f#>'{nature,items}') is distinct from 'array' or jsonb_array_length(f#>'{nature,items}') = 0)
        and coalesce(btrim(f#>>'{nature,other}'), '') = '' then
    miss := miss || 'nature'::text;
  end if;
  if a.jurisdiction_ok is distinct from true then
    miss := miss || 'juris'::text;
  end if;
  if not coalesce(f->'addrMatch' = 'true'::jsonb, false) then
    miss := miss || 'addr'::text;
  end if;
  foreach k in array array['name', 'address', 'ntn', 'tel', 'email', 'particulars', 'est', 'rep', 'desig', 'cnic', 'mobile'] loop
    if coalesce(btrim(f->>k), '') = '' or (k = 'est' and (f->>k) !~ '^\d{4}-\d{2}-\d{2}$') then
      miss := miss || ('field:' || k);
    end if;
  end loop;
  for k in select r.key from public.document_requirements r
           where r.biz_type = biz::public.biz_type
             and (r.required or (r.key = 'st' and coalesce(f->'salesTax' = 'true'::jsonb, false)))
           order by r.sort loop
    if not exists (select 1 from public.application_documents d
                   where d.application_id = p_app and d.key = k and d.status <> 'rejected') then
      miss := miss || ('doc:' || k);
    end if;
  end loop;
  if biz <> 'prop' and (select count(*) from public.application_partners p where p.application_id = p_app) < 2 then
    miss := miss || 'partners'::text;
  end if;
  if a.sign_path is null then
    miss := miss || 'sign'::text;
  end if;
  if a.stamp_path is null and (biz <> 'prop' or coalesce(rules->'stampRequiredForProprietor' = 'true'::jsonb, false)) then
    miss := miss || 'stamp'::text;
  end if;
  if not (a.decl1 and a.decl2) then
    miss := miss || 'decl'::text;
  end if;
  return miss;
end $$;
revoke all on function private.app_missing(uuid) from public;
grant execute on function private.class_of(jsonb) to authenticated, service_role;

-- ───────── api ─────────

-- wiz start: the caller's open application, or a new applicant company + draft (docs/05 M3, action register.start →
-- "opens the guided form"). One open application per person; a company that is already a member renews instead.
create function api.app_start() returns table (id uuid, token text, company_id uuid)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_uid uuid := auth.uid();
  v_company uuid;
  v_app uuid;
  v_token text;
  v_name text;
begin
  if v_uid is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('app_start:' || v_uid::text, 0));

  select a.id, a.token, a.company_id into v_app, v_token, v_company
  from public.applications a
  where a.company_id in (select private.my_company_ids())
    and private.company_level(a.company_id, 'mship') >= 2
    and a.stage not in ('rejected', 'withdrawn')
  order by a.created_at desc
  limit 1;
  if v_app is not null then
    return query select v_app, v_token, v_company;
    return;
  end if;

  select cu.company_id into v_company
  from public.company_users cu
  where cu.user_id = v_uid and cu.status = 'Active' and private.company_role_level(cu.role, 'mship') >= 2
  order by cu.created_at
  limit 1;
  if v_company is not null and exists (select 1 from public.members m where m.company_id = v_company) then
    raise exception 'this company is already a member' using errcode = 'P0001', hint = 'already_member';
  end if;

  select coalesce(nullif(btrim(p.full_name), ''), 'New applicant') into v_name from public.profiles p where p.id = v_uid;
  perform private.set_reason('membership application started');
  if v_company is null then
    insert into public.companies (name, biz_type) values (coalesce(v_name, 'New applicant'), 'prop')
    returning companies.id into v_company;
    insert into public.company_users (company_id, user_id, role, status) values (v_company, v_uid, 'Owner', 'Active');
  end if;
  insert into public.applications (company_id, created_by, form)
  values (v_company, v_uid, jsonb_build_object('rep', coalesce(v_name, '')))
  returning applications.id, applications.token into v_app, v_token;
  insert into public.application_history (application_id, step, by_user) values (v_app, 'created', v_uid);
  return query select v_app, v_token, v_company;
end $$;
revoke all on function api.app_start() from public, anon;
grant execute on function api.app_start() to authenticated;

-- What is still missing, for the caller's own application (the wizard's "Still needed" list).
create function api.app_missing(p_app uuid) returns text[]
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if not exists (select 1 from public.applications a where a.id = p_app
                 and (a.company_id in (select private.my_company_ids()) or private.staff_level('mem') >= 1)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return private.app_missing(p_app);
end $$;
revoke all on function api.app_missing(uuid) from public, anon;
grant execute on function api.app_missing(uuid) to authenticated;

-- wiz.doc.remove: take a document out of the draft (the file stays in storage; the audit log keeps the row).
create function api.app_doc_remove(p_document uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_app uuid;
  v_key text;
begin
  select d.application_id, d.key into v_app, v_key from public.application_documents d where d.id = p_document;
  if v_app is null or not private.app_editable(v_app)
     or (select a.stage from public.applications a where a.id = v_app) <> 'draft' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('document removed by the applicant');
  delete from public.application_documents where id = p_document;
  if v_key = 'photo' then
    update public.applications set photo_path = null where id = v_app;
  end if;
end $$;
revoke all on function api.app_doc_remove(uuid) from public, anon;
grant execute on function api.app_doc_remove(uuid) to authenticated;

-- wiz.submit (docs/03 §1 draft → submitted): Owner/Manager of the applicant company, nothing missing.
create function api.app_submit(p_app uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  v_miss text[];
  f jsonb;
  v_items text[];
begin
  select * into a from public.applications x where x.id = p_app for update;
  if a.id is null or auth.uid() is null or private.company_level(a.company_id, 'mship') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if a.stage <> 'draft' then
    raise exception 'only a draft can be submitted' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  v_miss := private.app_missing(p_app);
  if cardinality(v_miss) > 0 then
    raise exception 'application incomplete: %', array_to_string(v_miss, ',') using errcode = 'P0001', hint = 'incomplete';
  end if;
  f := a.form;
  select coalesce(array_agg(x), '{}') into v_items
  from (select jsonb_array_elements_text(coalesce(f#>'{nature,items}', '[]'::jsonb)) as x
        union all select nullif(btrim(f#>>'{nature,other}'), '')) i
  where x is not null;

  perform private.set_reason('application submitted');
  update public.applications
     set stage = 'submitted', submitted_at = now(), class = private.class_of(f), address_matches_ntn = true
   where id = p_app;
  update public.companies
     set name = btrim(f->>'name'), biz_type = (f->>'biz')::public.biz_type, address = f->>'address',
         ntn = f->>'ntn', gst = nullif(btrim(f->>'gst'), ''), tel = f->>'tel', fax = nullif(btrim(f->>'fax'), ''),
         email = (f->>'email')::extensions.citext, web = nullif(btrim(f->>'web'), ''), particulars = f->>'particulars',
         nature_sector = f#>>'{nature,sector}', nature_items = v_items, established = (f->>'est')::date,
         manufacturing = coalesce(f->'manufacturing' = 'true'::jsonb, false),
         sales_tax = coalesce(f->'salesTax' = 'true'::jsonb, false)
   where id = a.company_id;
  insert into public.application_history (application_id, step, by_user) values (p_app, 'submitted', auth.uid());
  insert into public.notifications (user_id, title, body, link, channel)
  values (auth.uid(), 'Application received', 'Your membership application ' || a.token || ' has reached MCCI.',
          '/portal/mtrack', 'Email + Portal');
  return a.token;
end $$;
revoke all on function api.app_submit(uuid) from public, anon;
grant execute on function api.app_submit(uuid) to authenticated;

-- app.resubmit (docs/03 §1 returned → review): every rejected file replaced, nothing missing.
create function api.app_resubmit(p_app uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  v_miss text[];
begin
  select * into a from public.applications x where x.id = p_app for update;
  if a.id is null or auth.uid() is null or private.company_level(a.company_id, 'mship') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if a.stage <> 'returned' then
    raise exception 'only a returned application can be resubmitted' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  v_miss := private.app_missing(p_app);
  if cardinality(v_miss) > 0 then
    raise exception 'application incomplete: %', array_to_string(v_miss, ',') using errcode = 'P0001', hint = 'incomplete';
  end if;
  perform private.set_reason('application resubmitted after correction');
  update public.applications set stage = 'review', class = private.class_of(form) where id = p_app;
  insert into public.application_history (application_id, step, by_user) values (p_app, 'resubmitted', auth.uid());
end $$;
revoke all on function api.app_resubmit(uuid) from public, anon;
grant execute on function api.app_resubmit(uuid) to authenticated;

-- app withdraw (docs/03 §1): the applicant stops before the committee decides.
create function api.app_withdraw(p_app uuid, p_reason text default null) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
begin
  select * into a from public.applications x where x.id = p_app for update;
  if a.id is null or auth.uid() is null or private.company_level(a.company_id, 'mship') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if a.stage not in ('draft', 'submitted', 'review', 'returned', 'proposer') then
    raise exception 'this application can no longer be withdrawn' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason(coalesce(nullif(btrim(p_reason), ''), 'withdrawn by the applicant'));
  update public.applications set stage = 'withdrawn', decided_at = now() where id = p_app;
  insert into public.application_history (application_id, step, note, by_user)
  values (p_app, 'withdrawn', nullif(btrim(p_reason), ''), auth.uid());
end $$;
revoke all on function api.app_withdraw(uuid, text) from public, anon;
grant execute on function api.app_withdraw(uuid, text) to authenticated;

-- wiz.ai, second half: the server stores what the model returned (field values + confidence, never the document
-- content) on the extraction the caller started with api.ai_extraction_begin.
create function api.ai_extraction_finish(p_extraction uuid, p_ok boolean, p_model text, p_fields jsonb)
  returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  update public.ai_extractions
     set status = case when p_ok then 'done' else 'failed' end, model = left(p_model, 80),
         fields = case when p_ok then p_fields end
   where id = p_extraction and created_by = auth.uid() and status = 'started';
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end $$;
revoke all on function api.ai_extraction_finish(uuid, boolean, text, jsonb) from public, anon;
grant execute on function api.ai_extraction_finish(uuid, boolean, text, jsonb) to authenticated;
