-- 简历优化 Agent 历史记录：登录用户只能查看自己的优化记录
-- 在 Supabase Dashboard 的 SQL Editor 中执行

CREATE TABLE IF NOT EXISTS public.resume_optimization_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  experience_level TEXT,
  job_description TEXT,
  resume_excerpt TEXT,
  score INTEGER,
  positioning TEXT,
  rewritten_summary TEXT,
  optimized_bullets TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  action_plan TEXT[] NOT NULL DEFAULT '{}',
  interview_stories TEXT[] NOT NULL DEFAULT '{}',
  resume_html TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT resume_optimization_records_score_check
    CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

CREATE INDEX IF NOT EXISTS idx_resume_optimization_records_user_created
ON public.resume_optimization_records(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resume_optimization_records_updated_at
ON public.resume_optimization_records;

CREATE TRIGGER update_resume_optimization_records_updated_at
BEFORE UPDATE ON public.resume_optimization_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.resume_optimization_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_optimization_records TO authenticated;

DROP POLICY IF EXISTS "Users can read own resume optimization records" ON public.resume_optimization_records;
DROP POLICY IF EXISTS "Users can insert own resume optimization records" ON public.resume_optimization_records;
DROP POLICY IF EXISTS "Users can update own resume optimization records" ON public.resume_optimization_records;
DROP POLICY IF EXISTS "Users can delete own resume optimization records" ON public.resume_optimization_records;

CREATE POLICY "Users can read own resume optimization records"
ON public.resume_optimization_records
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own resume optimization records"
ON public.resume_optimization_records
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own resume optimization records"
ON public.resume_optimization_records
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own resume optimization records"
ON public.resume_optimization_records
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.resume_optimization_records IS '简历优化 Agent 每次生成的历史记录，供个人中心回看和导出';
COMMENT ON COLUMN public.resume_optimization_records.resume_excerpt IS '原始简历文本摘要，避免在列表页读取完整简历';
COMMENT ON COLUMN public.resume_optimization_records.resume_html IS 'Agent 生成的可导出 HTML 简历';

NOTIFY pgrst, 'reload schema';
