-- 0220 · imports, delivery logs, job runs, AI records, rate limits (docs/07, docs/08, docs/09, docs/13, docs/16 A6, D6)
-- Finding F-22 (AI: cost guard and tenant isolation). Rate limiting is hybrid (decision 3): Redis for short-lived,
-- high-volume limits when available; PostgreSQL here for durable security/business controls and as the fallback.

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  file_path text,
  rows_total int, rows_ok int, rows_error int,
  report jsonb,
  by_user uuid references public.profiles,
  at timestamptz not null default now()
);

create table public.email_log (
  id bigint generated always as identity primary key,
  template_key text,
  to_email extensions.citext,
  status text,
  provider_id text,
  at timestamptz not null default now()
);

create table public.push_log (                   -- docs/15 §6 push channel; never contains personal data in the body
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles on delete set null,
  category text,
  status text,
  at timestamptz not null default now()
);

create table public.job_runs (                   -- docs/16 D6 job & system health panel
  id bigint generated always as identity primary key,
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  result text check (result in ('ok','error')),
  summary jsonb
);
create index job_runs_job on public.job_runs (job, started_at desc);

create table public.ai_extractions (             -- docs/16 A6; prompts with document content are never stored (docs/08)
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies,
  application_id uuid references public.applications on delete cascade,
  service_request_id uuid references public.service_requests on delete cascade,
  doc_key text not null,
  model text,
  status text not null default 'started' check (status in ('started','done','failed')),
  fields jsonb,                                  -- structured output {field: {value, confidence, sourceDoc}}
  created_by uuid references public.profiles,
  created_at timestamptz not null default now(),
  check (application_id is not null or service_request_id is not null)
);
create index ai_extractions_app_day on public.ai_extractions (application_id, created_at);

create table public.ai_conversations (           -- docs/16 A6, Ask MCCI AI history; owner only
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── durable rate limits (PostgreSQL side of decision 3) ─────────
create table private.rate_limits (
  bucket text not null,                          -- e.g. 'verify:ip:203.0.113.7', 'otp:endorsement:<id>'
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (bucket, window_start)
);
alter table private.rate_limits enable row level security;
revoke all on private.rate_limits from public, anon, authenticated, service_role;

-- Fixed window: returns true while the bucket is within p_limit hits for the current window. Atomic under concurrency.
create function private.rate_limit_take(p_bucket text, p_limit int, p_window_seconds int) returns boolean
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_window timestamptz;
  v_hits int;
begin
  if p_limit is null or p_window_seconds is null or p_limit < 1 or p_window_seconds < 1
     or coalesce(length(p_bucket), 0) not between 1 and 200 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into private.rate_limits as r (bucket, window_start, hits) values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  return v_hits <= p_limit;
end $$;
revoke all on function private.rate_limit_take(text, int, int) from public, anon, authenticated;

-- Trusted server handlers (verify, contact form, login helpers) use this when Redis is not available.
create function api.rate_limit_take(p_bucket text, p_limit int, p_window_seconds int) returns boolean
  language sql volatile security definer set search_path = ''
  as $$ select private.rate_limit_take(p_bucket, p_limit, p_window_seconds) $$;
revoke all on function api.rate_limit_take(text, int, int) from public, anon, authenticated;
grant execute on function api.rate_limit_take(text, int, int) to service_role;

-- ───────── AI extraction cost guard (docs/08: max 15 extraction calls per application per day) ─────────
create function api.ai_extraction_begin(p_application uuid, p_doc_key text) returns uuid
  language plpgsql volatile security definer set search_path = ''
  as $$
declare
  v_company uuid;
  v_id uuid;
begin
  select a.company_id into v_company from public.applications a where a.id = p_application for update;
  if v_company is null or not private.app_editable(p_application) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.ai_extractions e
      where e.application_id = p_application
        and e.created_at >= date_trunc('day', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi') >= 15 then
    raise exception 'daily document reading limit reached for this application' using errcode = 'P0001', hint = 'ai_quota';
  end if;
  insert into public.ai_extractions (company_id, application_id, doc_key, created_by)
  values (v_company, p_application, p_doc_key, auth.uid())
  returning id into v_id;
  return v_id;
end $$;
revoke all on function api.ai_extraction_begin(uuid, text) from public, anon;
grant execute on function api.ai_extraction_begin(uuid, text) to authenticated;

alter table public.imports enable row level security;
alter table public.email_log enable row level security;
alter table public.push_log enable row level security;
alter table public.job_runs enable row level security;
alter table public.ai_extractions enable row level security;
alter table public.ai_conversations enable row level security;

grant select on public.imports, public.email_log, public.push_log, public.job_runs, public.ai_extractions, public.ai_conversations to authenticated;
create policy imports_select on public.imports for select to authenticated using ((select private.staff_level('reg')) >= 2);
create policy email_log_select on public.email_log for select to authenticated using ((select private.staff_level('eng')) >= 1);
create policy push_log_select on public.push_log for select to authenticated using ((select private.staff_level('eng')) >= 1);
create policy job_runs_select on public.job_runs for select to authenticated using ((select private.staff_level('plat')) >= 1);
create policy ai_extractions_select on public.ai_extractions for select to authenticated
  using (private.company_level(company_id, 'mship') >= 1 or (select private.staff_level('mem')) >= 1 or (select private.staff_level('rep')) >= 1);

grant insert (messages) on public.ai_conversations to authenticated;
grant update (messages) on public.ai_conversations to authenticated;
create policy ai_conversations_select on public.ai_conversations for select to authenticated using (user_id = (select auth.uid()));
create policy ai_conversations_insert on public.ai_conversations for insert to authenticated with check (user_id = (select auth.uid()));
create policy ai_conversations_update on public.ai_conversations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
