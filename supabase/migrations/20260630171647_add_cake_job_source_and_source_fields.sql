-- 多平台岗位适配：在统一岗位表中冗余记录来源平台信息，并新增 Cake.me source。

alter table public.job_listings
  add column if not exists source_slug text,
  add column if not exists source_name text;

comment on column public.job_listings.source_slug is '岗位来源平台 slug，冗余自 job_sources.slug，便于列表展示和排查';
comment on column public.job_listings.source_name is '岗位来源平台名称，冗余自 job_sources.name，便于列表展示和排查';
comment on column public.job_listings.source_url is '来源平台岗位详情页 URL';

update public.job_listings jl
set
  source_slug = js.slug,
  source_name = js.name
from public.job_sources js
where jl.source_id = js.id
  and (jl.source_slug is null or jl.source_name is null);

create index if not exists idx_job_listings_source_slug
  on public.job_listings(source_slug);

insert into public.job_sources (slug, name, base_url, is_active, sync_config)
values (
  'cake',
  'Cake.me',
  'https://www.cake.me',
  true,
  '{
    "provider": "cake",
    "search_api_url": "https://api.cake.me/api/client/v1/jobs/search",
    "query": "",
    "professions": [
      "it_back-end-engineer",
      "it_software-engineer",
      "it_blockchain-platform-engineer"
    ],
    "job_types": ["full_time"],
    "remote": ["full_remote_work"],
    "sort_by": "popularity",
    "page": 1,
    "per_page": 10,
    "search_session_id": "zood-job-sync"
  }'::jsonb
)
on conflict (slug) do update
set
  name = excluded.name,
  base_url = excluded.base_url,
  is_active = excluded.is_active,
  sync_config = excluded.sync_config,
  updated_at = now();
