-- 视频访问日志表与管理员统计权限
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS public.video_access_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  segment_name TEXT,
  watch_seconds INTEGER,
  ip INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_access_logs_user_video
ON public.video_access_logs(user_id, video_id);

CREATE INDEX IF NOT EXISTS idx_video_access_logs_created_at
ON public.video_access_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_video_access_logs_video_id
ON public.video_access_logs(video_id);

ALTER TABLE public.video_access_logs ENABLE ROW LEVEL SECURITY;

-- 新 Supabase 项目可能不会自动暴露新表到 Data API，显式授权更稳。
GRANT SELECT, INSERT ON public.video_access_logs TO authenticated;

DROP POLICY IF EXISTS "Admins can read video access logs" ON public.video_access_logs;
DROP POLICY IF EXISTS "Users can insert own video access logs" ON public.video_access_logs;

CREATE POLICY "Admins can read video access logs"
ON public.video_access_logs
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

CREATE POLICY "Users can insert own video access logs"
ON public.video_access_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::TEXT);

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
  AND tablename = 'video_access_logs'
ORDER BY policyname;
