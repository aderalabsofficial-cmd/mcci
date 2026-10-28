-- 0421 · Application form, owner's list of 28 Oct 2026 (docs/21 points 5–20).
--
-- • Main category first: applications.form.manufacturing is now a required choice (Manufacturing / Non-manufacturing),
--   not a tick box. LLP is the sixth business type (0420) and, as every body corporate registered with SECP, is a
--   Corporate member directly. A Partnership / AOP says whether it is registered (form.aopRegistered): Form C is asked
--   only from a registered AOP.
-- • Sales tax: only the registration certificate with its "with effect from" date (form.stWef), and only from a
--   sales-tax-registered applicant — no sales tax return.
-- • The authorized representative gives an email and address (form.repEmail, form.repAddress); every partner /
--   director an email and address (application_partners.email, address). Photos of all partners / directors are a
--   document of their own (key 'pphoto').
-- • private.class_of and private.app_missing follow the same rules as lib/flow/application.ts (classOf, missing).
--   Nothing here blocks on blacklisting or the ATL: it is never checked at submission (docs/21 point 13).

-- ───────── partners / directors: email and address ─────────
alter table public.application_partners
  add column email text check (email is null or length(email) <= 254),
  add column address text check (address is null or length(address) <= 400);
grant insert (email, address) on public.application_partners to authenticated;
grant update (email, address) on public.application_partners to authenticated;

-- ───────── documents ─────────
update public.document_requirements
   set label_en = 'A copy of Sales Tax Registration Certificate, if registered (with its "with effect from" date) — no sales tax return is needed',
       short_en = 'Sales Tax Registration Certificate'
 where key = 'st';
update public.document_requirements set short_en = 'Bank Maintenance Certificate' where key = 'bank';
update public.document_requirements
   set label_en = 'An attested copy of the Partnership Deed (registered with the Registrar of Firms, Multan, for a registered firm)'
 where biz_type = 'aop' and key = 'deed';
-- Form C: asked (and then required) only from a registered AOP — private.app_missing / applicableDocs
update public.document_requirements set required = false where biz_type = 'aop' and key = 'formc';
update public.document_requirements set label_en = 'Copies of CNICs / Passports of all Directors'
 where key = 'cnic' and biz_type in ('pvt', 'mnc', 'public');
update public.document_requirements set label_en = 'Copies of CNICs / Passports of all Partners'
 where key = 'cnic' and biz_type = 'aop';

insert into public.document_requirements (biz_type, key, label_en, short_en, required, sort) values
  ('aop', 'pphoto', 'Photographs of all Partners (latest + coloured)', 'Photos of partners', true, 11),
  ('pvt', 'pphoto', 'Photographs of all Directors (latest + coloured)', 'Photos of directors', true, 12),
  ('mnc', 'pphoto', 'Photographs of all Directors (latest + coloured)', 'Photos of directors', true, 12),
  ('public', 'pphoto', 'Photographs of all Directors (latest + coloured)', 'Photos of directors', true, 12),
  ('llp', 'cnic', 'Copies of CNICs / Passports of all Partners', 'CNIC / Passport', true, 1),
  ('llp', 'ntn', 'A copy of National Tax Number (NTN) certificate on the name of the LLP', 'NTN certificate', true, 2),
  ('llp', 'itr', 'Latest Income Tax Return where applicable on the name of the LLP', 'Income tax return', false, 3),
  ('llp', 'st', 'A copy of Sales Tax Registration Certificate, if registered (with its "with effect from" date) — no sales tax return is needed', 'Sales Tax Registration Certificate', false, 4),
  ('llp', 'inc', 'Copy of Certificate of Incorporation of the LLP by SECP', 'Certificate of Incorporation', true, 5),
  ('llp', 'llpa', 'A copy of the LLP Agreement filed with SECP', 'LLP agreement', true, 6),
  ('llp', 'addr', 'Proof of business addresses (copy of lease deed / allotment letter of the building / office)', 'Address proof', true, 7),
  ('llp', 'bank', 'Original Bank Account Maintenance Certificate on the name of business', 'Bank Maintenance Certificate', true, 8),
  ('llp', 'auth', 'An Authority Letter on Letterhead by the Designated Partners nominating one of the Partners as authorized representative in Multan Chamber of Commerce & Industry', 'Authority letter', true, 9),
  ('llp', 'photo', 'Three photographs of authorized representative (latest + coloured)', 'Passport photo', true, 10),
  ('llp', 'pphoto', 'Photographs of all Partners (latest + coloured)', 'Photos of partners', true, 11)
on conflict (biz_type, key) do nothing;

-- ───────── rules ─────────

-- Corporate vs Associate (lib/flow/application.ts classOf): a body corporate registered with SECP is Corporate; a
-- proprietorship / AOP is Corporate when sales-tax registered and manufacturing, or sales-tax registered with
-- turnover of Rs 50 million or more; otherwise Associate.
create or replace function private.class_of(p_form jsonb) returns public.member_class
  language sql immutable set search_path = ''
  as $$
    select (case
      when p_form->>'biz' in ('pvt', 'public', 'mnc', 'llp') then 'Corporate'
      when coalesce(p_form->'manufacturing' = 'true'::jsonb, false) and coalesce(p_form->'salesTax' = 'true'::jsonb, false) then 'Corporate'
      when coalesce(p_form->'salesTax' = 'true'::jsonb, false) and coalesce(p_form->'turnover50' = 'true'::jsonb, false) then 'Corporate'
      else 'Associate' end)::public.member_class
  $$;

-- What still blocks submission (codes as lib/flow/application.ts missing(), same order):
-- biz, category, aopReg, nature, juris, addr, field:<key>, field:stWef, doc:<key>, partners, sign, stamp, decl.
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
revoke all on function private.app_missing(uuid) from public;
