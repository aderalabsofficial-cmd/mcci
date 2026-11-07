-- 0700 · WhatsApp consent wording that MCCI edits itself (owner, 7 Nov 2026)
--
-- The consent statement members agree to (English and Urdu) moves from the code into settings.whatsapp.consentWording,
-- so MCCI can change ONLY the wording from WhatsApp Settings, without a release. Every consent already records the
-- wording version (0580/0690); a changed wording therefore needs a new version, or old and new consents would carry
-- the same version for different text. An empty language falls back to the built-in text.
-- TODO(MCCI): the first wording below was written for the launch (owner, 7 Nov 2026); MCCI replaces it when ready.

update private.settings
   set value = value || jsonb_build_object(
         'consentWording', jsonb_build_object(
           'en', 'I agree that the Multan Chamber of Commerce & Industry (MCCI) may send WhatsApp messages of the kinds I '
                 || 'ticked above to this number, from MCCI''s official WhatsApp number only. MCCI uses this number only for '
                 || 'its own messages and does not sell or share it for anyone else''s marketing. I can change my choices or '
                 || 'stop at any time on this page, or by replying STOP on WhatsApp.',
           'ur', 'میں اتفاق کرتا/کرتی ہوں کہ ملتان چیمبر آف کامرس اینڈ انڈسٹری (ایم سی سی آئی) صرف اپنے سرکاری واٹس ایپ نمبر سے '
                 || 'اوپر منتخب کردہ اقسام کے پیغامات اس نمبر پر بھیج سکتا ہے۔ ایم سی سی آئی یہ نمبر صرف اپنے پیغامات کے لیے استعمال '
                 || 'کرتا ہے اور اسے کسی اور کی تشہیر کے لیے نہ بیچتا ہے نہ کسی کو دیتا ہے۔ میں کسی بھی وقت اس صفحے پر اپنی پسند '
                 || 'بدل سکتا/سکتی ہوں یا واٹس ایپ پر STOP لکھ کر پیغامات روک سکتا/سکتی ہوں۔'),
         'consentVersion', 'MCCI-2026-11-v1')
 where key = 'whatsapp' and not (value ? 'consentWording');

-- the settings save learns the wording; the rest is unchanged from 0580
create or replace function api.wa_settings_save(p_values jsonb) returns void
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v jsonb;
  v_old jsonb;
  v_en text := btrim(coalesce(p_values ->> 'consentWordingEn', ''));
  v_ur text := btrim(coalesce(p_values ->> 'consentWordingUr', ''));
begin
  if private.staff_level('plat') < 3 then raise exception 'not allowed' using errcode = '42501'; end if;
  if (p_values ->> 'ratePerMinute')::int not between 1 and 250 or (p_values ->> 'maxCampaign')::int not between 1 and 100000
     or (p_values ->> 'approvalThreshold')::int not between 0 and 100000 or jsonb_typeof(p_values -> 'sendingEnabled') <> 'boolean'
     or jsonb_typeof(p_values -> 'consentOpen') <> 'boolean' or length(coalesce(p_values ->> 'consentVersion', '')) not between 1 and 40
     or length(v_en) > 1500 or length(v_ur) > 1500 then
    raise exception 'check the fields' using errcode = 'P0001', hint = 'fields';
  end if;
  select s.value into v_old from private.settings s where s.key = 'whatsapp';
  -- new wording, same version: consents given before and after would claim the same text
  if (coalesce(v_old #>> '{consentWording,en}', '') <> v_en or coalesce(v_old #>> '{consentWording,ur}', '') <> v_ur)
     and coalesce(v_old ->> 'consentVersion', '') = p_values ->> 'consentVersion' then
    raise exception 'wording changed without a new version' using errcode = 'P0001', hint = 'version';
  end if;
  v := v_old || jsonb_build_object('ratePerMinute', (p_values ->> 'ratePerMinute')::int, 'maxCampaign', (p_values ->> 'maxCampaign')::int,
         'approvalThreshold', (p_values ->> 'approvalThreshold')::int, 'sendingEnabled', p_values -> 'sendingEnabled',
         'consentOpen', p_values -> 'consentOpen', 'consentVersion', p_values ->> 'consentVersion',
         'consentWording', jsonb_build_object('en', v_en, 'ur', v_ur));
  perform private.set_reason('WhatsApp settings changed');
  update private.settings set value = v, updated_at = now() where key = 'whatsapp';   -- who and old → new: in the audit log
end $$;

-- what a member (or staff recording consent for one) is shown and agrees to; nothing secret in it
create function api.wa_consent_wording() returns jsonb
  language sql stable security definer set search_path = ''
  as $$
  select jsonb_build_object('version', s.value ->> 'consentVersion',
                            'en', nullif(s.value #>> '{consentWording,en}', ''),
                            'ur', nullif(s.value #>> '{consentWording,ur}', ''))
    from private.settings s where s.key = 'whatsapp'
$$;
revoke all on function api.wa_consent_wording() from public, anon;
grant execute on function api.wa_consent_wording() to authenticated;
