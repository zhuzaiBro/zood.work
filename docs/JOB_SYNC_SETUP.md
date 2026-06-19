# 岗位同步（DeJob → Supabase）

每 3 小时从 DeJob 拉取最新岗位列表，对**未落库**的岗位拉详情并写入数据库。表结构支持后续接入更多来源平台。

## 文件清单

| 文件 | 说明 |
|------|------|
| `.sql/setup_job_sync.sql` | 建表、索引、RLS、dejob 来源初始化、pg_cron 模板 |
| `supabase/functions/sync-dejob-jobs/index.ts` | Edge Function 同步逻辑 |

## 数据表

### `job_sources`
来源平台注册表。`slug = 'dejob'` 为 DeJob；后续新增平台只需插入一行并写对应同步函数（或扩展 adapter）。

### `job_listings`
岗位主表。唯一键：`(source_id, external_id)`。列表接口字段较简略，**以详情接口为准**落库（含 email / telegram 等联系方式）。

### `job_sync_runs`
每次同步的执行日志（拉取数、新增数、跳过数、失败数）。

## 部署步骤

### 1. 执行 SQL

Supabase Dashboard → **SQL Editor** → 粘贴并运行：

```
.sql/setup_job_sync.sql
```

### 2. 部署 Edge Function

```bash
# 安装 CLI（如未安装）
npm i -g supabase

# 登录并关联项目
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# 部署函数（关闭 JWT 校验，改用 x-cron-secret）
supabase functions deploy sync-dejob-jobs --no-verify-jwt
```

### 3. 配置 Secrets

Dashboard → **Edge Functions** → `sync-dejob-jobs` → **Secrets**：

| Secret | 说明 |
|--------|------|
| `CRON_SECRET` | 随机字符串，pg_cron / 手动 curl 时放在 `x-cron-secret` 头 |
| `DEJOB_USER_TOKEN` | DeJob 的 `X-User-Token`（**不要提交到 Git**） |

> `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 在 Edge Function 环境通常已自动注入，无需手动设置。

### 4. 手动测试

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-dejob-jobs' \
  -H 'Content-Type: application/json' \
  -H 'x-cron-secret: YOUR_CRON_SECRET'
```

成功响应示例：

```json
{
  "ok": true,
  "run_id": "...",
  "jobs_fetched": 20,
  "jobs_created": 5,
  "jobs_skipped": 15,
  "jobs_failed": 0
}
```

### 5. 配置 pg_cron（每 3 小时）

在 SQL Editor 执行（替换占位符）：

```sql
SELECT cron.schedule(
  'sync-dejob-jobs-every-3h',
  '0 */3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-dejob-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

查看已注册任务：

```sql
SELECT * FROM cron.job;
```

取消任务：

```sql
SELECT cron.unschedule('sync-dejob-jobs-every-3h');
```

## 同步逻辑说明

1. 读取 `job_sources` 中 `slug = dejob` 的配置（page=1, limit=20）
2. 请求 `GET /api/worker/topics?page=1&limit=20`
3. 批量查询 DB 中已存在的 `external_id`
4. 对**不存在**的 id 请求 `GET /api/worker/{id}` 获取详情
5. 插入 `job_listings`，写入 `job_sync_runs` 日志

当前策略：**只新增，不更新**已有岗位。若后续需要更新已存在岗位，可在 Edge Function 中改为 upsert。

## 前端读取示例

```ts
const { data } = await supabase
  .from('job_listings')
  .select(`
    id,
    title,
    company_name,
    company_logo,
    base_location,
    min_salary,
    max_salary,
    source_url,
    source_created_at,
    job_sources ( slug, name )
  `)
  .order('source_created_at', { ascending: false })
  .limit(20);
```

## 扩展第二个来源

1. 在 `job_sources` 插入新平台记录
2. 新建 Edge Function（如 `sync-xxx-jobs`）或抽象 adapter
3. 映射字段写入同一张 `job_listings` 表
4. 单独注册 pg_cron 任务

## 类型生成

部署后可在项目根目录重新生成 TypeScript 类型：

```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.types.ts
```
