-- 修复 user_profiles 表的 RLS 策略
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 启用 RLS（如果尚未启用）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有旧策略（避免冲突）
DROP POLICY IF EXISTS "Anyone can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- 3. 创建新的策略

-- 策略1：所有人可以查看所有用户资料（包括匿名用户）
CREATE POLICY "Anyone can view user profiles"
ON user_profiles
FOR SELECT
TO public
USING (true);

-- 策略2：认证用户可以插入自己的资料
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 策略3：认证用户可以更新自己的资料
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 策略4：认证用户可以删除自己的资料（可选）
CREATE POLICY "Users can delete own profile"
ON user_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 4. 验证策略是否创建成功
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
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. 测试：查看当前用户的 ID（用于调试）
SELECT auth.uid() as current_user_id;

-- 6. 测试：尝试查询自己的资料
SELECT * FROM user_profiles WHERE id = auth.uid();

