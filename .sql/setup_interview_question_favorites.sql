-- 面试题收藏表：登录用户只能管理自己的收藏
-- 在 Supabase Dashboard 的 SQL Editor 中执行

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

NOTIFY pgrst, 'reload schema';
