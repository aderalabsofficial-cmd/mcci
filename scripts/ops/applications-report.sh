#!/usr/bin/env bash
# Read-only list of membership applications for MCCI while the staff review desk is being built (Release 2).
# Runs ONE read-only transaction inside the production db container and prints only non-identifying fields:
# application token, stage, business type, class, created / submitted dates, days waiting and document counts by
# status. No names, CNIC/NTN numbers, emails, phone numbers, addresses, file names or file contents.
#
#   ssh mcci-vps 'bash -s' < scripts/ops/applications-report.sh            # open applications (not draft)
#   ssh mcci-vps 'bash -s' -- --all < scripts/ops/applications-report.sh   # also drafts, withdrawn, rejected
set -euo pipefail
ALL=0
[ "${1:-}" = "--all" ] && ALL=1
docker exec -i supabase-db psql -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 -v all="$ALL" -P pager=off <<'SQL'
begin read only;
set local statement_timeout = '10s';
select a.token,
       a.stage::text                                                         as stage,
       coalesce(a.form->>'biz', '-')                                         as biz,
       coalesce(a.class::text, '-')                                          as class,
       to_char(a.created_at at time zone 'Asia/Karachi', 'YYYY-MM-DD')       as created,
       coalesce(to_char(a.submitted_at at time zone 'Asia/Karachi', 'YYYY-MM-DD HH24:MI'), '-') as submitted_pkt,
       case when a.submitted_at is null then '-'
            else (extract(day from now() - a.submitted_at))::int::text end   as days_waiting,
       count(d.id)                                                           as docs,
       count(d.id) filter (where d.status = 'pending')                       as pending,
       count(d.id) filter (where d.status = 'ok')                            as ok,
       count(d.id) filter (where d.status = 'rejected')                      as rejected
from public.applications a
left join public.application_documents d on d.application_id = a.id
where :all = 1 or a.stage not in ('draft', 'withdrawn', 'rejected')
group by a.id
order by a.submitted_at nulls last, a.created_at;
select stage::text as stage, count(*) as applications from public.applications group by stage order by stage;
rollback;
SQL
