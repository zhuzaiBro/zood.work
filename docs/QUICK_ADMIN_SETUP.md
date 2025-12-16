# 管理员权限快速设置（5分钟）

## 🚀 三步完成设置

### 第 1 步：执行 SQL（2分钟）

登录 [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor → 执行：

```sql
-- 添加 is_admin 字段
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin 
ON public.user_profiles(is_admin) 
WHERE is_admin = true;
```

### 第 2 步：设置管理员（1分钟）

**找到你的用户名**：查看个人中心或执行：

```sql
SELECT id, username, display_name FROM user_profiles;
```

**设置为管理员**：

```sql
UPDATE public.user_profiles 
SET is_admin = true 
WHERE username = '你的用户名';
```

### 第 3 步：验证（2分钟）

1. **退出登录并重新登录**
2. **点击头像** → 应该看到 "面试题管理 [Admin]"
3. **点击进入** → 可以访问管理后台

## ✅ 完成！

现在你可以：
- 访问 `/admin/questions` 管理面试题
- 批量上传 CSV 文件导入题目
- 查看所有管理功能

## 📋 常用 SQL 命令

```sql
-- 查看所有管理员
SELECT username, display_name, is_admin 
FROM user_profiles 
WHERE is_admin = true;

-- 添加管理员
UPDATE user_profiles SET is_admin = true WHERE username = 'username';

-- 移除管理员
UPDATE user_profiles SET is_admin = false WHERE username = 'username';

-- 批量设置
UPDATE user_profiles SET is_admin = true 
WHERE username IN ('admin1', 'admin2', 'admin3');
```

## 🐛 问题排查

**看不到管理员菜单？**
1. 清除浏览器缓存
2. 退出重新登录
3. 检查数据库 `is_admin` 是否为 `true`

**提示"无权访问"？**
- 确认 SQL 执行成功
- 确认用户名正确
- 重新登录

## 📚 详细文档

需要更多信息？查看 [完整管理员设置指南](./ADMIN_SETUP_GUIDE.md)

