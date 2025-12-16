# 管理员权限设置指南

## 📋 概述

本指南将帮助你设置管理员权限，使特定用户能够访问面试题管理等后台功能。

## 🚀 设置步骤

### 1. 执行数据库迁移

首先，需要在数据库中添加 `is_admin` 字段。

#### 方式一：使用 Supabase SQL Editor（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"
5. 复制并执行以下 SQL：

```sql
-- 添加 is_admin 字段到 user_profiles 表
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 添加注释
COMMENT ON COLUMN public.user_profiles.is_admin IS '是否为管理员用户';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin 
ON public.user_profiles(is_admin) 
WHERE is_admin = true;
```

6. 点击 "Run" 执行

#### 方式二：使用迁移脚本文件

如果你有数据库的直接访问权限：

```bash
psql -h your-db-host -U your-username -d your-database -f scripts/add_is_admin_to_user_profiles.sql
```

### 2. 设置管理员用户

执行完迁移后，需要将特定用户设置为管理员。

#### 查找用户 ID

```sql
-- 查看所有用户
SELECT id, username, display_name, email 
FROM public.user_profiles;
```

#### 设置管理员

**方式 A: 根据用户名设置**

```sql
UPDATE public.user_profiles 
SET is_admin = true 
WHERE username = 'your_username';
```

**方式 B: 根据用户 ID 设置**

```sql
UPDATE public.user_profiles 
SET is_admin = true 
WHERE id = 'your-user-id-uuid-here';
```

**方式 C: 批量设置多个管理员**

```sql
UPDATE public.user_profiles 
SET is_admin = true 
WHERE username IN ('admin', 'user1', 'user2');
```

### 3. 验证设置

检查哪些用户是管理员：

```sql
SELECT id, username, display_name, is_admin 
FROM public.user_profiles 
WHERE is_admin = true;
```

预期输出示例：
```
                  id                  | username | display_name | is_admin 
--------------------------------------+----------+--------------+----------
 123e4567-e89b-12d3-a456-426614174000 | admin    | 管理员       | t
```

## 🎯 功能验证

### 1. 登录管理员账号

使用设置为管理员的账号登录网站。

### 2. 查看菜单

点击页面右上角的用户头像，应该能看到：

```
┌─────────────────────┐
│ 个人中心            │
│ 面试记录            │
│ 写文章              │
│ 面试题管理  [Admin] │  ← 管理员专属
├─────────────────────┤
│ 退出登录            │
└─────────────────────┘
```

**注意**：非管理员用户看不到"面试题管理"选项。

### 3. 访问管理页面

- 点击"面试题管理"进入管理后台
- 或直接访问 `/admin/questions`

### 4. 权限验证

**管理员用户**：
- ✅ 可以看到"面试题管理"菜单项
- ✅ 可以访问 `/admin/questions` 页面
- ✅ 可以上传和导入 CSV 文件

**普通用户**：
- ❌ 看不到"面试题管理"菜单项
- ❌ 访问 `/admin/questions` 会看到"无权访问"提示
- 🔄 自动提供返回按钮

## 🔐 安全建议

### 1. 谨慎授予管理员权限

管理员可以：
- 批量导入面试题
- 访问管理后台功能
- 未来可能有更多管理权限

**建议**：
- 只给可信任的用户授予管理员权限
- 定期审查管理员列表
- 记录管理员操作日志（未来实现）

### 2. 定期检查管理员列表

```sql
-- 查看所有管理员及其最后活动时间
SELECT 
  up.id,
  up.username,
  up.display_name,
  up.is_admin,
  up.updated_at
FROM public.user_profiles up
WHERE up.is_admin = true
ORDER BY up.updated_at DESC;
```

### 3. 撤销管理员权限

如果需要移除某个用户的管理员权限：

```sql
UPDATE public.user_profiles 
SET is_admin = false 
WHERE username = 'username_to_revoke';
```

## 🛠️ 故障排除

### 问题 1: 设置了管理员但菜单没显示

**解决方案**：
1. 退出登录
2. 清除浏览器缓存
3. 重新登录
4. 检查数据库中 `is_admin` 是否为 `true`

```sql
SELECT username, is_admin 
FROM user_profiles 
WHERE username = 'your_username';
```

### 问题 2: 提示"无权访问"

**可能原因**：
- 用户的 `is_admin` 字段不是 `true`
- 浏览器缓存了旧的用户信息
- 数据库字段未正确设置

**解决方案**：
1. 检查数据库
   ```sql
   SELECT * FROM user_profiles WHERE id = 'your-user-id';
   ```

2. 确认 `is_admin` 为 `true`
3. 清除浏览器缓存或使用无痕模式
4. 重新登录

### 问题 3: SQL 执行失败

**错误**: `column "is_admin" already exists`

**原因**：字段已经存在

**解决方案**：这是正常的，说明字段已添加，可以忽略此错误。

### 问题 4: 类型错误

如果前端出现 TypeScript 类型错误：

1. 重新生成类型定义（如果使用 Supabase CLI）：
   ```bash
   supabase gen types typescript --project-id your-project-id > types/database.types.ts
   ```

2. 或者手动检查 `types/database.types.ts` 和 `types/user.ts` 是否包含 `is_admin` 字段

## 📊 管理员功能概览

### 当前功能

✅ **面试题批量导入**
- CSV 文件上传
- 数据预览
- 批量导入到指定题集
- 详细的错误日志

### 未来规划

🔜 **用户管理**
- 查看所有用户
- 编辑用户信息
- 管理 VIP 等级

🔜 **内容管理**
- 管理文章
- 管理评论
- 内容审核

🔜 **数据统计**
- 用户活跃度
- 内容统计
- 访问分析

## 📝 相关文件

```
blog-fe/
├── scripts/
│   └── add_is_admin_to_user_profiles.sql  # 数据库迁移脚本
├── types/
│   ├── database.types.ts                   # 数据库类型（包含 is_admin）
│   └── user.ts                            # 用户类型（包含 is_admin）
├── store/
│   └── userStore.ts                       # 用户状态管理（添加了 useIsAdmin）
├── components/
│   └── UserAvatar.tsx                     # 用户菜单（管理员入口）
├── app/
│   └── admin/
│       ├── layout.tsx                     # 管理后台布局
│       └── questions/
│           ├── page.tsx                   # 面试题管理页面
│           └── loading.tsx                # 加载状态
└── docs/
    └── ADMIN_SETUP_GUIDE.md              # 本文档
```

## 🎓 最佳实践

### 1. 初始管理员设置

在项目部署后，第一件事应该是设置初始管理员：

```sql
-- 设置第一个管理员
UPDATE public.user_profiles 
SET is_admin = true 
WHERE username = 'your_first_admin';
```

### 2. 管理员账号命名

建议使用明确的命名方式：
- `admin` - 主管理员
- `admin_content` - 内容管理员
- `admin_user` - 用户管理员

### 3. 定期审计

每月执行一次审计：

```sql
-- 管理员审计报告
SELECT 
  username,
  display_name,
  is_admin,
  created_at,
  updated_at,
  vip_level
FROM user_profiles 
WHERE is_admin = true
ORDER BY created_at DESC;
```

### 4. 备份管理员列表

定期备份管理员列表：

```bash
# 导出管理员列表
psql -h your-host -U your-user -d your-db \
  -c "COPY (SELECT * FROM user_profiles WHERE is_admin = true) TO STDOUT CSV HEADER" \
  > admin_backup_$(date +%Y%m%d).csv
```

## 🔄 更新说明

### v1.0.0 (当前版本)

- ✅ 添加 `is_admin` 字段
- ✅ 用户菜单显示管理员入口
- ✅ 面试题管理页面权限控制
- ✅ 友好的无权限提示页面

### 未来版本

- [ ] Row Level Security (RLS) 策略
- [ ] 管理员操作日志
- [ ] 更细粒度的权限控制
- [ ] 角色管理系统

## 📞 获取帮助

如果在设置过程中遇到问题：

1. 检查本文档的"故障排除"部分
2. 查看浏览器控制台的错误信息
3. 检查数据库日志
4. 确认 Supabase 连接正常

---

**提示**: 管理员权限非常重要，请务必妥善管理和保护管理员账号。

