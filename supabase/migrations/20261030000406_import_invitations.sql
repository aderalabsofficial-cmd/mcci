-- 0406 · Invitations for imported members (owner's request, 26 Oct 2026: "if we upload the existing members sheet,
-- all members should receive an email invitation").
--
-- After a committed import, every member it created or updated is invited by email as the Owner of their company
-- (to the email in the sheet), exactly as "Add member" does — unless the company already has someone signed in or a
-- live invitation, or the sheet has no email for it. The app sends them in small batches (api.import_invite_next,
-- then api.import_invite_mark per email), so a large sheet never runs into the request time limit, and a batch cut
-- off half-way is picked up again ("sending" for more than 10 minutes counts as not sent). Import invitations are
-- valid for 30 days (existing members may take longer than a new applicant).
-- Who: reg ≥ 2 (as the import itself), 2-step session. The invitation rows are audited (0240 triggers).

alter table public.import_rows
  add column invite_status text check (invite_status in ('sending', 'sent', 'failed', 'no_email', 'has_account')),
  add column invited_at timestamptz,
  add column invitation_id uuid references public.invitations on delete set null;

-- a usable address or null (private.normal_email raises on a bad one; a sheet may simply have none)
create function private.email_or_null(p_email text) returns extensions.citext
  language sql immutable set search_path = ''
  as $$
    select case when length(btrim(p_email)) <= 254 and btrim(p_email) ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
                then lower(btrim(p_email))::extensions.citext end
  $$;
revoke all on function private.email_or_null(text) from public, anon, authenticated, service_role;

-- the member a committed row stands for: the one it created, or (for "update") the one with its number
create function private.import_row_member(p_row public.import_rows) returns uuid
  language sql stable security definer set search_path = ''
  as $$
    select coalesce(p_row.created_member,
                    case when p_row.result = 'updated'
                         then (select m.id from public.members m where m.member_no = p_row.data ->> 'membership_no') end)
  $$;
revoke all on function private.import_row_member(public.import_rows) from public, anon, authenticated, service_role;

-- the next batch: creates the invitations (p_retry: also those whose email failed — only when someone asks again,
-- so an address that keeps failing does not loop) and returns their one-time tokens (only here; the database keeps hashes)
create function api.import_invite_next(p_import uuid, p_limit int default 10, p_retry boolean default false)
  returns table (row_no int, email text, full_name text, company text, token text)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  x public.import_rows;
  v_member uuid;
  v_company uuid;
  v_name text;
  v_rep text;
  v_email extensions.citext;
  v_token text;
  v_inv uuid;
  n int := 0;
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if (select i.status from public.imports i where i.id = p_import for update) is distinct from 'committed' then
    raise exception 'only a committed import sends invitations' using errcode = 'P0001', hint = 'closed';
  end if;
  perform private.set_reason('imported member invited');
  for x in select * from public.import_rows r
            where r.import_id = p_import and r.result in ('created', 'updated')
              and (r.invite_status is null or (p_retry and r.invite_status = 'failed')
                   or (r.invite_status = 'sending' and r.invited_at < now() - interval '10 minutes'))
            order by r.row_no
            for update skip locked loop
    exit when n >= greatest(1, least(coalesce(p_limit, 10), 25));
    v_member := private.import_row_member(x);
    select m.company_id, m.rep_name, c.name, coalesce(private.email_or_null(x.data ->> 'email'), private.email_or_null(c.email::text))
      into v_company, v_rep, v_name, v_email
      from public.members m join public.companies c on c.id = m.company_id where m.id = v_member;
    -- a retry: the earlier invitation from this row is replaced (its token was never seen again)
    if x.invitation_id is not null then
      update public.invitations i set status = 'Revoked', revoked_by = auth.uid()
       where i.id = x.invitation_id and i.status = 'Invited';
    end if;
    if v_company is null or v_email is null then
      update public.import_rows r set invite_status = 'no_email', invited_at = now()
       where r.import_id = p_import and r.row_no = x.row_no;
      continue;
    end if;
    if exists (select 1 from public.company_users cu where cu.company_id = v_company)
       or exists (select 1 from public.invitations i where i.company_id = v_company and i.status = 'Invited'
                  and i.expires_at > now() and i.id is distinct from x.invitation_id) then
      update public.import_rows r set invite_status = 'has_account', invited_at = now()
       where r.import_id = p_import and r.row_no = x.row_no;
      continue;
    end if;
    v_token := private.invite_token();
    insert into public.invitations (kind, email, full_name, company_id, company_role, token_hash, invited_by, expires_at)
    values ('company_user', v_email, nullif(btrim(v_rep), ''), v_company, 'Owner', private.invite_hash(v_token), auth.uid(),
            now() + interval '30 days')
    returning id into v_inv;
    update public.import_rows r set invite_status = 'sending', invited_at = now(), invitation_id = v_inv
     where r.import_id = p_import and r.row_no = x.row_no;
    n := n + 1;
    row_no := x.row_no;
    email := v_email::text;
    full_name := v_rep;
    company := v_name;
    token := v_token;
    return next;
  end loop;
end $$;

-- the outcome of one email
create function api.import_invite_mark(p_import uuid, p_row int, p_ok boolean) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('reg') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.import_rows r set invite_status = case when p_ok then 'sent' else 'failed' end
   where r.import_id = p_import and r.row_no = p_row and r.invite_status = 'sending';
end $$;

do $$
declare f text;
begin
  foreach f in array array['api.import_invite_next(uuid,int,boolean)', 'api.import_invite_mark(uuid,int,boolean)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
