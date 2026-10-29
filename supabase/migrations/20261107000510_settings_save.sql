-- 0510 · Platform Settings (admin/settings): MCCI changes its own rules without a release (CLAUDE.md §1.9 — open
-- decisions live in settings). api.settings_save(key, value) for Platform ≥ 2 with the 2-step login (the same level as
-- the bank account, 0340): only the listed keys and fields, each checked for type and range here; the stored value is
-- merged (fields not sent stay as they are). Every save is audited with its reason (private.settings audit trigger).
--
--   chamber     name, addr, tel, fax, email, web           (printed on the form, vouchers and certificates)
--   fees        Corporate / Associate / Women × admission, subscription, card; extraCard   (whole rupees)
--   sla         processDays, hours
--   voucher     dueDays
--   endorse     days, remindDay, maxPerYear, sameClass, preferSector, needCode
--   membership  releaseNumberOnDecline, certificateLowConfidence, stampRequiredForProprietor, certificateQr {right, top, size}

create function private.setting_int(p jsonb, k text, lo int, hi int) returns jsonb
  language plpgsql immutable set search_path = ''
  as $$
begin
  if jsonb_typeof(p -> k) is distinct from 'number' or (p ->> k)::numeric <> trunc((p ->> k)::numeric)
     or (p ->> k)::numeric < lo or (p ->> k)::numeric > hi then
    raise exception '% must be a whole number from % to %', k, lo, hi using errcode = 'P0001', hint = 'invalid:' || k;
  end if;
  return jsonb_build_object(k, (p ->> k)::int);
end $$;

create function private.setting_num(p jsonb, k text, lo numeric, hi numeric) returns jsonb
  language plpgsql immutable set search_path = ''
  as $$
begin
  if jsonb_typeof(p -> k) is distinct from 'number' or (p ->> k)::numeric < lo or (p ->> k)::numeric > hi then
    raise exception '% must be a number from % to %', k, lo, hi using errcode = 'P0001', hint = 'invalid:' || k;
  end if;
  return jsonb_build_object(k, (p ->> k)::numeric);
end $$;

create function private.setting_bool(p jsonb, k text) returns jsonb
  language plpgsql immutable set search_path = ''
  as $$
begin
  if jsonb_typeof(p -> k) is distinct from 'boolean' then
    raise exception '% must be yes or no', k using errcode = 'P0001', hint = 'invalid:' || k;
  end if;
  return jsonb_build_object(k, (p -> k));
end $$;

create function private.setting_text(p jsonb, k text, max_len int, required boolean) returns jsonb
  language plpgsql immutable set search_path = ''
  as $$
declare
  v text;
begin
  if jsonb_typeof(p -> k) is distinct from 'string' then
    raise exception '% must be text', k using errcode = 'P0001', hint = 'invalid:' || k;
  end if;
  v := btrim(p ->> k);
  if length(v) > max_len or (required and v = '') then
    raise exception '% is required (up to % characters)', k, max_len using errcode = 'P0001', hint = 'invalid:' || k;
  end if;
  return jsonb_build_object(k, v);
end $$;

create function api.settings_save(p_key text, p_value jsonb, p_reason text default null) returns jsonb
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v jsonb := '{}'::jsonb;
  f text;
  c text;
begin
  if auth.uid() is null or private.staff_level('plat') < 2 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_value) is distinct from 'object' then
    raise exception 'settings must be an object' using errcode = 'P0001', hint = 'invalid';
  end if;
  case p_key
    when 'chamber' then
      v := private.setting_text(p_value, 'name', 160, true) || private.setting_text(p_value, 'addr', 300, true)
        || private.setting_text(p_value, 'tel', 120, false) || private.setting_text(p_value, 'fax', 120, false)
        || private.setting_text(p_value, 'email', 160, true) || private.setting_text(p_value, 'web', 160, false);
      if v ->> 'email' !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        raise exception 'email address' using errcode = 'P0001', hint = 'invalid:email';
      end if;
    when 'fees' then
      foreach c in array array['Corporate', 'Associate', 'Women'] loop
        if jsonb_typeof(p_value -> c) is distinct from 'object' then
          raise exception '% fees are missing', c using errcode = 'P0001', hint = 'invalid:' || c;
        end if;
        v := v || jsonb_build_object(c,
          private.setting_int(p_value -> c, 'admission', 0, 10000000)
          || private.setting_int(p_value -> c, 'subscription', 0, 10000000)
          || private.setting_int(p_value -> c, 'card', 0, 10000000));
      end loop;
      v := v || private.setting_int(p_value, 'extraCard', 0, 10000000);
    when 'sla' then
      v := private.setting_int(p_value, 'processDays', 1, 90) || private.setting_int(p_value, 'hours', 1, 168);
    when 'voucher' then
      v := private.setting_int(p_value, 'dueDays', 1, 60);
    when 'endorse' then
      v := private.setting_int(p_value, 'days', 1, 60) || private.setting_int(p_value, 'remindDay', 1, 60)
        || private.setting_int(p_value, 'maxPerYear', 1, 100) || private.setting_bool(p_value, 'sameClass')
        || private.setting_bool(p_value, 'preferSector') || private.setting_bool(p_value, 'needCode');
      if (v ->> 'remindDay')::int >= (v ->> 'days')::int then
        raise exception 'the reminder comes before the last day' using errcode = 'P0001', hint = 'invalid:remindDay';
      end if;
    when 'membership' then
      v := private.setting_bool(p_value, 'releaseNumberOnDecline')
        || private.setting_int(p_value, 'certificateLowConfidence', 0, 100)
        || private.setting_bool(p_value, 'stampRequiredForProprietor');
      if p_value ? 'certificateQr' then
        v := v || jsonb_build_object('certificateQr',
          private.setting_num(p_value -> 'certificateQr', 'right', 0.5, 0.99)
          || private.setting_num(p_value -> 'certificateQr', 'top', 0.01, 0.5)
          || private.setting_num(p_value -> 'certificateQr', 'size', 0.02, 0.2));
      end if;
    else
      raise exception 'this setting cannot be changed here' using errcode = 'P0001', hint = 'invalid_key';
  end case;
  -- fields outside the list are never stored
  for f in select jsonb_object_keys(p_value) loop
    if not v ? f then
      raise exception 'unknown field %', f using errcode = 'P0001', hint = 'invalid:' || f;
    end if;
  end loop;
  perform private.set_reason(coalesce(nullif(left(btrim(coalesce(p_reason, '')), 300), ''), 'settings changed: ' || p_key));
  update private.settings s set value = s.value || v where s.key = p_key;
  if not found then
    insert into private.settings (key, value) values (p_key, v);
  end if;
  return (select s.value from private.settings s where s.key = p_key);
end $$;

revoke all on function private.setting_int(jsonb, text, int, int), private.setting_num(jsonb, text, numeric, numeric),
  private.setting_bool(jsonb, text), private.setting_text(jsonb, text, int, boolean) from public, anon, authenticated;
revoke all on function api.settings_save(text, jsonb, text) from public, anon, service_role;
grant execute on function api.settings_save(text, jsonb, text) to authenticated;

-- the Settings screen reads the editable keys (Platform ≥ 1); the full set (with the bank account) stays server-only
create function api.settings_editable() returns jsonb
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if auth.uid() is null or private.staff_level('plat') < 1 then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_object_agg(s.key, s.value), '{}'::jsonb) from private.settings s
           where s.key in ('chamber', 'fees', 'sla', 'voucher', 'endorse', 'membership'));
end $$;
revoke all on function api.settings_editable() from public, anon, service_role;
grant execute on function api.settings_editable() to authenticated;
