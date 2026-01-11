# 视频上传和课程创建问题排查指南

## 常见问题

### 1. 创建课程时 Supabase 没有反应

#### 可能原因：

**a) 数据库表不存在**
- 错误信息：`courses 表不存在`
- 解决方法：
  1. 打开 Supabase Dashboard
  2. 进入 SQL Editor
  3. 执行 `.sql/create_courses_tables.sql` 文件中的所有 SQL 语句

**b) 用户没有管理员权限**
- 错误信息：`您没有管理员权限，无法创建课程`
- 解决方法：
  1. 在 Supabase SQL Editor 中执行：
  ```sql
  UPDATE user_profiles 
  SET is_admin = true 
  WHERE id = '你的用户ID';
  ```
  2. 或者检查 `user_profiles` 表中你的用户记录，确保 `is_admin` 字段为 `true`

**c) RLS 策略阻止了操作**
- 检查方法：打开浏览器控制台（F12），查看错误信息
- 解决方法：确保已执行 `.sql/create_courses_tables.sql` 中的 RLS 策略

**d) 环境变量未配置**
- 检查 `.env.local` 文件是否包含：
  ```
  NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
  ```

### 2. Cloudflare 视频上传没有反应

#### 可能原因：

**a) Cloudflare 环境变量未配置**
- 检查 `.env.local` 文件是否包含：
  ```
  CLOUDFLARE_ACCOUNT_ID=你的Cloudflare账户ID
  CLOUDFLARE_API_TOKEN=你的Cloudflare API Token
  ```
- 获取方法：
  1. 登录 Cloudflare Dashboard
  2. 进入 Stream 页面
  3. 在 API 设置中创建 API Token（需要 Stream:Edit 权限）

**b) API Token 权限不足**
- 确保 API Token 有以下权限：
  - Account: Cloudflare Stream:Edit
  - Zone: 如果需要的话

**c) 文件太大或格式不支持**
- Cloudflare Stream 支持：
  - 最大文件大小：取决于你的账户限制
  - 支持的格式：MP4, MOV, AVI, MKV 等常见视频格式

**d) 网络问题**
- 检查浏览器控制台（F12）的网络标签页
- 查看是否有上传请求发出
- 检查请求状态码和错误信息

### 3. 调试步骤

#### 步骤 1：检查浏览器控制台
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签页
3. 查看是否有错误信息或日志输出
4. 所有操作都会输出详细日志，包括：
   - 用户权限检查
   - 数据库操作
   - 上传进度

#### 步骤 2：检查网络请求
1. 在开发者工具中切换到 Network 标签页
2. 尝试创建课程或上传视频
3. 查看是否有请求发出
4. 检查请求的状态码和响应内容

#### 步骤 3：检查 Supabase 数据库
1. 打开 Supabase Dashboard
2. 进入 Table Editor
3. 检查以下表是否存在：
   - `courses`
   - `chapters`
   - `lessons`
   - `user_profiles`
4. 检查你的用户记录，确认 `is_admin` 字段

#### 步骤 4：检查环境变量
1. 确认 `.env.local` 文件存在
2. 检查所有必需的环境变量都已配置
3. 重启开发服务器（`bun dev`）

#### 步骤 5：检查 Cloudflare 配置
1. 登录 Cloudflare Dashboard
2. 进入 Stream 页面
3. 检查账户状态和配额
4. 测试 API Token 是否有效

### 4. 快速诊断命令

在浏览器控制台中执行以下代码来诊断问题：

```javascript
// 检查 Supabase 连接
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
console.log('用户:', user);

// 检查管理员权限
const { data: profile } = await supabase
  .from('user_profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single();
console.log('管理员权限:', profile);

// 检查表是否存在
const { error } = await supabase.from('courses').select('id').limit(1);
console.log('courses 表:', error ? '不存在或无权访问' : '存在');
```

### 5. 常见错误代码

- `42P01`: 表不存在
- `42501`: 权限不足（RLS 策略阻止）
- `23505`: 唯一约束冲突
- `23503`: 外键约束失败

### 6. 联系支持

如果以上方法都无法解决问题，请提供以下信息：
1. 浏览器控制台的完整错误日志
2. 网络请求的详细信息（状态码、响应内容）
3. Supabase 数据库表结构截图
4. 环境变量配置（隐藏敏感信息）
