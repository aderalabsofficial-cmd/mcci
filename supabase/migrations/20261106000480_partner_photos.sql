-- 0480 · A photograph for each partner / director (owner's request, 29 Oct 2026): "photos of partners/directors …
-- should be where partners/directors are being added, and each partner/director's separate photo against their own
-- row", shown on the official form and in the admin panel.
--
-- • application_partners.photo_path: the partner's passport photo in the private application-docs bucket, at
--   <company>/applications/<application>/partners/<partner>/<file>.jpg — the app stores it (lib/membership/actions.ts
--   savePartnerPhoto); the database accepts no other path, so a row can never point at another company's file.
-- • The single document "Photographs of all Partners / Directors" ('pphoto', 0421) is no longer asked for. Files
--   already uploaded under it stay where they are.
-- • private.app_missing: 'partnerPhotos' while a listed partner / director has no photo (lib/flow/application.ts).

alter table public.application_partners
  add column photo_path text check (photo_path is null or length(photo_path) <= 300);
grant update (photo_path) on public.application_partners to authenticated;

create function private.partner_photo_path_ok() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_company uuid;
begin
  if new.photo_path is not null then
    select a.company_id into v_company from public.applications a where a.id = new.application_id;
    if new.photo_path !~ ('^' || v_company::text || '/applications/' || new.application_id::text || '/partners/'
                          || new.id::text || '/[0-9a-f-]{36}\.jpg$') then
      raise exception 'partner photo path not allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.partner_photo_path_ok() from public, anon, authenticated;
create trigger application_partners_photo_path before insert or update of photo_path on public.application_partners
  for each row execute function private.partner_photo_path_ok();

delete from public.document_requirements where key = 'pphoto';

create or replace function private.app_missing(p_app uuid) returns text[]
  language plpgsql stable security definer set search_path = ''
  as $$
declare
  a public.applications;
  f jsonb;
  biz text;
  k text;
  miss text[] := '{}';
  rules jsonb := coalesce((select s.value from private.settings s where s.key = 'membership'), '{}'::jsonb);
  sales_tax boolean;
  aop_reg boolean;
begin
  select * into a from public.applications x where x.id = p_app;
  if a.id is null then
    return array['not_found'];
  end if;
  f := a.form;
  biz := f->>'biz';
  if biz is null or biz not in ('prop', 'aop', 'pvt', 'mnc', 'public', 'llp') then
    miss := miss || 'biz'::text;
    biz := 'prop';
  end if;
  if jsonb_typeof(f->'manufacturing') is distinct from 'boolean' then
    miss := miss || 'category'::text;
  end if;
  if biz = 'aop' and jsonb_typeof(f->'aopRegistered') is distinct from 'boolean' then
    miss := miss || 'aopReg'::text;
  end if;
  if coalesce(f#>>'{nature,sector}', '') = ''
     or (jsonb_typeof(f#>'{nature,items}') is distinct from 'array' or jsonb_array_length(f#>'{nature,items}') = 0)
        and coalesce(btrim(f#>>'{nature,other}'), '') = '' then
    miss := miss || 'nature'::text;
  end if;
  if a.jurisdiction_ok is distinct from true then
    miss := miss || 'juris'::text;
  end if;
  if not coalesce(f->'addrMatch' = 'true'::jsonb, false) then
    miss := miss || 'addr'::text;
  end if;
  foreach k in array array['name', 'address', 'ntn', 'tel', 'email', 'particulars', 'est', 'rep', 'desig', 'cnic', 'mobile',
                           'repEmail', 'repAddress'] loop
    if coalesce(btrim(f->>k), '') = '' or (k = 'est' and (f->>k) !~ '^\d{4}-\d{2}-\d{2}$') then
      miss := miss || ('field:' || k);
    end if;
  end loop;
  sales_tax := coalesce(f->'salesTax' = 'true'::jsonb, false);
  aop_reg := coalesce(f->'aopRegistered' = 'true'::jsonb, false);
  if sales_tax and coalesce(f->>'stWef', '') !~ '^\d{4}-\d{2}-\d{2}$' then
    miss := miss || 'field:stWef'::text;
  end if;
  for k in select r.key from public.document_requirements r
           where r.biz_type = biz::public.biz_type
             and (case r.key when 'st' then sales_tax when 'formc' then aop_reg else r.required end)
           order by r.sort loop
    if not exists (select 1 from public.application_documents d
                   where d.application_id = p_app and d.key = k and d.status <> 'rejected') then
      miss := miss || ('doc:' || k);
    end if;
  end loop;
  if biz <> 'prop' and (select count(*) from public.application_partners p where p.application_id = p_app) < 2 then
    miss := miss || 'partners'::text;
  end if;
  -- every partner / director listed gives an email and an address (owner, 28 Oct 2026)
  if exists (select 1 from public.application_partners p where p.application_id = p_app
             and (coalesce(btrim(p.email), '') = '' or coalesce(btrim(p.address), '') = '')) then
    miss := miss || 'partnerContacts'::text;
  end if;
  -- every partner / director listed has their own photograph (owner, 29 Oct 2026; replaces the 'pphoto' document)
  if exists (select 1 from public.application_partners p where p.application_id = p_app and p.photo_path is null) then
    miss := miss || 'partnerPhotos'::text;
  end if;
  if a.sign_path is null then
    miss := miss || 'sign'::text;
  end if;
  if a.stamp_path is null and (biz <> 'prop' or coalesce(rules->'stampRequiredForProprietor' = 'true'::jsonb, false)) then
    miss := miss || 'stamp'::text;
  end if;
  if not (a.decl1 and a.decl2) then
    miss := miss || 'decl'::text;
  end if;
  return miss;
end $$;
