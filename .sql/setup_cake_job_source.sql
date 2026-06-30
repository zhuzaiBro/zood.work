-- Cake.me 岗位来源
-- 在 Supabase Dashboard 的 SQL Editor 中执行

INSERT INTO public.job_sources (slug, name, base_url, is_active, sync_config)
VALUES (
  'cake',
  'Cake.me',
  'https://www.cake.me',
  TRUE,
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
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  is_active = EXCLUDED.is_active,
  sync_config = EXCLUDED.sync_config,
  updated_at = NOW();

SELECT id, slug, name, base_url, is_active, sync_config
FROM public.job_sources
WHERE slug = 'cake';
