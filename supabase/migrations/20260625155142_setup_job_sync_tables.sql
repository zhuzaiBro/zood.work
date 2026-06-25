-- 岗位同步：多来源数据表 + RLS + pg_cron 定时触发
-- 配套文件：
--   supabase/functions/sync-dejob-jobs/index.ts
--   docs/JOB_SYNC_SETUP.md

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.job_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  base_url text,
  is_active boolean not null default true,
  sync_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.job_sources is '岗位数据来源平台注册表';
comment on column public.job_sources.slug is '来源标识，如 dejob、xxx_jobs';
comment on column public.job_sources.sync_config is '同步参数（page/limit/endpoint 等），不含密钥';

create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.job_sources(id) on delete cascade,
  external_id text not null,
  title text,
  position_id integer,
  status integer not null default 0,
  description text,
  requirements text,
  benefits text,
  extra_content text,
  company_name text,
  company_external_id text,
  company_intro text,
  company_logo text,
  company_website text,
  company_size text,
  work_type_id integer,
  work_type_name text,
  office_mode_id integer,
  office_mode_name text,
  location text,
  base_location text,
  min_salary numeric,
  max_salary numeric,
  email text,
  phone text,
  wechat text,
  telegram text,
  source_url text,
  tags jsonb not null default '[]'::jsonb,
  is_top_job boolean not null default false,
  urgency_id integer,
  urgency_name text,
  view_count integer not null default 0,
  apply_count integer not null default 0,
  publisher jsonb,
  raw_data jsonb,
  source_created_at timestamptz,
  first_synced_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

comment on table public.job_listings is '从各平台同步的岗位详情';
comment on column public.job_listings.external_id is '来源平台岗位 ID，如 dejob topicId';
comment on column public.job_listings.raw_data is '来源 API 原始 JSON，便于后续字段扩展';

create table if not exists public.job_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.job_sources(id) on delete set null,
  status text not null check (status in ('running', 'success', 'failed')),
  jobs_fetched integer not null default 0,
  jobs_created integer not null default 0,
  jobs_skipped integer not null default 0,
  jobs_failed integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

comment on table public.job_sync_runs is '岗位同步任务执行记录';

create index if not exists idx_job_listings_source_id
  on public.job_listings(source_id);

create index if not exists idx_job_listings_source_created_at
  on public.job_listings(source_created_at desc nulls last);

create index if not exists idx_job_listings_company_name
  on public.job_listings(company_name);

create index if not exists idx_job_listings_tags
  on public.job_listings using gin(tags);

create index if not exists idx_job_sync_runs_source_id
  on public.job_sync_runs(source_id);

create index if not exists idx_job_sync_runs_source_started
  on public.job_sync_runs(source_id, started_at desc);

drop trigger if exists update_job_sources_updated_at on public.job_sources;
create trigger update_job_sources_updated_at
before update on public.job_sources
for each row execute function public.update_updated_at_column();

drop trigger if exists update_job_listings_updated_at on public.job_listings;
create trigger update_job_listings_updated_at
before update on public.job_listings
for each row execute function public.update_updated_at_column();

insert into public.job_sources (slug, name, base_url, sync_config)
values (
  'dejob',
  'DeJob',
  'https://dejob.ai',
  '{
    "list_path": "/api/worker/topics",
    "detail_path_template": "/api/worker/{id}",
    "page": 1,
    "limit": 20
  }'::jsonb
)
on conflict (slug) do update
set
  name = excluded.name,
  base_url = excluded.base_url,
  sync_config = excluded.sync_config,
  updated_at = now();

alter table public.job_sources enable row level security;
alter table public.job_listings enable row level security;
alter table public.job_sync_runs enable row level security;

grant select on public.job_sources to anon, authenticated;
grant select on public.job_listings to anon, authenticated;

drop policy if exists "Public can read active job sources" on public.job_sources;
create policy "Public can read active job sources"
on public.job_sources
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read job listings" on public.job_listings;
create policy "Public can read job listings"
on public.job_listings
for select
to anon, authenticated
using (true);
