-- 0620 · WhatsApp connection detail (owner's brief of 2 Nov 2026, docs/30 §9). The connection test now records who the
-- provider says MCCI is, so Settings can show the account and sender it actually checked, and readiness can tell apart
-- connected, sender verified, templates available, consent ready and sending on. Also: the provider's signed webhook
-- test is recorded, and the buttons of a template can be noted beside its wording.

alter table public.whatsapp_health
  add column account_id text,
  add column account_name text,
  add column display_phone text,
  add column waba_id text,
  add column templates_total int,
  add column templates_approved int,
  add column webhook_test_at timestamptz;

drop function api.wa_health_mark(text, jsonb, text);
create function api.wa_health_mark(p_status text, p_steps jsonb, p_error text, p_detail jsonb default '{}'::jsonb) returns void
  language sql volatile security definer set search_path = ''
  as $$
    update public.whatsapp_health set status = p_status, steps = coalesce(p_steps, '[]'::jsonb), checked_at = now(),
      last_ok_at = case when p_status = 'connected' then now() else last_ok_at end,
      last_error = case when p_status = 'connected' then null else left(p_error, 300) end,
      last_auth_failure_at = case when p_status = 'auth_failed' then now() else last_auth_failure_at end,
      account_id = coalesce(p_detail ->> 'accountId', account_id),
      account_name = coalesce(p_detail ->> 'accountName', account_name),
      display_phone = coalesce(p_detail ->> 'displayPhone', display_phone),
      waba_id = coalesce(p_detail ->> 'wabaId', waba_id),
      templates_total = coalesce((p_detail ->> 'templatesTotal')::int, templates_total),
      templates_approved = coalesce((p_detail ->> 'templatesApproved')::int, templates_approved)
     where id
  $$;
revoke all on function api.wa_health_mark(text, jsonb, text, jsonb) from public, anon, authenticated;
grant execute on function api.wa_health_mark(text, jsonb, text, jsonb) to service_role;

-- a signed test delivery from the provider: proves the two sides share the secret; nothing from it is kept
create function api.wa_webhook_test_mark() returns void
  language sql volatile security definer set search_path = ''
  as $$ update public.whatsapp_health set webhook_test_at = now() where id $$;
revoke all on function api.wa_webhook_test_mark() from public, anon, authenticated;
grant execute on function api.wa_webhook_test_mark() to service_role;

-- what Settings needs for readiness and the queue: counts only, no numbers or message text
create function api.wa_readiness() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or (private.staff_level('out') < 1 and private.staff_level('plat') < 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'templatesLocal', (select count(*) from public.whatsapp_templates t where t.status = 'APPROVED'),
    'consented', (select count(*) from (
        select distinct on (c.company_id, c.phone) c.status from public.outreach_consents c
         order by c.company_id, c.phone, c.id desc) x where x.status = 'granted'),
    'submitting', (select count(*) from public.whatsapp_messages m where m.state = 'submitting'),
    'unknown', (select count(*) from public.whatsapp_messages m where m.state = 'unknown'),
    'failed', (select count(*) from public.whatsapp_messages m where m.state = 'failed' and m.direction = 'outbound'),
    'sent24h', (select count(distinct m.phone) from public.whatsapp_messages m
                 where m.direction = 'outbound' and m.created_at > now() - interval '24 hours'
                   and m.state not in ('failed', 'received')),
    'campaignsActive', (select count(*) from public.whatsapp_campaigns c where c.status in ('queued', 'sending', 'scheduled', 'paused')));
end $$;
revoke all on function api.wa_readiness() from public, anon, service_role;
grant execute on function api.wa_readiness() to authenticated;

-- the column has been there since 0580 and nothing filled it: the provider's list does not carry buttons
create function api.wa_template_buttons(p_id uuid, p_buttons text[]) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  if coalesce(array_length(p_buttons, 1), 0) > 10 or exists (select 1 from unnest(p_buttons) b where length(b) > 60) then
    raise exception 'too long' using errcode = '22023';
  end if;
  perform private.set_reason('template buttons recorded');
  update public.whatsapp_templates set buttons = to_jsonb(coalesce(p_buttons, '{}'::text[])), updated_by = auth.uid(), updated_at = now()
   where id = p_id;
end $$;
revoke all on function api.wa_template_buttons(uuid, text[]) from public, anon, service_role;
grant execute on function api.wa_template_buttons(uuid, text[]) to authenticated;

-- inbox search by contact person: contact numbers are closed to direct reads, so only the businesses come back
create function api.wa_contact_companies(p_q text) returns setof uuid
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if private.staff_level('out') < 2 then raise exception 'not allowed' using errcode = '42501'; end if;
  return query select c.company_id from public.outreach_contacts c
    where c.name ilike '%' || replace(replace(replace(p_q, '\', '\'), '%', '\%'), '_', '\_') || '%' limit 50;
end $$;
revoke all on function api.wa_contact_companies(text) from public, anon, service_role;
grant execute on function api.wa_contact_companies(text) to authenticated;
