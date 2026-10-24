#!/usr/bin/env bash
# Makes the FIRST Secretary General (docs/20-deployment-plan.md step 7). Everyone after that is invited from
# /admin/staff. The person registers at /register and confirms their email first; this only adds their staff row.
#
#   MCCI_SELFHOST_RUNTIME=<dir> scripts/selfhost/first-secretary-general.sh <email>
#
# Refuses when any active staff member already exists, when the email has no confirmed account, or when the address is
# not a plain email. Audited like every staff change (row trigger, reason "first Secretary General (bootstrap)").
# At their next sign-in on the Staff tab the person sets up 2-step login (TOTP) before the admin panel opens.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

email=${1:-}
[[ "$email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || die "usage: first-secretary-general.sh <email>"

tmp="$SELFHOST_ROOT/supabase/.migrate-tmp"
mkdir -p "$tmp"
trap 'rm -rf "$tmp"' EXIT
cat >"$tmp/first-sg.sql" <<SQL
begin;
do \$\$
declare
  v_user uuid;
begin
  if exists (select 1 from public.staff where active) then
    raise exception 'refused: active staff already exist; invite from /admin/staff instead';
  end if;
  select p.id into v_user
    from public.profiles p join auth.users u on u.id = p.id
   where p.email = lower('${email}') and u.email_confirmed_at is not null;
  if v_user is null then
    raise exception 'refused: no confirmed account for this email (register at /register and open the link first)';
  end if;
  perform private.set_reason('first Secretary General (bootstrap)');
  insert into public.staff (user_id, designation) values (v_user, 'Secretary General');
end \$\$;
select 'Secretary General added';
commit;
SQL
"$SELFHOST_ROOT/scripts/selfhost/compose.sh" psql-file "$tmp/first-sg.sql"
