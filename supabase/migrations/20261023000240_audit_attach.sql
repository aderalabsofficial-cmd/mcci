-- 0240 · attach the row-audit trigger (0110) to every business table (CLAUDE.md rule 5, finding F-12)
-- Not audited here: the logs themselves (audit_log, email_log, push_log, job_runs, rate limits), version/history tables
-- that are already a history (application_document_versions, application_history), private chat and device data
-- (ai_conversations, device_tokens), and notification read flags.

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','designations','role_permissions','staff','staff_permission_overrides','consents','account_deletion_requests',
    'companies','company_users','members',
    'document_requirements','service_types','email_templates',
    'applications','application_partners','application_documents','application_form_snapshots',
    'endorsements','meetings','committee_items',
    'payment_vouchers','payment_receipts',
    'temp_memberships','print_batches','print_items','serial_spoilage','member_cards',
    'service_requests','service_documents','service_messages',
    'tickets','ticket_messages','events','event_registrations','posts','opportunities','opportunity_replies',
    'change_requests','reminders','imports','ai_extractions'
  ] loop
    execute format('create trigger audit_row after insert or update or delete on public.%I for each row execute function private.audit_row()', t);
  end loop;
end $$;

-- invitations: never copy the token hash into the audit log
create trigger audit_row after insert or update or delete on public.invitations
  for each row execute function private.audit_row('token_hash');

-- settings live in the private schema
create trigger audit_row after insert or update or delete on private.settings
  for each row execute function private.audit_row();

-- QR registry: audit everything except the scan counter, which the verify endpoint increments on every scan
create trigger audit_row after insert or delete on public.documents
  for each row execute function private.audit_row();
create trigger audit_row_update after update of status, superseded_by, revoked_reason, path, valid_to, title on public.documents
  for each row execute function private.audit_row();
