-- 0610 · Owner's list of 1 Nov 2026 (docs/31): media on news, notices, circulars and events; a designation the Secretary
-- General adds; a person's own limits; a named officer per service; WhatsApp's daily limit and more voice formats.

-- ───────── media on posts and events ─────────
-- site-media is public on purpose: it only ever holds what MCCI publishes. Uploads go through a checked staff route.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site-media', 'site-media', true, 10485760, array['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
on conflict (id) do nothing;

create table public.content_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts on delete cascade,
  event_id uuid references public.events on delete cascade,
  kind text not null check (kind in ('image', 'video', 'file')),
  path text not null unique,
  file_name text not null,
  mime text not null,
  bytes int not null,
  caption text check (caption is null or length(caption) <= 300),
  sort int not null default 0,
  uploaded_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (event_id is null))
);
create index content_media_post on public.content_media (post_id, sort);
create index content_media_event on public.content_media (event_id, sort);
alter table public.content_media enable row level security;
grant select on public.content_media to anon, authenticated;
create policy content_media_select on public.content_media for select to anon, authenticated
  using ((post_id is not null and exists (select 1 from public.posts p where p.id = post_id and p.status = 'Live'))
         or event_id is not null
         or (select private.staff_level('eng')) >= 1);
create trigger audit_row after insert or update or delete on public.content_media
  for each row execute function private.audit_row();

create function api.content_media_remove(p_id uuid) returns text
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_path text;
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('media removed');
  delete from public.content_media where id = p_id returning path into v_path;
  return v_path;
end $$;

create function api.content_media_caption(p_id uuid, p_caption text, p_sort int) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('eng') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.set_reason('media changed');
  update public.content_media set caption = nullif(left(btrim(coalesce(p_caption, '')), 300), ''), sort = coalesce(p_sort, sort) where id = p_id;
end $$;

-- ───────── designations and a person's own limits ─────────
-- Each needs the person's password again first, used up by the change, as limits do (0400).
create function api.designation_add(p_name text, p_seniority smallint, p_copy_from text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare v_name text := btrim(coalesce(p_name, ''));
begin
  if auth.uid() is null or private.staff_level('staff') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if length(v_name) not between 2 and 80 or p_seniority is null or p_seniority not between 1 and 4 then
    raise exception 'fields' using errcode = 'P0001', hint = 'fields';
  end if;
  if exists (select 1 from public.designations d where lower(d.name) = lower(v_name)) then
    raise exception 'exists' using errcode = 'P0001', hint = 'exists';
  end if;
  if p_copy_from = 'Secretary General' then
    raise exception 'not from the Secretary General' using errcode = 'P0001', hint = 'sg_fixed';
  end if;
  perform private.reauth_take();
  perform private.set_reason('designation added');
  insert into public.designations (name, seniority) values (v_name, p_seniority);
  insert into public.role_permissions (designation, module, level)
  select v_name, r.module, r.level from public.role_permissions r where r.designation = p_copy_from;
  insert into private.role_permission_defaults (designation, module, level)
  select v_name, r.module, r.level from public.role_permissions r where r.designation = p_copy_from
  on conflict do nothing;
end $$;

create function api.staff_override_set(p_user uuid, p_module text, p_level smallint, p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('staff') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.staff s where s.user_id = p_user) then
    raise exception 'staff' using errcode = 'P0001', hint = 'not_found';
  end if;
  if exists (select 1 from public.staff s where s.user_id = p_user and s.designation = 'Secretary General') then
    raise exception 'Secretary General keeps full control' using errcode = 'P0001', hint = 'sg_fixed';
  end if;
  if p_module is null or p_module not in ('dash','mem','cmt','temp','reg','svc','docs','pay','eng','rep','staff','plat','biz','out','fin','vot','chg') then
    raise exception 'module' using errcode = 'P0001', hint = 'module';
  end if;
  if p_level is not null and p_level not between 0 and 3 then
    raise exception 'level' using errcode = 'P0001', hint = 'level';
  end if;
  if coalesce(length(btrim(p_reason)), 0) < 3 then
    raise exception 'a reason is required' using errcode = 'P0001', hint = 'reason_required';
  end if;
  perform private.reauth_take();
  perform private.set_reason('personal limit: ' || left(btrim(p_reason), 400));
  if p_level is null then
    delete from public.staff_permission_overrides where user_id = p_user and module = p_module;
  else
    insert into public.staff_permission_overrides (user_id, module, level, reason, set_by, set_at)
    values (p_user, p_module, p_level, btrim(p_reason), auth.uid(), now())
    on conflict (user_id, module) do update set level = excluded.level, reason = excluded.reason, set_by = auth.uid(), set_at = now();
  end if;
end $$;

-- ───────── a named officer per service ─────────
-- A service with no one named stays open to everyone with Service requests access. With someone named, only they and
-- Approve-level staff can move its requests. Enforced on the row, so every path through the functions is covered.
create table public.service_assignees (
  service_key text not null references public.service_types on delete cascade on update cascade,
  user_id uuid not null references public.staff on delete cascade,
  set_by uuid default auth.uid() references public.profiles on delete set null,
  set_at timestamptz not null default now(),
  primary key (service_key, user_id)
);
alter table public.service_assignees enable row level security;
grant select on public.service_assignees to authenticated;
create policy service_assignees_select on public.service_assignees for select to authenticated
  using ((select private.staff_level('svc')) >= 1 or (select private.staff_level('staff')) >= 1);
create trigger audit_row after insert or update or delete on public.service_assignees
  for each row execute function private.audit_row();

create function private.svc_assigned_guard() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if new.status is distinct from old.status and auth.uid() is not null
     and private.staff_level('svc') between 1 and 2
     and exists (select 1 from public.service_assignees a where a.service_key = old.service_key)
     and not exists (select 1 from public.service_assignees a where a.service_key = old.service_key and a.user_id = auth.uid()) then
    raise exception 'this service is assigned to someone else' using errcode = 'P0001', hint = 'assigned_other';
  end if;
  return new;
end $$;
revoke all on function private.svc_assigned_guard() from public, anon, authenticated, service_role;
create trigger svc_assigned_guard before update on public.service_requests
  for each row execute function private.svc_assigned_guard();

create function api.service_assignees_set(p_service text, p_users uuid[], p_reason text) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('staff') < 3 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.service_types t where t.key = p_service) then
    raise exception 'service' using errcode = 'P0001', hint = 'not_found';
  end if;
  if exists (select 1 from unnest(coalesce(p_users, '{}'::uuid[])) u
              where not exists (select 1 from public.staff s where s.user_id = u and s.active)) then
    raise exception 'staff' using errcode = 'P0001', hint = 'not_found';
  end if;
  perform private.reauth_take();
  perform private.set_reason('service officers: ' || left(coalesce(nullif(btrim(p_reason), ''), p_service), 400));
  delete from public.service_assignees a where a.service_key = p_service and not (a.user_id = any (coalesce(p_users, '{}'::uuid[])));
  insert into public.service_assignees (service_key, user_id)
  select p_service, u from unnest(coalesce(p_users, '{}'::uuid[])) u on conflict do nothing;
end $$;

-- ───────── WhatsApp ─────────
-- Meta's own limit for the account (MCCI's number: 250 customers in 24 hours). Stored, shown and respected, so a
-- campaign waits for the next day instead of failing at Meta. Raise it here when Meta raises the tier.
update private.settings set value = value || '{"dailyLimit":250}'::jsonb where key = 'whatsapp' and not (value ? 'dailyLimit');

update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','application/pdf','video/mp4','audio/mpeg','audio/ogg','audio/mp4','audio/aac','audio/amr']
 where id = 'whatsapp-media';

do $$
begin
  execute replace(pg_get_functiondef('api.wa_claim(int)'::regprocedure),
    'if v_room <= 0 then return v_out; end if;',
    'v_room := least(v_room, coalesce(private.wa_setting(''dailyLimit'')::int, 250)
                  - (select count(distinct x.phone)::int from public.whatsapp_messages x
                      where x.direction = ''outbound'' and x.created_at > now() - interval ''24 hours''
                        and x.state not in (''failed'', ''received'')));
  if v_room <= 0 then return v_out; end if;');
  execute replace(replace(pg_get_functiondef('api.wa_settings_save(jsonb)'::regprocedure),
    'if (p_values ->> ''ratePerMinute'')::int not between 1 and 250 or',
    'if coalesce((p_values ->> ''dailyLimit'')::int, 0) not between 1 and 1000000 or (p_values ->> ''ratePerMinute'')::int not between 1 and 250 or'),
    'jsonb_build_object(''ratePerMinute'', (p_values ->> ''ratePerMinute'')::int,',
    'jsonb_build_object(''dailyLimit'', (p_values ->> ''dailyLimit'')::int, ''ratePerMinute'', (p_values ->> ''ratePerMinute'')::int,');
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'api.content_media_remove(uuid)', 'api.content_media_caption(uuid,text,int)',
    'api.designation_add(text,smallint,text)', 'api.staff_override_set(uuid,text,smallint,text)',
    'api.service_assignees_set(text,uuid[],text)'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
