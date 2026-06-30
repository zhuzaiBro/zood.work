# Job Sync Worker (Go)

从 DeJob 拉取岗位并通过 GORM 直连 Postgres / Supabase Database 写入，同时提供岗位检索 Agent、MCP 工具服务、Telegram Bot Webhook 和 Discord Bot Interaction Endpoint。

## 目录

```text
workers/job-sync/
  cmd/worker/main.go      # 入口：同步任务、HTTP 路由、机器人入口
  internal/agent/         # Agent 主服务：根据用户输入调用岗位检索/同步能力
  internal/config/        # 环境变量
  internal/dejob/         # DeJob API 客户端与字段映射
  internal/discord/       # Discord slash command interaction
  internal/jobs/          # 岗位检索与统一格式化
  internal/mcp/           # MCP JSON-RPC 工具服务
  internal/store/         # GORM / Postgres 读写
  internal/sync/          # 同步编排
  internal/telegram/      # Telegram webhook
```

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Postgres 连接串，建议使用 Supabase Transaction Pooler 或 Direct Connection |
| `DEJOB_USER_TOKEN` | DeJob `X-User-Token` |
| `RUN_ONCE` | `true` 执行一次退出；`false` 启动 HTTP 服务 |
| `HTTP_ADDR` | HTTP 模式监听地址，默认 `:8080` |
| `CRON_SECRET` | HTTP 模式 `POST /sync` 鉴权头 `x-cron-secret` |
| `JOB_SOURCE_SLUG` | 同步来源，默认 `all`；兼容单来源模式，如 `dejob`、`cake` |
| `JOB_SOURCE_SLUGS` | 多来源列表，如 `dejob,cake`；设置后优先于 `JOB_SOURCE_SLUG` |
| `SITE_BASE_URL` | 岗位结果里兜底展示的网站地址，默认 `https://zood.work` |
| `JOB_SEARCH_PREFIX` | 可选，只响应指定前缀后的关键词，例如 `岗位` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token，配置后启用 `/telegram/webhook` |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook secret token，用于校验 `X-Telegram-Bot-Api-Secret-Token` |
| `TELEGRAM_POLLING_ENABLED` | 是否启用进程内 long polling 托管 Telegram bot，本地/内网推荐 `true` |
| `TELEGRAM_DELETE_WEBHOOK_ON_POLLING` | polling 启动前是否删除 Telegram webhook，默认 `true` |
| `DISCORD_PUBLIC_KEY` | Discord Application Public Key，配置后启用 `/discord/interactions` |
| `DISCORD_COMMAND_NAME` | Discord slash command 名，默认 `jobs` |
| `MCP_AUTH_TOKEN` | 可选，`/mcp` Bearer Token |
| `AGENT_AUTH_TOKEN` | 可选，`/agent/jobs` Bearer Token |

## 本地运行

```bash
cd workers/job-sync
cp .env.example .env
# 编辑 .env
# DATABASE_URL 示例：
# postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require

go mod tidy
go run ./cmd/worker
```

## HTTP 模式

```bash
RUN_ONCE=false go run ./cmd/worker
```

健康检查：

```bash
curl http://localhost:8080/healthz
```

手动同步：

```bash
curl -X POST 'http://localhost:8080/sync' \
  -H 'x-cron-secret: YOUR_CRON_SECRET'
```

## Cake.me 岗位源

先在 Supabase SQL Editor 执行：

```text
.sql/setup_cake_job_source.sql
```

worker 默认支持多来源同步。常用配置：

```bash
# 同步全部 is_active=true 的岗位源
JOB_SOURCE_SLUG=all

# 或只同步指定多个来源
JOB_SOURCE_SLUGS=dejob,cake

# 或只同步 Cake
JOB_SOURCE_SLUG=cake
```

如果你只想临时跑 Cake：

```bash
JOB_SOURCE_SLUG=cake
RUN_ONCE=true
```

执行：

```bash
go run ./cmd/worker
```

Cake 同步逻辑会：

1. 调用 `https://api.cake.me/api/client/v1/jobs/search`
2. 按 `job_sources.sync_config` 里的 `professions/job_types/remote/sort_by/page/per_page` 拉列表
3. 请求每条岗位的 `https://www.cake.me/companies/{company}/jobs/{path}` detail HTML
4. 提取页面里的 `JobPosting JSON-LD`
5. 将 title、company、location、salary、description、requirements、benefits、source_url 等字段写入 `job_listings`

默认配置对应：

```json
{
  "professions": [
    "it_back-end-engineer",
    "it_software-engineer",
    "it_blockchain-platform-engineer"
  ],
  "job_types": ["full_time"],
  "remote": ["full_remote_work"],
  "sort_by": "popularity",
  "page": 1,
  "per_page": 10
}
```

## Agent 主服务

前端页面会通过 Next API 代理调用：

```text
POST /agent/jobs
Authorization: Bearer $AGENT_AUTH_TOKEN
```

请求：

```json
{
  "message": "前端 远程",
  "limit": 5
}
```

如果消息里包含 `同步`、`刷新岗位`、`sync` 等意图，Agent 会调用同步能力；否则调用岗位检索能力。

Next.js 前端需要配置：

```bash
JOB_SYNC_BASE_URL=http://localhost:8080
JOB_SYNC_AGENT_TOKEN=YOUR_AGENT_AUTH_TOKEN
```

如果你想直接指定完整地址，也可以使用：

```bash
JOB_SYNC_AGENT_URL=http://localhost:8080/agent/jobs
```

## MCP 工具服务

MCP HTTP endpoint：

```text
POST /mcp
Authorization: Bearer $MCP_AUTH_TOKEN
```

当前暴露两个工具：

| Tool | 说明 |
|------|------|
| `search_jobs` | 根据关键词检索已同步岗位 |
| `sync_jobs` | 执行一次 DeJob 同步 |

示例：

```bash
curl -X POST http://localhost:8080/mcp \
  -H 'Authorization: Bearer YOUR_MCP_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_jobs","arguments":{"query":"Solidity 远程","limit":5}}}'
```

## Telegram Bot

### 本地托管模式（推荐开发环境）

如果没有公网域名，使用 long polling：

```bash
RUN_ONCE=false
TELEGRAM_POLLING_ENABLED=true
TELEGRAM_DELETE_WEBHOOK_ON_POLLING=true
```

启动 worker 后，进程会自己调用 Telegram `getUpdates` 拉取消息并回复，不需要配置 webhook。

### Webhook 模式（推荐生产环境）

1. 在 BotFather 创建 bot，拿到 `TELEGRAM_BOT_TOKEN`
2. 保持 `TELEGRAM_POLLING_ENABLED=false`
3. 设置 webhook：

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR_DOMAIN/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

用户可以发送：

```text
/jobs 前端 远程
Solidity
产品经理
```

## Discord Bot

在 Discord Developer Portal 的应用里配置：

```text
Interactions Endpoint URL: https://YOUR_DOMAIN/discord/interactions
```

Slash command 建议配置为：

```text
/jobs query:<string>
```

worker 会校验 Discord 的 `X-Signature-Ed25519` 和 `X-Signature-Timestamp`，所以必须正确配置 `DISCORD_PUBLIC_KEY`。

## Docker

```bash
cd workers/job-sync
docker build -t zood-job-sync .
docker run --rm --env-file .env zood-job-sync
```

HTTP 模式：

```bash
docker run --rm --env-file .env -e RUN_ONCE=false -p 8080:8080 zood-job-sync
```

## 同步策略

1. 读取 `job_sources` 中激活的来源配置
2. 拉取 DeJob 列表页
3. 跳过已存在 `external_id`
4. 对新岗位拉详情并插入 `job_listings`
5. 记录 `job_sync_runs`

当前策略：**只新增，不更新**。

## 相关文档

- [docs/JOB_SYNC_SETUP.md](../../docs/JOB_SYNC_SETUP.md)
- [.sql/setup_job_sync.sql](../../.sql/setup_job_sync.sql)
