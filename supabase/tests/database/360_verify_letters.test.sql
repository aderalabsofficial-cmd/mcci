-- Issued letters verify publicly like certificates; vouchers, forms and receipts do not (0560).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(4);

create temp table _d on commit drop as select code from public.documents where id = tests.id('cert_b');

update public.documents set kind = 'letter' where id = tests.id('cert_b');
select is((select count(*) from api.public_verify_code((select code from _d), 'code', 'test')), 1::bigint, 'an issued letter verifies');
select is((select certificate_ref from api.public_verify_code((select code from _d), 'code', 'test')), (select code from _d), 'under its own reference');

update public.documents set kind = 'receipt' where id = tests.id('cert_b');
select is((select count(*) from api.public_verify_code((select code from _d), 'code', 'test')), 0::bigint, 'a receipt does not');
update public.documents set kind = 'voucher' where id = tests.id('cert_b');
select is((select count(*) from api.public_verify_code((select code from _d), 'code', 'test')), 0::bigint, 'a voucher does not');

select * from finish();
rollback;
