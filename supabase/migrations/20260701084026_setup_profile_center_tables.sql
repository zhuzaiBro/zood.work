-- Profile center support tables:
-- 1. interview question favorites
-- 2. resume optimization history records

CREATE TABLE IF NOT EXISTS public.interview_question_favorites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.interview_question(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT interview_question_favorites_user_question_unique
    UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_interview_question_favorites_user_created
ON public.interview_question_favorites(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interview_question_favorites_question_id
ON public.interview_question_favorites(question_id);

ALTER TABLE public.interview_question_favorites ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_question_favorites TO authenticated;

DROP POLICY IF EXISTS "Users can read own question favorites" ON public.interview_question_favorites;
DROP POLICY IF EXISTS "Users can insert own question favorites" ON public.interview_question_favorites;
DROP POLICY IF EXISTS "Users can update own question favorites" ON public.interview_question_favorites;
DROP POLICY IF EXISTS "Users can delete own question favorites" ON public.interview_question_favorites;

CREATE POLICY "Users can read own question favorites"
ON public.interview_question_favorites
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own question favorites"
ON public.interview_question_favorites
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own question favorites"
ON public.interview_question_favorites
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own question favorites"
ON public.interview_question_favorites
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.interview_question_favorites IS '用户收藏的面试题，用于个人中心聚合查看';

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
