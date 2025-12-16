-- 用户个人资料表的 RLS（Row Level Security）策略设置
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "用户可以查看所有个人资料" ON user_profiles;
DROP POLICY IF EXISTS "用户只能查看自己的个人资料" ON user_profiles;
DROP POLICY IF EXISTS "用户可以更新自己的个人资料" ON user_profiles;
DROP POLICY IF EXISTS "用户可以插入自己的个人资料" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;

-- 3. 创建新的策略

-- 允许所有用户查看所有个人资料（公开信息）
CREATE POLICY "Anyone can view user profiles"
ON user_profiles
FOR SELECT
TO authenticated, anon
USING (true);

-- 允许认证用户插入自己的个人资料
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的个人资料
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 可选：允许用户删除自己的个人资料
CREATE POLICY "Users can delete their own profile"
ON user_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 4. 验证策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

