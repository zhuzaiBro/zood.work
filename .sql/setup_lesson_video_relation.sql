-- 课程 lesson 与视频关联
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
--
-- 目标：
-- 1. 确保 public.videos 表存在（可选本地缓存，播放走外部 Video Manager API）
-- 2. lessons.video_id 保持 TEXT，存储外部 Video Manager API 返回的 videoId
-- 3. 移除 lessons.video_id -> public.videos 外键（外部视频不一定写入本地 videos 表）
-- 4. 给 videos 配置最小可用的 Data API 权限与 RLS 策略

-- 1. 确保 videos 表存在
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_file TEXT NOT NULL,
  cos_prefix TEXT,
  m3u8_path TEXT,
  duration INTEGER,
  width INTEGER,
  height INTEGER,
  fps NUMERIC(10, 2),
  segment_count INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_status
ON public.videos(status);

-- 2. updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. lessons.video_id：外部 Video API 标识，保持 TEXT，不做 UUID 迁移
ALTER TABLE public.lessons
DROP CONSTRAINT IF EXISTS lessons_video_id_fkey;

DO $$
DECLARE
  video_id_type TEXT;
BEGIN
  SELECT data_type
  INTO video_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'lessons'
    AND column_name = 'video_id';

  IF video_id_type = 'uuid' THEN
    ALTER TABLE public.lessons
    ALTER COLUMN video_id TYPE TEXT
    USING video_id::TEXT;
  ELSIF video_id_type IS NULL THEN
    ALTER TABLE public.lessons
    ADD COLUMN video_id TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lessons_video_id
ON public.lessons(video_id);

COMMENT ON COLUMN public.lessons.video_id IS '外部 Video Manager API 的 videoId（32 位 hex 或 UUID 字符串），播放时直接请求 video-api';
COMMENT ON COLUMN public.lessons.video_url IS '兼容旧字段；可与 video_id 组合成完整 API 地址';

-- 4. videos 表 Data API 权限与 RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.videos TO authenticated;

DROP POLICY IF EXISTS "Users can view ready videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can manage all videos" ON public.videos;

CREATE POLICY "Users can view ready videos"
ON public.videos
FOR SELECT
TO anon, authenticated
USING (status = 'ready');

CREATE POLICY "Admins can manage all videos"
ON public.videos
FOR ALL
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

-- 5. 验证结构与策略
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lessons'
  AND column_name = 'video_id';

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
  AND tablename = 'videos'
ORDER BY policyname;
