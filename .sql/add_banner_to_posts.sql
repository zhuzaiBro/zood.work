-- 文章表增加卡片/详情页封面图 URL
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS banner text NULL;

COMMENT ON COLUMN public.posts.banner IS '卡片与详情页封面图 URL（可选）';
