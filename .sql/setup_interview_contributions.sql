-- 面试题普通用户投稿表与 RLS 策略
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 建表：投稿进入审核队列，不直接写入正式 interview_question 表
CREATE TABLE IF NOT EXISTS public.interview_question_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  -- collection_id 仅供管理员后续整理使用，普通用户投稿时不需要选择题集
  collection_id UUID REFERENCES public.interview_collections(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  tags TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IS NULL OR difficulty IN ('简单', '中等', '困难')),
  source TEXT,
  contact TEXT,
  attachment_name TEXT,
  attachment_path TEXT,
  attachment_mime_type TEXT,
  attachment_size_bytes BIGINT CHECK (attachment_size_bytes IS NULL OR attachment_size_bytes >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 如果表已创建过，补齐本次新增字段
ALTER TABLE public.interview_question_submissions
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.interview_question_submissions
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_path TEXT,
ADD COLUMN IF NOT EXISTS attachment_mime_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size_bytes BIGINT;

ALTER TABLE public.interview_question_submissions
DROP CONSTRAINT IF EXISTS interview_question_submissions_attachment_size_bytes_check;

ALTER TABLE public.interview_question_submissions
ADD CONSTRAINT interview_question_submissions_attachment_size_bytes_check
CHECK (attachment_size_bytes IS NULL OR attachment_size_bytes >= 0);

COMMENT ON TABLE public.interview_question_submissions IS '普通用户提交的面试题投稿，管理员审核后再进入正式题库';
COMMENT ON COLUMN public.interview_question_submissions.collection_id IS '管理员整理投稿时可选关联的题集，普通用户投稿不需要填写';
COMMENT ON COLUMN public.interview_question_submissions.tags IS '普通用户投递时填写的自由标签，用于后续归类整理';
COMMENT ON COLUMN public.interview_question_submissions.attachment_name IS '投稿附件原始文件名';
COMMENT ON COLUMN public.interview_question_submissions.attachment_path IS 'Supabase Storage 中的附件路径';
COMMENT ON COLUMN public.interview_question_submissions.attachment_mime_type IS '投稿附件 MIME 类型';
COMMENT ON COLUMN public.interview_question_submissions.attachment_size_bytes IS '投稿附件大小（字节）';
COMMENT ON COLUMN public.interview_question_submissions.status IS 'pending=待审核, accepted=已采纳, rejected=未采纳';

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_interview_question_submissions_user_id
ON public.interview_question_submissions(user_id);

CREATE INDEX IF NOT EXISTS idx_interview_question_submissions_collection_id
ON public.interview_question_submissions(collection_id);

CREATE INDEX IF NOT EXISTS idx_interview_question_submissions_status_created_at
ON public.interview_question_submissions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interview_question_submissions_tags
ON public.interview_question_submissions USING GIN(tags);

-- 3. updated_at 自动维护
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_interview_question_submissions_updated_at
ON public.interview_question_submissions;

CREATE TRIGGER update_interview_question_submissions_updated_at
BEFORE UPDATE ON public.interview_question_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. 启用 RLS 并赋予 Data API 基础权限
ALTER TABLE public.interview_question_submissions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.interview_question_submissions TO authenticated;

-- 5. 删除旧策略，避免重复或冲突
DROP POLICY IF EXISTS "Users can read own interview submissions" ON public.interview_question_submissions;
DROP POLICY IF EXISTS "Users can insert own interview submissions" ON public.interview_question_submissions;
DROP POLICY IF EXISTS "Users can update own pending interview submissions" ON public.interview_question_submissions;
DROP POLICY IF EXISTS "Admins can read all interview submissions" ON public.interview_question_submissions;
DROP POLICY IF EXISTS "Admins can update all interview submissions" ON public.interview_question_submissions;

-- 6. 普通用户：只管理自己的投稿
CREATE POLICY "Users can read own interview submissions"
ON public.interview_question_submissions
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own interview submissions"
ON public.interview_question_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND status = 'pending'
);

CREATE POLICY "Users can update own pending interview submissions"
ON public.interview_question_submissions
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  AND status = 'pending'
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND status = 'pending'
);

-- 7. 管理员：可查看和处理所有投稿
CREATE POLICY "Admins can read all interview submissions"
ON public.interview_question_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.is_admin IS TRUE
  )
);

CREATE POLICY "Admins can update all interview submissions"
ON public.interview_question_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.is_admin IS TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.is_admin IS TRUE
  )
);

-- 8. 验证策略
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'interview_question_submissions'
ORDER BY policyname;

-- 刷新 PostgREST schema cache
NOTIFY pgrst, 'reload schema';
