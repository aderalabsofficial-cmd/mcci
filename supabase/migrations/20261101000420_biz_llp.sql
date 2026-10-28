-- 0420 · LLP becomes a business type (owner's list of 28 Oct 2026, docs/21 point 7): the sixth card of the
-- application, in place of "Manufacturing Concern" (which is now the main category). A new enum value cannot be
-- used in the transaction that adds it, so the rows and rules that use it are in the next migration (0421).
alter type public.biz_type add value if not exists 'llp' after 'public';
