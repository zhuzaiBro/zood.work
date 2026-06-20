-- 为 lessons 增加课件与富文本内容字段
-- 在 Supabase SQL Editor 中执行

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS courseware_name TEXT,
  ADD COLUMN IF NOT EXISTS courseware_url TEXT,
  ADD COLUMN IF NOT EXISTS content_html TEXT,
  ADD COLUMN IF NOT EXISTS content_markdown TEXT;

COMMENT ON COLUMN public.lessons.courseware_name IS '课件名称';
COMMENT ON COLUMN public.lessons.courseware_url IS '课件下载地址，可指向 Supabase Storage 或外部 URL';
COMMENT ON COLUMN public.lessons.content_html IS '富文本 HTML 内容';
COMMENT ON COLUMN public.lessons.content_markdown IS '富文本 Markdown 内容';
