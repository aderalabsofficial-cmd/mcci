-- Release 3 · proposer & seconder (docs/04, docs/03 §2) and the minimal Members Register that endorsement needs
-- (staff add an existing member and invite its owner; the full register and Excel import are M8).
--
-- Who may do what:
--   applicant (Owner / Manager of the applying company, area mship ≥ 2): candidates, request, withdraw, remind
--   endorser (Owner / Manager of the endorser member's company, private.my_endorser_member_ids): inbox, sign, decline
--   staff mem ≥ 2: remind; staff reg ≥ 2: add a member, invite / re-invite its owner
--   service role (the app server and the hourly job): issue the one-time code, run reminders and expiry
-- The one-time code is generated in the database, stored only as sha256(salt || code) in private.endorsement_otps
-- (never readable by any client), valid 10 minutes, 5 attempts, a new one after 60 s (docs/04 "One-time code").

-- ───────── helpers ─────────
create function private.endorse_rules() returns jsonb
  language sql stable security definer set search_path = ''
  as $$ select coalesce((select s.value from private.settings s where s.key = 'endorse'), '{}'::jsonb) $$;
revoke all on function private.endorse_rules() from public;

-- the applicant may act on this application (Owner / Manager of the applying company)
create function private.app_applicant(p_app uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.applications a
                   where a.id = p_app and private.company_level(a.company_id, 'mship') >= 2)
  $$;
revoke all on function private.app_applicant(uuid) from public;

create function private.norm_name(p text) returns text
  language sql immutable set search_path = ''
  as $$ select regexp_replace(lower(coalesce(p, '')), '[^a-z0-9]', '', 'g') $$;
revoke all on function private.norm_name(text) from public;

-- why member m cannot endorse application a in role r (null = eligible); docs/04 rules 1–6
create function private.endorse_why(p_app uuid, p_role public.endorse_role, p_member uuid) returns text
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  a public.applications;
  m public.members;
  r jsonb := private.endorse_rules();
  v_cls public.member_class;
  v_other uuid;
begin
  select * into a from public.applications x where x.id = p_app;
  select * into m from public.members x where x.id = p_member;
  if a.id is null or m.id is null then
    return 'Not found';
  end if;
  if not (m.status = 'Permanent' or (m.status = 'Temporary' and coalesce((r ->> 'tempMembersMayEndorse')::boolean, false))) then
    return 'Not a valid permanent member';
  end if;
  if m.valid_to < (now() at time zone 'Asia/Karachi')::date then
    return 'Membership has expired';
  end if;
  v_cls := coalesce(a.class, private.class_of(a.form));
  if coalesce((r ->> 'sameClass')::boolean, true) and m.class <> v_cls then
    return 'Different class (' || m.class::text || ')';
  end if;
  if m.company_id = a.company_id then
    return 'Your own company';
  end if;
  if private.norm_name(m.rep_name) <> '' and (
       private.norm_name(m.rep_name) = private.norm_name(a.form ->> 'rep')
       or exists (select 1 from public.application_partners p where p.application_id = p_app
                  and private.norm_name(p.name) = private.norm_name(m.rep_name))) then
    return 'Your representative or a partner / director';
  end if;
  select e.endorser_member_id into v_other from public.endorsements e
   where e.application_id = p_app and e.role <> p_role and e.status in ('Pending', 'Approved') limit 1;
  if v_other is not null and (v_other = p_member or (select x.company_id from public.members x where x.id = v_other) = m.company_id) then
    return 'Already your other endorser';
  end if;
  if (select count(*) from public.endorsements e where e.endorser_member_id = p_member and e.status = 'Approved'
        and e.decided_at > now() - interval '365 days') >= coalesce((r ->> 'maxPerYear')::int, 12) then
    return 'Yearly endorsement limit reached';
  end if;
  return null;
end $$;
revoke all on function private.endorse_why(uuid, public.endorse_role, uuid) from public;

-- Owner / Manager users of a member's company, for notifications and emails
create function private.member_contacts(p_member uuid) returns table (user_id uuid, email text, full_name text, lang text)
  language sql stable security definer set search_path = ''
  as $$
    select p.id, p.email::text, p.full_name, p.lang
    from public.members m
    join public.company_users cu on cu.company_id = m.company_id and cu.status = 'Active' and cu.role in ('Owner', 'Manager')
    join public.profiles p on p.id = cu.user_id
    where m.id = p_member
  $$;
revoke all on function private.member_contacts(uuid) from public;

-- the application leaves "proposer" as soon as both endorsements are signed (docs/04 flow 5)
create function private.endorse_advance(p_app uuid) returns boolean
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if (select a.stage from public.applications a where a.id = p_app) = 'proposer'
     and (select count(distinct e.role) from public.endorsements e where e.application_id = p_app and e.status = 'Approved') = 2 then
    update public.applications set stage = 'committee' where id = p_app;
    insert into public.application_history (application_id, step, note) values (p_app, 'to committee', 'proposer and seconder signed');
    perform private.app_notify(p_app, 'With the Membership Committee', 'Both endorsements are complete. Your application is now with the Membership Committee.');
    return true;
  end if;
  return false;
end $$;
revoke all on function private.endorse_advance(uuid) from public;

-- ───────── applicant ─────────
-- end.pick: valid members to choose from, with the reason when not eligible (no CNIC, mobile or email)
create function api.end_candidates(p_app uuid, p_role public.endorse_role, p_query text default '')
  returns table (member_id uuid, member_no text, company text, rep text, class text, sector text, same_sector boolean,
                 year_count int, why text)
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  v_q text := lower(btrim(coalesce(p_query, '')));
  v_sector text;
begin
  if auth.uid() is null or not private.app_applicant(p_app) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select a.form #>> '{nature,sector}' into v_sector from public.applications a where a.id = p_app;
  return query
    select m.id, m.member_no, c.name, m.rep_name, m.class::text, coalesce(c.nature_sector, c.sector, ''),
           (c.nature_sector is not null and c.nature_sector = v_sector),
           (select count(*)::int from public.endorsements e where e.endorser_member_id = m.id and e.status = 'Approved'
              and e.decided_at > now() - interval '365 days'),
           private.endorse_why(p_app, p_role, m.id)
    from public.members m join public.companies c on c.id = m.company_id
    where m.status in ('Permanent', 'Temporary')
      and (v_q = '' or lower(m.rep_name || ' ' || c.name || ' ' || coalesce(c.nature_sector, '') || ' ' || m.member_no) like '%' || v_q || '%')
    order by (private.endorse_why(p_app, p_role, m.id) is null) desc,
             (c.nature_sector is not null and c.nature_sector = v_sector) desc, c.name
    limit 60;
end $$;

-- end.compose: send the request (Pending, expires after settings.endorse.days); the endorser's Owner / Manager users
-- get a portal message; the app emails them (returned contacts)
create function api.end_request(p_app uuid, p_role public.endorse_role, p_member uuid, p_message text)
  returns table (endorsement_id uuid, email text, full_name text, lang text, applicant text, business text, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  a public.applications;
  v_why text;
  v_id uuid;
  v_days int := coalesce((private.endorse_rules() ->> 'days')::int, 7);
begin
  select * into a from public.applications x where x.id = p_app for update;
  if a.id is null or auth.uid() is null or not private.app_applicant(p_app) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if a.stage not in ('draft', 'submitted', 'review', 'returned', 'proposer') then
    raise exception 'endorsements are closed for this application' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  v_why := private.endorse_why(p_app, p_role, p_member);
  if v_why is not null then
    raise exception 'member not eligible: %', v_why using errcode = 'P0001', hint = 'not_eligible';
  end if;
  perform private.set_reason(p_role::text || ' request sent');
  begin
    insert into public.endorsements (application_id, role, endorser_member_id, message, expires_at)
    values (p_app, p_role, p_member, left(nullif(btrim(p_message), ''), 1000), now() + make_interval(days => v_days))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'a request for this role is already open' using errcode = 'P0001', hint = 'already_requested';
  end;
  insert into public.application_history (application_id, step, note, by_user)
  values (p_app, p_role::text || ' requested', (select m.rep_name || ' (' || m.member_no || ')' from public.members m where m.id = p_member), auth.uid());
  insert into public.notifications (user_id, title, body, link, channel)
  select c.user_id, 'New ' || p_role::text || ' request',
         coalesce(a.form ->> 'rep', 'An applicant') || ' of ' || coalesce(a.form ->> 'name', 'a business') ||
         ' asks you to be their ' || p_role::text || ' for MCCI membership.', '/portal/endorse', 'Email + Portal'
  from private.member_contacts(p_member) c;
  return query select v_id, c.email, c.full_name, c.lang, coalesce(a.form ->> 'rep', ''), coalesce(a.form ->> 'name', ''), a.token
               from private.member_contacts(p_member) c;
end $$;

-- end.withdraw: the applicant closes a pending request (and can then choose another member)
create function api.end_withdraw(p_endorsement uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  e public.endorsements;
begin
  select * into e from public.endorsements x where x.id = p_endorsement for update;
  if e.id is null or auth.uid() is null or not private.app_applicant(e.application_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if e.status <> 'Pending' then
    raise exception 'only a pending request can be withdrawn' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  perform private.set_reason('endorsement request withdrawn by the applicant');
  update public.endorsements set status = 'Withdrawn', decided_at = now() where id = p_endorsement;
  insert into public.application_history (application_id, step, note, by_user)
  values (e.application_id, e.role::text || ' request withdrawn', null, auth.uid());
end $$;

-- end.remind / adm.prop.remind: the applicant (once a day) or an officer (mem ≥ 2) reminds a pending endorser
create function api.end_remind(p_endorsement uuid)
  returns table (email text, full_name text, lang text, applicant text, business text, token text, role text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  e public.endorsements;
  a public.applications;
begin
  select * into e from public.endorsements x where x.id = p_endorsement for update;
  if e.id is null or auth.uid() is null
     or not (private.app_applicant(e.application_id) or private.staff_level('mem') >= 2) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if e.status <> 'Pending' then
    raise exception 'only a pending request can be reminded' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if e.last_reminded_at > now() - interval '24 hours' then
    raise exception 'a reminder was sent in the last 24 hours' using errcode = 'P0001', hint = 'too_soon';
  end if;
  select * into a from public.applications x where x.id = e.application_id;
  perform private.set_reason('endorsement reminder');
  update public.endorsements set reminders = reminders + 1, last_reminded_at = now() where id = p_endorsement;
  insert into public.notifications (user_id, title, body, link, channel)
  select c.user_id, 'Reminder: ' || e.role::text || ' request', coalesce(a.form ->> 'name', 'An applicant') ||
         ' is waiting for your decision.', '/portal/endorse', 'Email + Portal'
  from private.member_contacts(e.endorser_member_id) c;
  return query select c.email, c.full_name, c.lang, coalesce(a.form ->> 'rep', ''), coalesce(a.form ->> 'name', ''), a.token, e.role::text
               from private.member_contacts(e.endorser_member_id) c;
end $$;

-- the endorsements of an application with the endorser's public details (applicant and staff)
create function api.app_endorsements(p_app uuid)
  returns table (id uuid, role text, status text, member_no text, company text, rep text, message text,
                 requested_at timestamptz, expires_at timestamptz, decided_at timestamptz, decline_reason text,
                 ref text, reminders int, last_reminded_at timestamptz, signature_path text)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or not (private.app_applicant(p_app) or private.staff_level('mem') >= 1
       or exists (select 1 from public.applications a where a.id = p_app and a.company_id in (select private.my_company_ids()))) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select e.id, e.role::text, e.status::text, m.member_no, c.name, m.rep_name, e.message, e.requested_at, e.expires_at,
           e.decided_at, e.decline_reason, e.ref, e.reminders::int, e.last_reminded_at, e.signature_path
    from public.endorsements e join public.members m on m.id = e.endorser_member_id join public.companies c on c.id = m.company_id
    where e.application_id = p_app
    order by e.requested_at desc;
end $$;

-- ───────── endorser ─────────
-- end inbox: requests to the member companies I act for, with an applicant summary (no documents, CNIC or contact)
create function api.end_inbox()
  returns table (id uuid, role text, status text, member_no text, my_company text, message text, requested_at timestamptz,
                 expires_at timestamptz, decided_at timestamptz, decline_reason text, ref text, token text,
                 applicant text, business text, biz text, manufacturing boolean, nature text, address text, est text,
                 class text, partners text[])
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select e.id, e.role::text, e.status::text, m.member_no, mc.name, e.message, e.requested_at, e.expires_at, e.decided_at,
           e.decline_reason, e.ref, a.token, a.form ->> 'rep', a.form ->> 'name', a.form ->> 'biz',
           coalesce((a.form ->> 'manufacturing')::boolean, false), a.form ->> 'particulars', a.form ->> 'address', a.form ->> 'est',
           coalesce(a.class, private.class_of(a.form))::text,
           array(select p.name from public.application_partners p where p.application_id = a.id order by p.position)
    from public.endorsements e
    join public.members m on m.id = e.endorser_member_id
    join public.companies mc on mc.id = m.company_id
    join public.applications a on a.id = e.application_id
    where e.endorser_member_id in (select private.my_endorser_member_ids())
    order by (e.status = 'Pending') desc, e.requested_at desc;
end $$;

-- one-time code for signing: called by the app server only (service role) for the signed-in endorser, whose identity
-- the server has verified; returns the code to email and the address to send it to
create function api.end_code_issue(p_endorsement uuid, p_user uuid) returns table (code text, email text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  e public.endorsements;
  v_code text := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_salt text := encode(extensions.gen_random_bytes(16), 'hex');
  v_last timestamptz;
begin
  select * into e from public.endorsements x where x.id = p_endorsement for update;
  if e.id is null or e.status <> 'Pending' or e.expires_at < now()
     or not exists (select 1 from private.member_contacts(e.endorser_member_id) c where c.user_id = p_user) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select o.last_sent_at into v_last from private.endorsement_otps o where o.endorsement_id = p_endorsement;
  if v_last > now() - interval '60 seconds' then
    raise exception 'wait a minute before asking for a new code' using errcode = 'P0001', hint = 'too_soon';
  end if;
  insert into private.endorsement_otps (endorsement_id, code_hash, salt, expires_at, attempts, last_sent_at)
  values (p_endorsement, encode(extensions.digest(v_salt || v_code, 'sha256'), 'hex'), v_salt, now() + interval '10 minutes', 0, now())
  on conflict (endorsement_id) do update
    set code_hash = excluded.code_hash, salt = excluded.salt, expires_at = excluded.expires_at, attempts = 0, last_sent_at = now();
  return query select v_code, (select p.email::text from public.profiles p where p.id = p_user);
end $$;
revoke all on function api.end_code_issue(uuid, uuid) from public, anon, authenticated;
grant execute on function api.end_code_issue(uuid, uuid) to service_role;

-- end.sign: declaration + signature + the emailed code. A wrong code is counted (5 attempts) and reported as a result,
-- not an error, so the count is kept. Signing completes the request; when both are signed the file moves on.
create function api.end_sign(p_endorsement uuid, p_code text, p_declaration text, p_signature_path text,
                             p_doc_hash text, p_ip text, p_user_agent text)
  returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  e public.endorsements;
  o private.endorsement_otps;
  v_ref text;
  v_ip inet;
begin
  select * into e from public.endorsements x where x.id = p_endorsement for update;
  if e.id is null or auth.uid() is null or e.endorser_member_id not in (select private.my_endorser_member_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if e.status <> 'Pending' then
    raise exception 'this request is no longer open' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if e.expires_at < now() then
    raise exception 'this request has expired' using errcode = 'P0001', hint = 'expired';
  end if;
  if coalesce(btrim(p_declaration), '') = '' or coalesce(p_signature_path, '') = '' then
    raise exception 'declaration and signature are required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  if coalesce((private.endorse_rules() ->> 'needCode')::boolean, true) then
    select * into o from private.endorsement_otps x where x.endorsement_id = p_endorsement for update;
    if o.endorsement_id is null or o.expires_at < now() then
      return 'code_expired';
    end if;
    if o.attempts >= 5 then
      return 'too_many';
    end if;
    if encode(extensions.digest(o.salt || coalesce(p_code, ''), 'sha256'), 'hex') <> o.code_hash then
      update private.endorsement_otps set attempts = attempts + 1 where endorsement_id = p_endorsement;
      return 'wrong_code';
    end if;
    delete from private.endorsement_otps where endorsement_id = p_endorsement;
  end if;
  begin
    v_ip := nullif(btrim(p_ip), '')::inet;
  exception when others then
    v_ip := null;
  end;
  v_ref := upper(left(encode(extensions.digest(e.id::text || now()::text, 'sha256'), 'hex'), 12));
  perform private.set_reason(e.role::text || ' signed');
  update public.endorsements
     set status = 'Approved', decided_at = now(), decided_by = auth.uid(), declaration_text = left(p_declaration, 2000),
         signature_path = p_signature_path, otp_verified_at = now(), ip = v_ip, user_agent = left(p_user_agent, 300),
         doc_hash = case when p_doc_hash ~ '^[0-9a-f]{64}$' then p_doc_hash end, ref = v_ref
   where id = p_endorsement;
  insert into public.application_history (application_id, step, note, by_name, by_user)
  values (e.application_id, e.role::text || ' signed',
          (select m.rep_name || ' (' || m.member_no || ') · ref ' || v_ref from public.members m where m.id = e.endorser_member_id),
          (select p.full_name from public.profiles p where p.id = auth.uid()), auth.uid());
  perform private.app_notify(e.application_id, 'Your ' || e.role::text || ' signed',
          (select m.rep_name from public.members m where m.id = e.endorser_member_id) || ' approved and signed your application as ' || e.role::text || '.');
  perform private.endorse_advance(e.application_id);
  return 'signed';
end $$;

-- end.decline: with the reason; the applicant is told and can choose another member
create function api.end_decline(p_endorsement uuid, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  e public.endorsements;
begin
  select * into e from public.endorsements x where x.id = p_endorsement for update;
  if e.id is null or auth.uid() is null or e.endorser_member_id not in (select private.my_endorser_member_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if e.status <> 'Pending' then
    raise exception 'this request is no longer open' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.set_reason(btrim(p_reason));
  update public.endorsements set status = 'Declined', decided_at = now(), decided_by = auth.uid(), decline_reason = left(btrim(p_reason), 500)
   where id = p_endorsement;
  insert into public.application_history (application_id, step, note, by_user)
  values (e.application_id, e.role::text || ' declined', left(btrim(p_reason), 500), auth.uid());
  perform private.app_notify(e.application_id, 'Your ' || e.role::text || ' declined',
          'Reason: ' || left(btrim(p_reason), 500) || '. Please choose another member.');
end $$;

-- hourly job (docs/04 "Jobs"), service role: day-N reminder once, then expiry; returns what to email
create function api.end_jobs()
  returns table (kind text, email text, full_name text, lang text, token text, role text, business text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  r jsonb := private.endorse_rules();
  v_remind int := coalesce((r ->> 'remindDay')::int, 3);
  e record;
begin
  perform private.set_reason('endorsement job');
  for e in select x.*, a.token as tok, a.form ->> 'name' as biz from public.endorsements x join public.applications a on a.id = x.application_id
           where x.status = 'Pending' and x.expires_at < now() for update of x loop
    update public.endorsements set status = 'Expired', decided_at = now() where id = e.id;
    insert into public.application_history (application_id, step, note) values (e.application_id, e.role::text || ' expired', 'no answer in time');
    perform private.app_notify(e.application_id, 'Your ' || e.role::text || ' request expired', 'The member did not answer in time. Please choose another member.');
    return query select 'expired'::text, p.email::text, p.full_name, p.lang, e.tok, e.role::text, e.biz
                 from public.applications a join public.profiles p on p.id = a.created_by where a.id = e.application_id;
  end loop;
  for e in select x.*, a.token as tok, a.form ->> 'name' as biz from public.endorsements x join public.applications a on a.id = x.application_id
           where x.status = 'Pending' and x.reminders = 0 and x.requested_at < now() - make_interval(days => v_remind) for update of x loop
    update public.endorsements set reminders = reminders + 1, last_reminded_at = now() where id = e.id;
    insert into public.notifications (user_id, title, body, link, channel)
    select c.user_id, 'Reminder: ' || e.role::text || ' request', coalesce(e.biz, 'An applicant') || ' is waiting for your decision.', '/portal/endorse', 'Email + Portal'
    from private.member_contacts(e.endorser_member_id) c;
    return query select 'remind'::text, c.email, c.full_name, c.lang, e.tok, e.role::text, e.biz from private.member_contacts(e.endorser_member_id) c;
  end loop;
end $$;
revoke all on function api.end_jobs() from public, anon, authenticated;
grant execute on function api.end_jobs() to service_role;

-- ───────── Members Register (minimal): add an existing member and invite its owner ─────────
-- staff with module reg ≥ 2 also manage the invitations of member companies (resend / revoke)
create or replace function private.can_manage_invite(p_kind text, p_company uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select case p_kind
      when 'staff' then private.staff_level('staff') >= 3
      when 'company_user' then p_company is not null
                            and (private.company_level(p_company, 'profile') >= 3 or private.staff_level('reg') >= 2)
      else false end
  $$;

create function api.member_add(p_company text, p_biz public.biz_type, p_class public.member_class, p_member_no text,
                               p_rep text, p_since date, p_valid_to date, p_sector text, p_women boolean,
                               p_owner_email text, p_owner_name text)
  returns table (member_id uuid, member_no text, company_id uuid, invitation_id uuid, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_company uuid;
  v_member uuid;
  v_no text := nullif(upper(btrim(p_member_no)), '');
  v_email extensions.citext := private.normal_email(p_owner_email);
  v_token text := private.invite_token();
  v_inv uuid;
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_company), '') = '' or coalesce(btrim(p_rep), '') = '' then
    raise exception 'company and representative are required' using errcode = 'P0001', hint = 'required';
  end if;
  if v_no is not null and v_no !~ '^MCCI-[CA]-\d{3,6}$' then
    raise exception 'membership number like MCCI-C-1134' using errcode = 'P0001', hint = 'member_no';
  end if;
  if v_no is not null and exists (select 1 from public.members x where x.member_no = v_no) then
    raise exception 'membership number already used' using errcode = 'P0001', hint = 'member_no_taken';
  end if;
  perform private.set_reason('existing member added to the register');
  insert into public.companies (name, biz_type, nature_sector) values (btrim(p_company), p_biz, nullif(btrim(p_sector), ''))
  returning id into v_company;
  insert into public.members (member_no, company_id, class, women, status, rep_name, since, valid_to, imported)
  values (coalesce(v_no, private.next_member_no(p_class)), v_company, p_class, coalesce(p_women, false), 'Permanent', btrim(p_rep),
          coalesce(p_since, (now() at time zone 'Asia/Karachi')::date), p_valid_to, true)
  returning id, members.member_no into v_member, v_no;
  insert into public.invitations (kind, email, full_name, company_id, company_role, token_hash, invited_by)
  values ('company_user', v_email, nullif(btrim(p_owner_name), ''), v_company, 'Owner', private.invite_hash(v_token), auth.uid())
  returning id into v_inv;
  return query select v_member, v_no, v_company, v_inv, v_token;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'api.end_candidates(uuid,public.endorse_role,text)', 'api.end_request(uuid,public.endorse_role,uuid,text)',
    'api.end_withdraw(uuid)', 'api.end_remind(uuid)', 'api.app_endorsements(uuid)', 'api.end_inbox()',
    'api.end_sign(uuid,text,text,text,text,text,text)', 'api.end_decline(uuid,text)',
    'api.member_add(text,public.biz_type,public.member_class,text,text,date,date,text,boolean,text,text)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
