-- 0280 · invitations and role assignments (M1; actions staff.invite/resend/revoke/edit, user.invite/resend/edit/remove)
--
-- Pattern as in 0250: SECURITY DEFINER + empty search_path, the permission is checked here (a missed check in app code
-- cannot bypass it), rows are locked, private.set_reason() gives the audit trigger the human "why", errors are
-- 42501 (not allowed) or P0001 with a stable hint that the UI maps to a bilingual message.
--
-- Invitation tokens (F-17): 32 random bytes, returned ONCE to the inviting server action (which emails the link) and
-- stored only as a sha256 hash. Valid 7 days. Accepting needs the token AND an account with the invited email address;
-- lookup and accept run only from the trusted server (service_role), because the invitee may not be signed in yet.
--   staff invitations        staff module level 3 (Secretary General, docs/06)
--   company-user invitations the company's Owner (company area 'profile' level 3)

create function private.invite_token() returns text
  language sql volatile set search_path = ''
  as $$ select translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_') $$;

create function private.invite_hash(p_token text) returns text
  language sql immutable set search_path = ''
  as $$ select encode(extensions.digest(p_token, 'sha256'), 'hex') $$;

revoke all on function private.invite_token(), private.invite_hash(text) from public, anon, authenticated;

-- may the current user manage this invitation / these people?
create function private.can_manage_invite(p_kind text, p_company uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select case p_kind
      when 'staff' then private.staff_level('staff') >= 3
      when 'company_user' then p_company is not null and private.company_level(p_company, 'profile') >= 3
      else false end
  $$;
revoke all on function private.can_manage_invite(text, uuid) from public, anon;
grant execute on function private.can_manage_invite(text, uuid) to authenticated, service_role;

create function private.normal_email(p_email text) returns extensions.citext
  language plpgsql immutable set search_path = ''
  as $$
begin
  if p_email is null or length(p_email) > 254 or p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid email' using errcode = 'P0001', hint = 'email';
  end if;
  return lower(trim(p_email))::extensions.citext;
end $$;

-- ───────── invite ─────────
create function api.invite_staff(p_email text, p_full_name text, p_designation text)
  returns table (id uuid, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_email extensions.citext := private.normal_email(p_email);
  v_token text := private.invite_token();
  v_id uuid;
begin
  if auth.uid() is null or not private.can_manage_invite('staff', null) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.designations d where d.name = p_designation) then
    raise exception 'unknown designation' using errcode = 'P0001', hint = 'designation';
  end if;
  if exists (select 1 from public.staff s join public.profiles p on p.id = s.user_id where p.email = v_email and s.active) then
    raise exception 'already staff' using errcode = 'P0001', hint = 'already_staff';
  end if;
  perform private.set_reason('staff invitation sent');
  begin
    insert into public.invitations (kind, email, full_name, designation, token_hash, invited_by)
    values ('staff', v_email, nullif(trim(p_full_name), ''), p_designation, private.invite_hash(v_token), auth.uid())
    returning invitations.id into v_id;
  exception when unique_violation then
    raise exception 'already invited' using errcode = 'P0001', hint = 'already_invited';
  end;
  return query select v_id, v_token;
end $$;

create function api.invite_company_user(p_company uuid, p_email text, p_full_name text, p_role public.company_role)
  returns table (id uuid, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_email extensions.citext := private.normal_email(p_email);
  v_token text := private.invite_token();
  v_id uuid;
begin
  if auth.uid() is null or not private.can_manage_invite('company_user', p_company) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.company_users cu join public.profiles p on p.id = cu.user_id
             where cu.company_id = p_company and p.email = v_email and cu.status = 'Active') then
    raise exception 'already a user of this company' using errcode = 'P0001', hint = 'already_member';
  end if;
  perform private.set_reason('company user invitation sent');
  begin
    insert into public.invitations (kind, email, full_name, company_id, company_role, token_hash, invited_by)
    values ('company_user', v_email, nullif(trim(p_full_name), ''), p_company, p_role, private.invite_hash(v_token), auth.uid())
    returning invitations.id into v_id;
  exception when unique_violation then
    raise exception 'already invited' using errcode = 'P0001', hint = 'already_invited';
  end;
  return query select v_id, v_token;
end $$;

-- a new 7-day link (the old one stops working); also re-opens an expired invitation
create function api.invite_resend(p_id uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_inv public.invitations;
  v_token text := private.invite_token();
begin
  select * into v_inv from public.invitations i where i.id = p_id for update;
  if v_inv.id is null or auth.uid() is null or not private.can_manage_invite(v_inv.kind, v_inv.company_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_inv.status not in ('Invited', 'Expired') then
    raise exception 'invitation is %', v_inv.status using errcode = 'P0001', hint = 'invite_closed';
  end if;
  perform private.set_reason('invitation link sent again');
  update public.invitations
     set token_hash = private.invite_hash(v_token), status = 'Invited', expires_at = now() + interval '7 days'
   where invitations.id = p_id;
  return v_token;
end $$;

create function api.invite_revoke(p_id uuid) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_inv public.invitations;
begin
  select * into v_inv from public.invitations i where i.id = p_id for update;
  if v_inv.id is null or auth.uid() is null or not private.can_manage_invite(v_inv.kind, v_inv.company_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_inv.status <> 'Invited' then
    raise exception 'invitation is %', v_inv.status using errcode = 'P0001', hint = 'invite_closed';
  end if;
  perform private.set_reason('invitation cancelled');
  update public.invitations set status = 'Revoked', revoked_by = auth.uid() where invitations.id = p_id;
end $$;

-- ───────── trusted server only: what the link is for, and accepting it ─────────
create function api.invite_lookup(p_token text)
  returns table (id uuid, kind text, email text, full_name text, designation text, company_name text,
                 company_role public.company_role, status public.invite_status, expires_at timestamptz)
  language sql stable security definer set search_path = ''
  as $$
    select i.id, i.kind, i.email::text, i.full_name, i.designation, c.name, i.company_role,
           case when i.status = 'Invited' and i.expires_at <= now() then 'Expired'::public.invite_status else i.status end,
           i.expires_at
      from public.invitations i
      left join public.companies c on c.id = i.company_id
     where i.token_hash = private.invite_hash(p_token)
  $$;

create function api.invite_accept(p_token text, p_user uuid) returns table (kind text, company_id uuid)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_inv public.invitations;
  v_email extensions.citext;
begin
  select * into v_inv from public.invitations i where i.token_hash = private.invite_hash(p_token) for update;
  if v_inv.id is null or v_inv.status <> 'Invited' then
    raise exception 'invitation not valid' using errcode = 'P0001', hint = 'invite_invalid';
  end if;
  if v_inv.expires_at <= now() then
    update public.invitations set status = 'Expired' where invitations.id = v_inv.id;
    raise exception 'invitation expired' using errcode = 'P0001', hint = 'invite_expired';
  end if;
  select p.email into v_email from public.profiles p where p.id = p_user;
  if v_email is null or v_email <> v_inv.email then
    raise exception 'account email does not match' using errcode = 'P0001', hint = 'email_mismatch';
  end if;

  perform private.set_reason('invitation accepted by ' || p_user::text);
  if v_inv.kind = 'staff' then
    insert into public.staff (user_id, designation)
    values (p_user, v_inv.designation)
    on conflict (user_id) do update
      set designation = excluded.designation, active = true, deactivated_at = null, deactivated_by = null;
  else
    insert into public.company_users (company_id, user_id, role, status)
    values (v_inv.company_id, p_user, v_inv.company_role, 'Active')
    on conflict on constraint company_users_pkey do update set role = excluded.role, status = 'Active';
  end if;
  update public.invitations set status = 'Active', accepted_at = now() where invitations.id = v_inv.id;
  return query select v_inv.kind, v_inv.company_id;
end $$;

-- ───────── role assignments ─────────
-- staff designation and active flag (staff.edit); nobody changes their own (no self-lockout or self-promotion)
create function api.staff_update(p_user uuid, p_designation text, p_active boolean) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_staff public.staff;
begin
  if auth.uid() is null or private.staff_level('staff') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'cannot change your own staff record' using errcode = 'P0001', hint = 'self';
  end if;
  select * into v_staff from public.staff s where s.user_id = p_user for update;
  if v_staff.user_id is null then
    raise exception 'not a staff member' using errcode = 'P0001', hint = 'not_staff';
  end if;
  if not exists (select 1 from public.designations d where d.name = p_designation) then
    raise exception 'unknown designation' using errcode = 'P0001', hint = 'designation';
  end if;
  perform private.set_reason(case when p_active then 'staff record updated' else 'staff member deactivated' end);
  update public.staff
     set designation = p_designation,
         active = p_active,
         deactivated_at = case when p_active then null else coalesce(staff.deactivated_at, now()) end,
         deactivated_by = case when p_active then null else coalesce(staff.deactivated_by, auth.uid()) end
   where staff.user_id = p_user;
end $$;

-- a colleague's role, or removal (user.edit / user.remove): the Owner of the company; the last active Owner is kept
-- by the existing trigger (F-20)
create function api.company_user_update(p_company uuid, p_user uuid, p_role public.company_role, p_active boolean)
  returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.company_level(p_company, 'profile') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.company_users cu where cu.company_id = p_company and cu.user_id = p_user) then
    raise exception 'not a user of this company' using errcode = 'P0001', hint = 'not_member';
  end if;
  perform private.set_reason(case when p_active then 'company user role changed' else 'company user removed' end);
  update public.company_users
     set role = p_role, status = case when p_active then 'Active' else 'Revoked' end::public.invite_status
   where company_users.company_id = p_company and company_users.user_id = p_user;
end $$;

revoke all on function api.invite_staff(text, text, text), api.invite_company_user(uuid, text, text, public.company_role),
  api.invite_resend(uuid), api.invite_revoke(uuid), api.staff_update(uuid, text, boolean),
  api.company_user_update(uuid, uuid, public.company_role, boolean) from public, anon;
grant execute on function api.invite_staff(text, text, text), api.invite_company_user(uuid, text, text, public.company_role),
  api.invite_resend(uuid), api.invite_revoke(uuid), api.staff_update(uuid, text, boolean),
  api.company_user_update(uuid, uuid, public.company_role, boolean) to authenticated;
revoke all on function api.invite_lookup(text), api.invite_accept(text, uuid) from public, anon, authenticated;
grant execute on function api.invite_lookup(text), api.invite_accept(text, uuid) to service_role;
