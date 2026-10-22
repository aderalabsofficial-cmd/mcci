-- 0110 · audit log (append-only) and the row-audit trigger used by every business table (attached in 0240)
-- CLAUDE.md rule 5, docs/09 "Audit". Finding F-12: append-only must be enforced by the database, not by convention.

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,                                  -- auth.uid() of the person, null for jobs
  actor_role text,                               -- database role (authenticated / service_role / postgres)
  user_name text,                                -- 'System' for jobs
  action text not null,                          -- INSERT / UPDATE / DELETE or an api.* action id
  object text,                                   -- table or entity name
  object_id text,
  old_value jsonb,
  new_value jsonb,
  reason text,                                   -- the human "why" (set by api.* functions)
  request_id text,
  ip inet,
  result text not null default 'Success'
);
create index audit_log_at on public.audit_log (at desc);
create index audit_log_object on public.audit_log (object, object_id);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated, service_role;
-- staff read is granted in 0120 once private.staff_level() exists

-- Block UPDATE / DELETE / TRUNCATE for everyone (a superuser can still disable triggers; that is an operating
-- procedure, documented in docs/17 §10).
create function private.audit_log_immutable() returns trigger
  language plpgsql set search_path = ''
  as $$ begin raise exception 'audit_log is append-only' using errcode = '42501'; end $$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function private.audit_log_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.audit_log_immutable();

-- Request context: PostgREST exposes request headers as a GUC; api.* functions set app.reason.
create function private.request_header(name text) returns text
  language sql stable set search_path = ''
  as $$ select nullif(current_setting('request.headers', true), '')::json ->> name $$;

create function private.audit_row() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  -- trigger arguments name columns that must never be copied into the audit log (e.g. token_hash)
  v_strip text[] := coalesce(tg_argv, '{}'::text[]);
  v_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) - v_strip end;
  v_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) - v_strip end;
  v_id  text  := coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'key', v_old ->> 'key');
  v_ip  text  := split_part(coalesce(private.request_header('x-forwarded-for'), ''), ',', 1);
begin
  if tg_op = 'UPDATE' and v_old = v_new then
    return new;                                  -- no-op update, nothing to record
  end if;
  insert into public.audit_log (user_id, actor_role, user_name, action, object, object_id, old_value, new_value, reason, request_id, ip)
  values (
    auth.uid(),
    coalesce(auth.role(), session_user::text),   -- current_user would be the owner inside SECURITY DEFINER
    case when auth.uid() is null then 'System' end,
    tg_op,
    tg_table_name,
    v_id,
    v_old,
    v_new,
    nullif(current_setting('app.reason', true), ''),
    private.request_header('x-request-id'),
    case when v_ip ~ '^[0-9a-fA-F:.]+$' then v_ip::inet end
  );
  return coalesce(new, old);
end $$;
revoke all on function private.audit_row() from public;

-- api.* functions call this to attach the reason to every audit row written in the same transaction.
create function private.set_reason(p_reason text) returns void
  language sql set search_path = ''
  as $$ select set_config('app.reason', coalesce(p_reason, ''), true) $$;
