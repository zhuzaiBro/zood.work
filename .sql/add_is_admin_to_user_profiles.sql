-- 添加 is_admin 字段到 user_profiles 表
-- 用于标识管理员用户

-- 添加 is_admin 列，默认为 false
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 添加注释
COMMENT ON COLUMN public.user_profiles.is_admin IS '是否为管理员用户';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin 
ON public.user_profiles(is_admin) 
WHERE is_admin = true;

-- 可选：如果需要设置某些用户为管理员，可以执行以下语句
-- 将特定用户设置为管理员（根据 email 或 username）
-- UPDATE public.user_profiles 
-- SET is_admin = true 
-- WHERE username IN ('admin', 'your_username');

-- 或者根据 user id 设置
-- UPDATE public.user_profiles 
-- SET is_admin = true 
-- WHERE id = 'your-user-id-here';

-- 查看所有管理员
-- SELECT id, username, display_name, email, is_admin 
-- FROM public.user_profiles 
-- WHERE is_admin = true;

