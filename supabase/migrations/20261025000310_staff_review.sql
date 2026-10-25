-- Release 2 · staff review of membership applications (docs/05 M5 first half, docs/03 §1, docs/06 adm.*,
-- screens admin/requests and admin/mreview).
--
-- 1. MFA in the database: private.staff_level() — used by every staff policy and staff api.* function — now returns 0
--    unless the request carries a 2-step-verified session (JWT claim aal = aal2, docs/09 "TOTP mandatory for staff").
--    Before this, the app enforced TOTP but a staff password alone could call staff functions over the API.
-- 2. Review functions, each: checks the officer's level in module 'mem' (docs/06: open 1, document/checklist/edit/
--    return/verify 2, reject/class 3), checks the stage, writes the change + application_history + a portal message
--    for the applicant; audit_log rows come from the triggers (migration 0240) with the reason set here.
-- 3. Email log: the functions that tell the applicant something queue one email_log row and return it to the app,
--    which sends the email and marks it sent / failed (api.email_mark). A failed email never undoes the decision; the
--    portal message is already written and staff see that the email failed.

-- ───────── 1. staff levels need a 2-step-verified session ─────────
create or replace function private.staff_level(p_module text) returns smallint
  language sql stable security definer set search_path = ''
  as $$
    select case when coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal', '') = 'aal2' then coalesce((
      select coalesce(o.level, rp.level, 0)
      from public.staff s
      left join public.staff_permission_overrides o on o.user_id = s.user_id and o.module = p_module
      left join public.role_permissions rp on rp.designation = s.designation and rp.module = p_module
      where s.user_id = auth.uid() and s.active
    ), 0) else 0 end::smallint
  $$;

-- ───────── settings ─────────
-- Officer checklist items that must be ticked before "verify" (prototype mreview checklist). 'proposers' joins the list
-- when proposer & seconder are built (M4). TODO(MCCI): confirm the checklist wording and which items are mandatory.
update private.settings
   set value = value || '{"checklist": ["docs", "identity", "ntn", "address"]}'::jsonb
 where key = 'membership' and not value ? 'checklist';

-- ───────── email log: who queued it, for which application ─────────
alter table public.email_log
  add column created_by uuid references public.profiles on delete set null,
  add column application_id uuid references public.applications on delete set null,
  add column error text;
create index email_log_application on public.email_log (application_id, at);
-- staff who review applications see the email status of those applications (the 'eng' policy stays as it is)
create policy email_log_select_mem on public.email_log for select to authenticated
  using (application_id is not null and (select private.staff_level('mem')) >= 1);

create function private.staff_name() returns text
  language sql stable security definer set search_path = ''
  as $$ select p.full_name from public.profiles p where p.id = auth.uid() $$;
revoke all on function private.staff_name() from public;

-- the applicant to tell: the person who created the application (their address and language)
create function private.app_email(p_app uuid, p_template text) returns table (email_id bigint, to_email text, lang text, token text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_id bigint;
  r record;
begin
  select p.email::text as email, p.lang, a.token, p.full_name into r
  from public.applications a join public.profiles p on p.id = a.created_by
  where a.id = p_app;
  if r.email is null then
    return;
  end if;
  insert into public.email_log (template_key, to_email, status, created_by, application_id)
  values (p_template, r.email, 'queued', auth.uid(), p_app)
  returning id into v_id;
  return query select v_id, r.email, r.lang, r.token, r.full_name;
end $$;
revoke all on function private.app_email(uuid, text) from public;

create function private.app_notify(p_app uuid, p_title text, p_body text) returns void
  language sql volatile security definer set search_path = ''
  as $$
    insert into public.notifications (user_id, title, body, link, channel)
    select a.created_by, p_title, p_body, '/portal/mtrack', 'Email + Portal' from public.applications a where a.id = p_app
  $$;
revoke all on function private.app_notify(uuid, text, text) from public;

-- ───────── 2. review ─────────

-- adm.app.open: an officer (mem ≥ 2) opening a submitted file starts the review (docs/03 submitted → review).
-- Viewers (mem 1) can read the file but do not change its stage.
create function api.app_open(p_app uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_stage public.app_stage;
begin
  if auth.uid() is null or private.staff_level('mem') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select a.stage into v_stage from public.applications a where a.id = p_app for update;
  if v_stage is null then
    raise exception 'application not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if v_stage = 'submitted' and private.staff_level('mem') >= 2 then
    perform private.set_reason('review started');
    update public.applications set stage = 'review' where id = p_app;
    insert into public.application_history (application_id, step, by_name, by_user)
    values (p_app, 'review started', private.staff_name(), auth.uid());
    return 'review';
  end if;
  return v_stage::text;
end $$;

-- adm.check: tick / untick one officer checklist item (stored in applications.review.checks)
create function api.app_check(p_app uuid, p_item text, p_on boolean) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_stage public.app_stage;
begin
  if auth.uid() is null or private.staff_level('mem') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_item not in ('docs', 'identity', 'ntn', 'address', 'proposers') then
    raise exception 'unknown checklist item' using errcode = 'P0001', hint = 'checklist';
  end if;
  select a.stage into v_stage from public.applications a where a.id = p_app for update;
  if v_stage is distinct from 'review' then
    raise exception 'the checklist can only change during review' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason(case when p_on then 'checklist ticked: ' else 'checklist unticked: ' end || p_item);
  update public.applications
     set review = jsonb_set(review, '{checks}', coalesce(review -> 'checks', '{}'::jsonb) || jsonb_build_object(p_item, p_on), true)
              || jsonb_build_object('checkedBy', private.staff_name(), 'checkedAt', now())
   where id = p_app;
end $$;

-- adm.edit: correct one particular on the applicant's form, with the reason (old → new kept by the audit trigger)
create function api.app_edit_field(p_app uuid, p_field text, p_value text, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_old text;
  v_stage public.app_stage;
begin
  if auth.uid() is null or private.staff_level('mem') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_field not in ('name', 'address', 'ntn', 'gst', 'tel', 'fax', 'email', 'web', 'particulars', 'est', 'rep', 'desig', 'cnic', 'mobile') then
    raise exception 'this field cannot be corrected here' using errcode = 'P0001', hint = 'field';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  if p_field = 'est' and coalesce(p_value, '') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'date must be YYYY-MM-DD' using errcode = 'P0001', hint = 'field';
  end if;
  select a.stage, a.form ->> p_field into v_stage, v_old from public.applications a where a.id = p_app for update;
  if v_stage is distinct from 'review' then
    raise exception 'fields can only be corrected during review' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason(p_reason);
  update public.applications
     set form = jsonb_set(form, array[p_field], to_jsonb(left(btrim(coalesce(p_value, '')), 600)), true),
         field_confidence = field_confidence - p_field
   where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'field corrected', p_field || ': ' || coalesce(v_old, '—') || ' → ' || coalesce(btrim(p_value), '—') || ' (' || btrim(p_reason) || ')',
          private.staff_name(), auth.uid());
end $$;

-- adm.cls: Secretary General (mem ≥ 3) overrides the class, with the reason (fee follows the class)
create function api.app_set_class(p_app uuid, p_class public.member_class, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_stage public.app_stage;
begin
  if auth.uid() is null or private.staff_level('mem') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select a.stage into v_stage from public.applications a where a.id = p_app for update;
  if v_stage not in ('submitted', 'review', 'returned', 'proposer', 'committee') then
    raise exception 'the class can no longer change' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason(p_reason);
  update public.applications set class = p_class where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'class set', p_class::text || ' (' || btrim(p_reason) || ')', private.staff_name(), auth.uid());
end $$;

-- adm.return (docs/03 review → returned): the applicant gets the note, a portal message and an email
create function api.app_return(p_app uuid, p_note text)
  returns table (email_id bigint, to_email text, lang text, token text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_stage public.app_stage;
begin
  if auth.uid() is null or private.staff_level('mem') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'a note for the applicant is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select a.stage into v_stage from public.applications a where a.id = p_app for update;
  if v_stage is distinct from 'review' then
    raise exception 'only an application in review can be returned' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason(btrim(p_note));
  update public.applications set stage = 'returned', return_note = left(btrim(p_note), 1000) where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'returned', btrim(p_note), private.staff_name(), auth.uid());
  perform private.app_notify(p_app, 'Correction needed', left(btrim(p_note), 1000));
  return query select * from private.app_email(p_app, 'membership_returned');
end $$;

-- adm.verify (docs/03 review → committee when both endorsements are Approved, else → proposer): every document
-- accepted, nothing missing, the required checklist ticked
create function api.app_verify(p_app uuid)
  returns table (email_id bigint, to_email text, lang text, token text, name text, stage text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  v_next public.app_stage;
  v_need text[];
  v_item text;
begin
  if auth.uid() is null or private.staff_level('mem') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into a from public.applications x where x.id = p_app for update;
  if a.stage is distinct from 'review' then
    raise exception 'only an application in review can be verified' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if cardinality(private.app_missing(p_app)) > 0 then
    raise exception 'the application is incomplete' using errcode = 'P0001', hint = 'incomplete';
  end if;
  if exists (select 1 from public.application_documents d where d.application_id = p_app and d.status <> 'ok') then
    raise exception 'accept every document first' using errcode = 'P0001', hint = 'documents';
  end if;
  select coalesce(array(select jsonb_array_elements_text(s.value -> 'checklist')), '{}') into v_need
  from private.settings s where s.key = 'membership';
  foreach v_item in array coalesce(v_need, '{}') loop
    if not coalesce((a.review -> 'checks' ->> v_item)::boolean, false) then
      raise exception 'complete the officer checklist first' using errcode = 'P0001', hint = 'checklist';
    end if;
  end loop;
  v_next := case when (select count(*) from public.endorsements e
                       where e.application_id = p_app and e.status = 'Approved') >= 2
                 then 'committee' else 'proposer' end;
  perform private.set_reason('documents verified');
  update public.applications set stage = v_next where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'verified', 'next: ' || v_next::text, private.staff_name(), auth.uid());
  perform private.app_notify(p_app, 'Documents verified',
    'MCCI has checked and accepted your documents (' || a.token || ').');
  return query select e.*, v_next::text from private.app_email(p_app, 'membership_verified') e;
end $$;

-- adm.reject (docs/03 → rejected, SG): final, with the reason
create function api.app_reject(p_app uuid, p_reason text)
  returns table (email_id bigint, to_email text, lang text, token text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_stage public.app_stage;
begin
  if auth.uid() is null or private.staff_level('mem') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  select a.stage into v_stage from public.applications a where a.id = p_app for update;
  if v_stage not in ('submitted', 'review', 'returned', 'proposer') then
    raise exception 'this application cannot be rejected now' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason(btrim(p_reason));
  update public.applications set stage = 'rejected', reject_note = left(btrim(p_reason), 1000), decided_at = now() where id = p_app;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (p_app, 'rejected', btrim(p_reason), private.staff_name(), auth.uid());
  perform private.app_notify(p_app, 'Application not approved', left(btrim(p_reason), 1000));
  return query select * from private.app_email(p_app, 'membership_rejected');
end $$;

-- 3. the app reports what happened to a queued email (only the person who queued it, only once)
create function api.email_mark(p_email bigint, p_ok boolean, p_provider_id text default null, p_error text default null)
  returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  update public.email_log
     set status = case when p_ok then 'sent' else 'failed' end,
         provider_id = left(p_provider_id, 200),
         error = case when p_ok then null else left(coalesce(p_error, 'not sent'), 300) end
   where id = p_email and created_by = auth.uid() and status = 'queued';
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end $$;

-- a resubmitted file goes back to the desk: tell staff nothing new is needed here (history is written by 0300)

do $$
declare f text;
begin
  foreach f in array array['api.app_open(uuid)', 'api.app_check(uuid,text,boolean)', 'api.app_edit_field(uuid,text,text,text)',
                           'api.app_set_class(uuid,public.member_class,text)', 'api.app_return(uuid,text)', 'api.app_verify(uuid)',
                           'api.app_reject(uuid,text)', 'api.email_mark(bigint,boolean,text,text)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
