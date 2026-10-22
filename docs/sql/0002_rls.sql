-- 0002_rls.sql — row-level security. Every table has RLS on; default deny.
-- Helper functions are SECURITY DEFINER and STABLE so policies stay fast.

create or replace function is_staff() returns boolean language sql stable security definer as $$
  select exists (select 1 from staff s where s.user_id = auth.uid() and s.active)
$$;

-- level of the current staff user on a module (override > designation default)
create or replace function staff_level(mod text) returns smallint language sql stable security definer as $$
  select coalesce(
    (select o.level from staff_permission_overrides o where o.user_id = auth.uid() and o.module = mod),
    (select rp.level from staff s join role_permissions rp on rp.designation = s.designation and rp.module = mod
      where s.user_id = auth.uid() and s.active), 0)::smallint
$$;

create or replace function my_company_ids() returns setof uuid language sql stable security definer as $$
  select company_id from company_users where user_id = auth.uid() and status = 'Active'
$$;

create or replace function my_company_role(cid uuid) returns company_role language sql stable security definer as $$
  select role from company_users where user_id = auth.uid() and company_id = cid and status = 'Active'
$$;

-- member records belonging to my companies (I am that member when I am asked to endorse)
create or replace function my_member_ids() returns setof uuid language sql stable security definer as $$
  select m.id from members m where m.company_id in (select my_company_ids())
$$;

do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- profiles
create policy "own profile" on profiles for select using (id = auth.uid() or is_staff());
create policy "update own profile" on profiles for update using (id = auth.uid());

-- companies / members
create policy "my companies" on companies for select using (id in (select my_company_ids()) or staff_level('reg') >= 1 or staff_level('mem') >= 1);
create policy "staff edit companies" on companies for update using (staff_level('reg') >= 2);
create policy "members: signed-in read" on members for select using (auth.role() = 'authenticated');  -- needed for endorser search; anonymous users use public_directory
create policy "staff edit members" on members for all using (staff_level('reg') >= 2) with check (staff_level('reg') >= 2);

-- Public directory: NEVER select members directly from the client for public pages; use this view.
create or replace view public_directory as
  select m.member_no, c.name as company, m.class, c.sector, m.status, m.valid_to
  from members m join companies c on c.id = m.company_id
  where m.public_listing and m.status in ('Permanent','Temporary');

-- helpers that bypass RLS to avoid policy recursion between applications and endorsements
create or replace function my_app_ids() returns setof uuid language sql stable security definer as $$
  select id from applications where company_id in (select my_company_ids())
$$;
create or replace function apps_i_endorse() returns setof uuid language sql stable security definer as $$
  select application_id from endorsements where endorser_member_id in (select my_member_ids())
$$;

-- applications & children: owner company or staff with mem ≥ view
create policy "app read" on applications for select using (company_id in (select my_company_ids()) or staff_level('mem') >= 1
  or id in (select apps_i_endorse()));  -- endorsers may read the application row (summary + form snapshot), never its documents
create policy "app write by applicant while draft/returned" on applications for update
  using (company_id in (select my_company_ids()) and stage in ('draft','returned') and my_company_role(company_id) in ('Owner','Manager'));
create policy "app insert" on applications for insert with check (created_by = auth.uid());
create policy "app staff write" on applications for update using (staff_level('mem') >= 2);

create policy "docs read" on application_documents for select using (
  application_id in (select my_app_ids()) or staff_level('mem') >= 1);
-- NOTE: endorsers can NOT read application_documents (CNICs, bank certificates stay private).
create policy "docs write" on application_documents for all using (
  application_id in (select id from applications where company_id in (select my_company_ids()) and stage in ('draft','returned')) or staff_level('mem') >= 2);

create policy "partners" on application_partners for all using (
  application_id in (select my_app_ids()) or staff_level('mem') >= 1);
create policy "history read" on application_history for select using (
  application_id in (select my_app_ids()) or staff_level('mem') >= 1);

-- endorsements
create policy "endorse read" on endorsements for select using (
  endorser_member_id in (select my_member_ids())
  or application_id in (select my_app_ids())
  or staff_level('mem') >= 1);
-- all writes go through server actions using the service role after explicit checks (lib/endorse/*);
-- no direct client insert/update policy on endorsements.

-- payments
create policy "voucher read" on payment_vouchers for select using (company_id in (select my_company_ids()) or staff_level('pay') >= 1);
create policy "voucher receipt upload" on payment_vouchers for update using (
  company_id in (select my_company_ids()) and my_company_role(company_id) in ('Owner','Manager','Accounts') and status in ('Unpaid','Rejected'));
create policy "voucher staff" on payment_vouchers for all using (staff_level('pay') >= 2);

-- temporary / printing / documents
create policy "temp read" on temp_memberships for select using (member_id in (select my_member_ids()) or staff_level('temp') >= 1);
create policy "temp staff" on temp_memberships for all using (staff_level('temp') >= 2);
create policy "print read" on print_items for select using (member_id in (select my_member_ids()) or staff_level('temp') >= 1);
create policy "print staff" on print_items for all using (staff_level('temp') >= 2);
create policy "batches staff" on print_batches for all using (staff_level('temp') >= 1);
create policy "spoilage staff" on serial_spoilage for all using (staff_level('temp') >= 2);
create policy "documents read" on documents for select using (company_id in (select my_company_ids()) or staff_level('docs') >= 1);
create policy "documents staff" on documents for all using (staff_level('docs') >= 2);
-- public verification goes through /api/verify/[code] (service role, minimal projection, rate-limited).

-- services
create policy "svc read" on service_requests for select using (company_id in (select my_company_ids()) or staff_level('svc') >= 1);
create policy "svc insert" on service_requests for insert with check (company_id in (select my_company_ids()) and my_company_role(company_id) in ('Owner','Manager','Services'));
create policy "svc staff" on service_requests for update using (staff_level('svc') >= 2);
create policy "svc docs" on service_documents for all using (request_id in (select id from service_requests where company_id in (select my_company_ids())) or staff_level('svc') >= 1);
create policy "svc types read" on service_types for select using (true);
create policy "svc types staff" on service_types for all using (staff_level('plat') >= 2);

-- engagement
create policy "my notifications" on notifications for select using (user_id = auth.uid() or company_id in (select my_company_ids()));
create policy "mark read" on notifications for update using (user_id = auth.uid());
create policy "tickets" on tickets for select using (company_id in (select my_company_ids()) or staff_level('eng') >= 1);
create policy "tickets staff" on tickets for all using (staff_level('eng') >= 2);
create policy "events read" on events for select using (published or staff_level('eng') >= 1);
create policy "events staff" on events for all using (staff_level('eng') >= 2);
create policy "regs" on event_registrations for all using (company_id in (select my_company_ids()) or staff_level('eng') >= 1);
create policy "posts read" on posts for select using (status = 'Live' or staff_level('eng') >= 1);
create policy "posts staff" on posts for all using (staff_level('eng') >= 2);
create policy "change req" on change_requests for select using (company_id in (select my_company_ids()) or staff_level('reg') >= 1);
create policy "change req insert" on change_requests for insert with check (company_id in (select my_company_ids()));
create policy "change req staff" on change_requests for update using (staff_level('reg') >= 2);

-- staff, settings, audit
create policy "staff read" on staff for select using (is_staff());
create policy "staff manage" on staff for all using (staff_level('staff') >= 3);
create policy "perm read" on role_permissions for select using (is_staff());
create policy "perm manage" on role_permissions for all using (staff_level('staff') >= 3);
create policy "settings read" on settings for select using (true);   -- only non-secret keys are stored here
create policy "settings write" on settings for all using (staff_level('plat') >= 2);
create policy "audit read" on audit_log for select using (staff_level('staff') >= 1);
-- audit_log insert happens only through lib/audit (service role); no client insert policy.
create policy "company users read" on company_users for select using (company_id in (select my_company_ids()) or staff_level('reg') >= 1);
create policy "company users manage" on company_users for all using (my_company_role(company_id) = 'Owner');
create policy "invites read" on invitations for select using (staff_level('staff') >= 3 or company_id in (select my_company_ids()));
create policy "doc reqs read" on document_requirements for select using (true);
create policy "meetings" on meetings for all using (staff_level('cmt') >= 1);
create policy "committee" on committee_items for all using (staff_level('cmt') >= 1);
create policy "imports" on imports for all using (staff_level('reg') >= 2);
create policy "email tpl" on email_templates for all using (staff_level('eng') >= 2);
create policy "email log" on email_log for select using (staff_level('eng') >= 1);
create policy "ticket msgs" on ticket_messages for all using (ticket_id in (select id from tickets where company_id in (select my_company_ids())) or staff_level('eng') >= 1);
create policy "otp none" on endorsement_otps for select using (false);
create policy "overrides" on staff_permission_overrides for all using (staff_level('staff') >= 3);
