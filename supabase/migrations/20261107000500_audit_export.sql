-- 0500 · Audit Trail export (admin/audit, docs/catalogue "Every action, who and when; export").
--
-- Reading the audit log on screen needs Staff & Audit ≥ 1 (audit_log_select, 0120) — or being the IT Convener, who
-- looks after the platform's security (0430) and is the only one who downloads it, like every other confidential export
-- (owner, 28 Oct 2026; 0460): api.audit_export logs each attempt in file_access_log and returns nothing when refused
-- (an error would roll the log entry back).

drop policy audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log for select to authenticated
  using ((select private.staff_level('staff')) >= 1 or (select private.is_it_convener()));

create function api.audit_export(p_days int default 30, p_q text default null)
  returns table (at timestamptz, user_name text, action text, object text, object_id text, reason text, result text,
                 old_value jsonb, new_value jsonb)
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_q text := nullif(btrim(coalesce(p_q, '')), '');
  v_days int := least(greatest(coalesce(p_days, 30), 1), 3660);
begin
  if auth.uid() is null or not private.is_it_convener() then
    insert into public.file_access_log (user_id, designation, bucket, path, mode, allowed)
    values (auth.uid(), private.my_designation(), 'audit', 'audit_log', 'export', false);
    return;
  end if;
  insert into public.file_access_log (user_id, designation, bucket, path, mode, allowed)
  values (auth.uid(), private.my_designation(), 'audit', 'audit_log', 'export', true);
  return query
    select l.at, l.user_name, l.action, l.object, l.object_id, l.reason, l.result, l.old_value, l.new_value
      from public.audit_log l
     where l.at >= now() - make_interval(days => v_days)
       and (v_q is null or concat_ws(' ', l.user_name, l.action, l.object, l.object_id, l.reason) ilike '%' || v_q || '%')
     order by l.at desc
     limit 50000;
end $$;
revoke all on function api.audit_export(int, text) from public, anon, service_role;
grant execute on function api.audit_export(int, text) to authenticated;
