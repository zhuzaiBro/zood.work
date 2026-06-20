-- 为课件文件创建 Supabase Storage bucket 与基础策略
-- 在 Supabase SQL Editor 中执行

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-courseware',
  'lesson-courseware',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can upload lesson courseware" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read lesson courseware" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update lesson courseware" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lesson courseware" ON storage.objects;

CREATE POLICY "Anyone can read lesson courseware"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'lesson-courseware');

CREATE POLICY "Admins can upload lesson courseware"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-courseware'
  AND EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin IS TRUE
  )
);

CREATE POLICY "Admins can update lesson courseware"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-courseware'
  AND EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin IS TRUE
  )
)
WITH CHECK (
  bucket_id = 'lesson-courseware'
  AND EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin IS TRUE
  )
);

CREATE POLICY "Admins can delete lesson courseware"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-courseware'
  AND EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin IS TRUE
  )
);
