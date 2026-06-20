-- 投稿附件 Storage：私有读写，登录用户仅可操作自己 uid 目录下的文件
-- 在 Supabase SQL Editor 中执行

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interview-submission-attachments',
  'interview-submission-attachments',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "interview attachments read own folder" ON storage.objects;
DROP POLICY IF EXISTS "interview attachments insert own folder" ON storage.objects;
DROP POLICY IF EXISTS "interview attachments update own folder" ON storage.objects;
DROP POLICY IF EXISTS "interview attachments delete own folder" ON storage.objects;
DROP POLICY IF EXISTS "interview attachments admin read" ON storage.objects;
DROP POLICY IF EXISTS "interview attachments admin delete" ON storage.objects;

CREATE POLICY "interview attachments read own folder"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'interview-submission-attachments'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "interview attachments insert own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'interview-submission-attachments'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "interview attachments update own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'interview-submission-attachments'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'interview-submission-attachments'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "interview attachments delete own folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'interview-submission-attachments'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "interview attachments admin read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'interview-submission-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin IS TRUE
  )
);

CREATE POLICY "interview attachments admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'interview-submission-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin IS TRUE
  )
);
