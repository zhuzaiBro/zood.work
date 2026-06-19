-- 岗位同步：多来源数据表 + RLS + pg_cron 定时触发
-- 在 Supabase Dashboard → SQL Editor 中执行
--
-- 配套文件：
--   supabase/functions/sync-dejob-jobs/index.ts
--   docs/JOB_SYNC_SETUP.md

-- ============================================================
-- 1. 扩展（pg_cron 一般已启用；pg_net 用于定时 HTTP 调用 Edge Function）
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================
-- 2. 岗位来源（支持 dejob 及后续其他平台）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- 非敏感同步配置：分页、接口路径等；Token 放 Edge Function Secrets
  sync_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.job_sources IS '岗位数据来源平台注册表';
COMMENT ON COLUMN public.job_sources.slug IS '来源标识，如 dejob、xxx_jobs';
COMMENT ON COLUMN public.job_sources.sync_config IS '同步参数（page/limit/endpoint 等），不含密钥';

-- ============================================================
-- 3. 岗位主表（按 source + external_id 去重）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.job_sources(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,

  title TEXT,
  position_id INTEGER,
  status INTEGER NOT NULL DEFAULT 0,

  description TEXT,
  requirements TEXT,
  benefits TEXT,
  extra_content TEXT,

  company_name TEXT,
  company_external_id TEXT,
  company_intro TEXT,
  company_logo TEXT,
  company_website TEXT,
  company_size TEXT,

  work_type_id INTEGER,
  work_type_name TEXT,
  office_mode_id INTEGER,
  office_mode_name TEXT,
  location TEXT,
  base_location TEXT,
  min_salary NUMERIC,
  max_salary NUMERIC,

  email TEXT,
  phone TEXT,
  wechat TEXT,
  telegram TEXT,

  source_url TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_top_job BOOLEAN NOT NULL DEFAULT FALSE,
  urgency_id INTEGER,
  urgency_name TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  apply_count INTEGER NOT NULL DEFAULT 0,

  publisher JSONB,
  raw_data JSONB,

  source_created_at TIMESTAMPTZ,
  first_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (source_id, external_id)
);

COMMENT ON TABLE public.job_listings IS '从各平台同步的岗位详情';
COMMENT ON COLUMN public.job_listings.external_id IS '来源平台岗位 ID，如 dejob topicId';
COMMENT ON COLUMN public.job_listings.raw_data IS '来源 API 原始 JSON，便于后续字段扩展';

-- ============================================================
-- 4. 同步运行日志
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.job_sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  jobs_fetched INTEGER NOT NULL DEFAULT 0,
  jobs_created INTEGER NOT NULL DEFAULT 0,
  jobs_skipped INTEGER NOT NULL DEFAULT 0,
  jobs_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

COMMENT ON TABLE public.job_sync_runs IS '岗位同步任务执行记录';

-- ============================================================
-- 5. 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_job_listings_source_id
  ON public.job_listings(source_id);

CREATE INDEX IF NOT EXISTS idx_job_listings_source_created_at
  ON public.job_listings(source_created_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_job_listings_company_name
  ON public.job_listings(company_name);

CREATE INDEX IF NOT EXISTS idx_job_listings_tags
  ON public.job_listings USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_job_sync_runs_source_started
  ON public.job_sync_runs(source_id, started_at DESC);

-- ============================================================
-- 6. updated_at 触发器（复用已有函数，没有则创建）
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_sources_updated_at ON public.job_sources;
CREATE TRIGGER update_job_sources_updated_at
BEFORE UPDATE ON public.job_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_listings_updated_at ON public.job_listings;
CREATE TRIGGER update_job_listings_updated_at
BEFORE UPDATE ON public.job_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. 初始化 dejob 来源
-- ============================================================
INSERT INTO public.job_sources (slug, name, base_url, sync_config)
VALUES (
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
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  sync_config = EXCLUDED.sync_config,
  updated_at = NOW();

-- ============================================================
-- 8. RLS
-- ============================================================
ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_sync_runs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.job_sources TO anon, authenticated;
GRANT SELECT ON public.job_listings TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read active job sources" ON public.job_sources;
CREATE POLICY "Public can read active job sources"
ON public.job_sources FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can read job listings" ON public.job_listings;
CREATE POLICY "Public can read job listings"
ON public.job_listings FOR SELECT
TO anon, authenticated
USING (TRUE);

-- sync_runs 不对前端开放；Edge Function 用 service_role 写入

-- ============================================================
-- 9. pg_cron：每 3 小时触发 Edge Function（部署函数后再执行本节）
-- ============================================================
-- 先把下面占位符替换为你的项目值：
--   YOUR_PROJECT_REF  → Supabase 项目 ref
--   YOUR_CRON_SECRET  → 与 Edge Function Secret CRON_SECRET 一致
--
-- SELECT cron.unschedule('sync-dejob-jobs-every-3h');  -- 如需重建先取消

-- SELECT cron.schedule(
--   'sync-dejob-jobs-every-3h',
--   '0 */3 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-dejob-jobs',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', 'YOUR_CRON_SECRET'
--     ),
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
