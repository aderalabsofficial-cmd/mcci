-- 0680 · New sign-up and existing members' claims (owner, 4 Nov 2026).
--
-- Sign-up: mobile number and email, a 6-digit code by email (SMS when MCCI's masking is approved), a welcome, then
-- "finish your sign-up": name, password and "Are you an existing member of MCCI?". api.signup_finish saves the name and
-- the mobile (one account per mobile: sign-in by mobile must find one person).
-- An existing member claims their membership: class, the membership number in digits (the form shows the MCCI-C- /
-- MCCI-A- prefix) and, when unsure of the number, the company name. The database matches the register (by number,
-- else by a close company name) and staff of the Members Register (reg ≥ 2) approve, which links the account to the
-- member's company, or reject with a reason; the person is told either way. Until then the portal shows only "your
-- existing membership is pending approval". Members see only their own claims; nobody writes the table directly.

create table public.membership_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  class public.member_class not null,
  digits text check (digits is null or digits ~ '^[0-9]{1,8}$'),
  member_no text,                                  -- MCCI-C-<digits> / MCCI-A-<digits>, as claimed
  company_name text check (company_name is null or length(company_name) <= 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  match_member uuid references public.members on delete set null,     -- the register's best match, a suggestion
  member_id uuid references public.members on delete set null,        -- the member staff approved
  role public.company_role,
  note text check (note is null or length(note) <= 1000),
  decided_by uuid references public.profiles on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (digits is not null or coalesce(btrim(company_name), '') <> '')
);
create unique index membership_claims_one_pending on public.membership_claims (user_id) where status = 'pending';
create index membership_claims_status on public.membership_claims (status, created_at);
alter table public.membership_claims enable row level security;
grant select on public.membership_claims to authenticated;
create policy membership_claims_select on public.membership_claims for select to authenticated
  using (user_id = (select auth.uid()) or (select private.staff_level('reg')) >= 1);
create trigger audit_row after insert or update or delete on public.membership_claims
  for each row execute function private.audit_row();

-- the signed-in person's own name and mobile, once their email code was right (sign-up step 3)
create function api.signup_finish(p_full_name text, p_mobile text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_mobile text := nullif(btrim(coalesce(p_mobile, '')), '');
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if coalesce(length(btrim(p_full_name)), 0) not between 2 and 120 then
    raise exception 'name' using errcode = 'P0001', hint = 'name';
  end if;
  if v_mobile is not null and v_mobile !~ '^03[0-9]{9}$' then
    raise exception 'mobile' using errcode = 'P0001', hint = 'mobile';
  end if;
  if v_mobile is not null and exists (select 1 from public.profiles p where p.mobile = v_mobile and p.id <> auth.uid()) then
    raise exception 'this mobile number has an account' using errcode = 'P0001', hint = 'mobile_taken';
  end if;
  perform private.set_reason('sign-up finished');
  update public.profiles p set full_name = btrim(p_full_name), mobile = coalesce(v_mobile, p.mobile), updated_at = now()
   where p.id = auth.uid();
end $$;

-- "I am an existing member": one pending claim per person, only for an account not linked to a company yet
create function api.claim_submit(p_class public.member_class, p_digits text, p_company text) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_digits text := nullif(regexp_replace(coalesce(p_digits, ''), '\s', '', 'g'), '');
  v_company text := nullif(btrim(coalesce(p_company, '')), '');
  v_no text;
  v_match uuid;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if exists (select 1 from public.staff s where s.user_id = auth.uid() and s.active) then
    raise exception 'staff accounts do not claim a membership' using errcode = 'P0001', hint = 'staff';
  end if;
  if exists (select 1 from public.company_users cu where cu.user_id = auth.uid()) then
    raise exception 'this account already belongs to a company' using errcode = 'P0001', hint = 'linked';
  end if;
  if exists (select 1 from public.membership_claims c where c.user_id = auth.uid() and c.status = 'pending') then
    raise exception 'a claim is already waiting' using errcode = 'P0001', hint = 'pending';
  end if;
  if v_digits is not null and v_digits !~ '^[0-9]{1,8}$' then
    raise exception 'digits only' using errcode = 'P0001', hint = 'digits';
  end if;
  if v_digits is null and v_company is null then
    raise exception 'a number or a company name' using errcode = 'P0001', hint = 'required';
  end if;
  if v_company is not null and length(v_company) > 200 then
    raise exception 'company name too long' using errcode = 'P0001', hint = 'required';
  end if;
  if v_digits is not null then
    v_no := 'MCCI-' || case when p_class = 'Corporate' then 'C' else 'A' end || '-' || v_digits;
    -- the same number in the register, with or without leading zeros
    select m.id into v_match from public.members m join public.companies c on c.id = m.company_id
     where not c.demo and m.class = p_class
       and ltrim(substring(m.member_no from '([0-9]+)$'), '0') = ltrim(v_digits, '0')
     order by (m.member_no = v_no) desc limit 1;
  end if;
  if v_match is null and v_company is not null then
    select m.id into v_match from public.members m join public.companies c on c.id = m.company_id
     where not c.demo and private.name_similar(c.name, v_company) >= 0.6
     order by private.name_similar(c.name, v_company) desc limit 1;
  end if;
  perform private.set_reason('existing membership claimed');
  insert into public.membership_claims (user_id, class, digits, member_no, company_name, match_member)
  values (auth.uid(), p_class, v_digits, v_no, v_company, v_match)
  returning id into v_id;
  return v_id;
end $$;

-- staff of the Members Register: approve (the account joins the member's company) or reject with a reason
create function api.claim_decide(p_id uuid, p_approve boolean, p_member uuid default null,
                                 p_role public.company_role default 'Owner', p_note text default null) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  c public.membership_claims;
  m public.members;
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into c from public.membership_claims x where x.id = p_id for update;
  if c.id is null or c.status <> 'pending' then
    raise exception 'only a waiting claim' using errcode = 'P0001', hint = 'wrong_stage';
  end if;
  if not p_approve then
    if coalesce(length(btrim(p_note)), 0) < 3 then
      raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
    end if;
    perform private.set_reason('membership claim rejected: ' || left(btrim(p_note), 300));
    update public.membership_claims x set status = 'rejected', note = left(btrim(p_note), 1000),
           decided_by = auth.uid(), decided_at = now() where x.id = p_id;
    insert into public.notifications (user_id, area, title, body, link, channel, template, vars)
    values (c.user_id, 'mship', 'Your membership claim was not approved',
            left(btrim(p_note), 500), '/portal', 'Portal', null, '{}');
    return;
  end if;
  select * into m from public.members x where x.id = coalesce(p_member, c.match_member);
  if m.id is null then
    raise exception 'choose the member' using errcode = 'P0001', hint = 'not_found';
  end if;
  if exists (select 1 from public.company_users cu where cu.user_id = c.user_id) then
    raise exception 'the account already belongs to a company' using errcode = 'P0001', hint = 'linked';
  end if;
  perform private.set_reason('membership claim approved: ' || m.member_no
                             || case when coalesce(btrim(p_note), '') <> '' then ' (' || left(btrim(p_note), 200) || ')' else '' end);
  insert into public.company_users (company_id, user_id, role) values (m.company_id, c.user_id, coalesce(p_role, 'Owner'));
  update public.membership_claims x set status = 'approved', member_id = m.id, role = coalesce(p_role, 'Owner'),
         note = nullif(left(btrim(coalesce(p_note, '')), 1000), ''), decided_by = auth.uid(), decided_at = now()
   where x.id = p_id;
  insert into public.notifications (user_id, area, title, body, link, channel, template, vars)
  values (c.user_id, 'mship', 'Your membership is linked',
          'Your account is now linked to ' || m.member_no || '.', '/portal', 'Portal', null, jsonb_build_object('no', m.member_no));
end $$;

revoke all on function api.signup_finish(text, text) from public, anon;
revoke all on function api.claim_submit(public.member_class, text, text) from public, anon;
revoke all on function api.claim_decide(uuid, boolean, uuid, public.company_role, text) from public, anon;
grant execute on function api.signup_finish(text, text) to authenticated;
grant execute on function api.claim_submit(public.member_class, text, text) to authenticated;
grant execute on function api.claim_decide(uuid, boolean, uuid, public.company_role, text) to authenticated;

-- a person waiting for their existing membership to be linked does not start a new application meanwhile (the claim
-- could not be linked to an account that already owns a new company)
do $$
declare
  def text := pg_get_functiondef('api.app_start()'::regprocedure);
  anchor text := 'perform pg_advisory_xact_lock(hashtextextended(''app_start:'' || v_uid::text, 0));';
begin
  if position(anchor in def) = 0 then raise exception '0680: app_start anchor not found'; end if;
  execute replace(def, anchor, anchor || '
  if exists (select 1 from public.membership_claims c where c.user_id = v_uid and c.status = ''pending'') then
    raise exception ''an existing membership is waiting for approval'' using errcode = ''P0001'', hint = ''claim_pending'';
  end if;');
end $$;
