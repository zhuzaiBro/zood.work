-- 文章封面图 Storage：公开读、登录用户仅可上传到以自己 uid 为第一级目录的路径
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-banners',
  'post-banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "post-banners public read" ON storage.objects;
DROP POLICY IF EXISTS "post-banners insert own folder" ON storage.objects;
DROP POLICY IF EXISTS "post-banners update own folder" ON storage.objects;
DROP POLICY IF EXISTS "post-banners delete own folder" ON storage.objects;

CREATE POLICY "post-banners public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-banners');

CREATE POLICY "post-banners insert own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-banners'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "post-banners update own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'post-banners'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'post-banners'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "post-banners delete own folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-banners'
  AND split_part(name, '/', 1) = auth.uid()::text
);
