-- 用户课程视频学习进度表
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  current_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lesson_progress_user_lesson_key UNIQUE (user_id, lesson_id),
  CONSTRAINT lesson_progress_current_seconds_check CHECK (current_seconds >= 0),
  CONSTRAINT lesson_progress_duration_seconds_check CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  CONSTRAINT lesson_progress_percent_check CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course
ON public.lesson_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_last_watched
ON public.lesson_progress(user_id, last_watched_at DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id
ON public.lesson_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_video_id
ON public.lesson_progress(video_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON public.lesson_progress;

CREATE TRIGGER update_lesson_progress_updated_at
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- 新 Supabase 项目可能不会自动暴露新表到 Data API，显式授权更稳。
GRANT SELECT, INSERT, UPDATE ON public.lesson_progress TO authenticated;

DROP POLICY IF EXISTS "Users can read own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can update own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Admins can read all lesson progress" ON public.lesson_progress;

CREATE POLICY "Users can read own lesson progress"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own lesson progress"
ON public.lesson_progress
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own lesson progress"
ON public.lesson_progress
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can read all lesson progress"
ON public.lesson_progress
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

COMMENT ON TABLE public.lesson_progress IS '记录用户在每个课时视频中的学习进度，用于刷新恢复与学习统计';
COMMENT ON COLUMN public.lesson_progress.current_seconds IS '用户上次观看到的视频秒数';
COMMENT ON COLUMN public.lesson_progress.progress_percent IS 'current_seconds / duration_seconds 计算出的观看进度百分比';
COMMENT ON COLUMN public.lesson_progress.video_id IS '关联 public.videos.id，与 lessons.video_id 一致';

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
  AND tablename = 'lesson_progress'
ORDER BY policyname;
