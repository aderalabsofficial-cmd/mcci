-- 0260 · Realtime postgres_changes for the live updates in docs/01 §Live updates (docs/17 §4a)
--
-- Realtime (realtime.apply_rls) checks RLS per subscriber for INSERT/UPDATE and builds each payload only from the
-- columns the subscriber's role may SELECT (has_column_privilege). DELETE events are NOT RLS-checked: they go to every
-- subscriber of the table with old_record reduced to the primary key. Therefore:
--   * publish only tables whose client-readable columns are all safe to push to every row-authorised reader;
--   * hide sensitive columns with column-level grants (they are then absent from REST and from Realtime payloads);
--   * clients must hold no DELETE privilege on a published table (checked in 090_realtime_publication.test.sql).

-- 1. endorsements: the signing evidence ip and user_agent (docs/04 "Evidence & integrity") is stored for audit, not
--    for display. Before this migration the applicant company could read it (REST) and would have received it in
--    live events. Narrow the client grant to the other columns; evidence stays readable by the table owner and by
--    future server-side api.* functions only. This only removes access; it grants nothing new.
revoke select on public.endorsements from authenticated;
grant select (
  id, application_id, role, endorser_member_id, status, message, requested_at, expires_at, reminders,
  last_reminded_at, decided_at, decided_by, decline_reason, declaration_text, signature_path, otp_verified_at,
  doc_hash, ref
) on public.endorsements to authenticated;

-- 2. the five tables named in docs/01 (payments = payment_vouchers, docs/16 A6) — nothing else
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table
  public.notifications,
  public.applications,
  public.endorsements,
  public.service_requests,
  public.payment_vouchers;
