-- 为 interview_question_submissions 补齐附件字段
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

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

COMMENT ON COLUMN public.interview_question_submissions.attachment_name IS '投稿附件原始文件名';
COMMENT ON COLUMN public.interview_question_submissions.attachment_path IS 'Supabase Storage 中的附件路径';
COMMENT ON COLUMN public.interview_question_submissions.attachment_mime_type IS '投稿附件 MIME 类型';
COMMENT ON COLUMN public.interview_question_submissions.attachment_size_bytes IS '投稿附件大小（字节）';

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'interview_question_submissions'
  AND column_name LIKE 'attachment_%'
ORDER BY column_name;

-- 刷新 PostgREST schema cache，避免 PGRST204
NOTIFY pgrst, 'reload schema';
