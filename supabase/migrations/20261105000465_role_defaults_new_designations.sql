-- 0465 · "Reset to defaults" (Staff & Audit, api.role_permissions_reset) restores the limits snapshotted in 0290 as
-- private.role_permission_defaults and deletes every other row. The three designations added in 0430 (Membership
-- Committee Convener, Membership Committee Member, IT Convener) were not in that snapshot, so a reset would have
-- removed all their access (found by the full browser run). Their defaults are the limits 0430 gave them.
insert into private.role_permission_defaults (designation, module, level) values
  ('Membership Committee Convener', 'dash', 1),
  ('Membership Committee Convener', 'mem', 1),
  ('Membership Committee Convener', 'cmt', 3),
  ('Membership Committee Convener', 'reg', 1),
  ('Membership Committee Member', 'dash', 1),
  ('Membership Committee Member', 'mem', 1),
  ('Membership Committee Member', 'cmt', 1),
  ('IT Convener', 'dash', 1),
  ('IT Convener', 'mem', 1),
  ('IT Convener', 'reg', 1),
  ('IT Convener', 'docs', 1),
  ('IT Convener', 'rep', 1),
  ('IT Convener', 'plat', 3)
on conflict (designation, module) do nothing;
