-- 文章与分类关联的 RLS 策略
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 启用 RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_cates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_cate_relations ENABLE ROW LEVEL SECURITY;

-- 2. 赋予 Data API 所需表权限，具体行权限由 RLS 控制
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;

GRANT SELECT ON public.post_cates TO anon, authenticated;

GRANT SELECT ON public.post_cate_relations TO anon, authenticated;
GRANT INSERT, DELETE ON public.post_cate_relations TO authenticated;

-- 3. 删除旧策略，避免重复或冲突
DROP POLICY IF EXISTS "Anyone can read public posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can read own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;

DROP POLICY IF EXISTS "Anyone can read post categories" ON public.post_cates;

DROP POLICY IF EXISTS "Anyone can read public post category relations" ON public.post_cate_relations;
DROP POLICY IF EXISTS "Authors can insert own post category relations" ON public.post_cate_relations;
DROP POLICY IF EXISTS "Authors can delete own post category relations" ON public.post_cate_relations;

-- 4. posts 策略
CREATE POLICY "Anyone can read public posts"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (
  published IS TRUE
  AND COALESCE(is_public, true) IS TRUE
);

CREATE POLICY "Authors can read own posts"
ON public.posts
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Authors can insert own posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Authors can update own posts"
ON public.posts
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = author_id)
WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Authors can delete own posts"
ON public.posts
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = author_id);

-- 5. post_cates 策略：分类信息公开可读
CREATE POLICY "Anyone can read post categories"
ON public.post_cates
FOR SELECT
TO anon, authenticated
USING (true);

-- 6. post_cate_relations 策略
CREATE POLICY "Anyone can read public post category relations"
ON public.post_cate_relations
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.posts
    WHERE posts.id = post_cate_relations.post_id
      AND (
        (
          posts.published IS TRUE
          AND COALESCE(posts.is_public, true) IS TRUE
        )
        OR posts.author_id = (SELECT auth.uid())
      )
  )
);

CREATE POLICY "Authors can insert own post category relations"
ON public.post_cate_relations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.posts
    WHERE posts.id = post_cate_relations.post_id
      AND posts.author_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Authors can delete own post category relations"
ON public.post_cate_relations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.posts
    WHERE posts.id = post_cate_relations.post_id
      AND posts.author_id = (SELECT auth.uid())
  )
);

-- 7. 验证策略
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
  AND tablename IN ('posts', 'post_cates', 'post_cate_relations')
ORDER BY tablename, policyname;
