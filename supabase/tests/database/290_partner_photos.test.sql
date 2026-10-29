-- A photograph for each partner / director (migration 0480): stored only under that partner's own folder; required
-- before submission for every listed partner; the old single "photos of all partners" document is gone.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(7);

update public.applications set stage = 'draft' where id = tests.id('app_a_review');
delete from public.application_partners where application_id = tests.id('app_a_review');
insert into public.application_partners (id, application_id, position, name, email, address) values
  ('9a000000-0000-0000-0000-000000000001', tests.id('app_a_review'), 1, 'Partner One', 'one@test.local', 'Multan');
create temp table t_ok on commit drop as
  select a.company_id || '/applications/' || a.id || '/partners/9a000000-0000-0000-0000-000000000001/'
         || gen_random_uuid() || '.jpg' as p
    from public.applications a where a.id = tests.id('app_a_review');
grant select on t_ok to authenticated;

select ok('partnerPhotos' = any (private.app_missing(tests.id('app_a_review'))), 'a partner without a photo is missing');
select lives_ok(
  $$ select tests.exec_as(tests.id('owner_a'), 'update public.application_partners set photo_path = (select p from t_ok) where id = ''9a000000-0000-0000-0000-000000000001''') $$,
  'the applicant sets the photo stored in that partner''s folder');
select ok(not ('partnerPhotos' = any (private.app_missing(tests.id('app_a_review')))), 'then nothing is missing for it');
select throws_ok(
  $$ select tests.exec_as(tests.id('owner_a'), 'update public.application_partners set photo_path = ''b0000000-0000-0000-0000-00000000000b/applications/x/photo.jpg'' where id = ''9a000000-0000-0000-0000-000000000001''') $$,
  '42501', null, 'never a path of another company');
select throws_ok(
  $$ select tests.exec_as(tests.id('owner_a'), 'update public.application_partners set photo_path = replace((select p from t_ok), ''/partners/9a000000-0000-0000-0000-000000000001/'', ''/sign/'') where id = ''9a000000-0000-0000-0000-000000000001''') $$,
  '42501', null, 'nor another file of the same application');
select is(tests.num_as(tests.id('owner_b'), $$select count(*) from public.application_partners where id = '9a000000-0000-0000-0000-000000000001' and photo_path is not null$$), 0::bigint,
  'another company does not see it');
select is((select count(*) from public.document_requirements where key = 'pphoto'), 0::bigint,
  'the single "photos of all partners / directors" document is no longer asked for');

select * from finish();
rollback;
