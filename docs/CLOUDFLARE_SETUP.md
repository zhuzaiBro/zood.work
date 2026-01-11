# Cloudflare Stream 配置指南

本指南详细说明如何获取 Cloudflare Stream 所需的两个参数：`CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`。

## 需要获取的参数

1. **CLOUDFLARE_ACCOUNT_ID** - Cloudflare 账户 ID
2. **CLOUDFLARE_API_TOKEN** - Cloudflare API Token（需要 Stream:Edit 权限）

---

## 步骤 1：获取 Account ID（账户 ID）

### ⚠️ 重要提示

Account ID 必须与你的 API Token 关联的账户匹配。如果 Account ID 不正确，Stream API 调用会失败。

### 方法一：通过 API 获取（推荐）

使用你的 API Token 获取所有可用的 Account ID：

```bash
curl "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

响应中会列出所有账户，每个账户都有 `id` 字段，这就是 Account ID。

### 方法二：从 Cloudflare Dashboard 获取

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择任意一个域名
3. 在右侧边栏的 **API** 部分可以看到 Account ID
4. 点击复制按钮复制

### 方法三：从 Dashboard 首页获取

1. 登录 Cloudflare Dashboard
2. 在右侧边栏找到 **Account ID**
3. 点击复制按钮复制 Account ID

### 方法四：从 Stream 页面获取

1. 登录 Cloudflare Dashboard
2. 点击左侧菜单的 **Stream**（如果没有看到，可能需要先启用 Stream 服务）
3. 在 Stream 页面的右上角或设置中可以看到 Account ID

### 验证 Account ID

运行测试脚本验证配置是否正确：

```bash
node scripts/test-cloudflare-config.js
```

这个脚本会：
- 验证 API Token
- 列出所有可用的 Account ID
- 测试 Stream API 是否正常工作
- 测试创建上传会话是否成功

---

## 步骤 2：创建 API Token

### 详细步骤

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com/
   - 使用你的账户登录

2. **进入 API Tokens 页面**
   - 点击右上角的用户头像
   - 选择 **My Profile**（我的资料）
   - 在左侧菜单中点击 **API Tokens**

3. **创建新的 API Token**
   - 点击 **Create Token**（创建令牌）按钮
   - 或者点击 **Create Custom Token**（创建自定义令牌）

4. **配置 Token 权限**
   
   选择以下权限：
   - **Account** → **Cloudflare Stream** → **Edit**（编辑）
   
   或者使用预设模板：
   - 点击 **Get started** 旁边的 **Use template**（使用模板）
   - 搜索 "Stream" 并选择 **Stream:Edit** 模板

5. **设置 Account Resources（账户资源）**
   - 选择 **Include**（包含）
   - 选择你的账户（Account）

6. **设置 Zone Resources（域名资源）**
   - 通常不需要设置，除非有特殊需求
   - 可以保持默认或选择 **Include** → **All zones**（所有域名）

7. **设置 Client IP Address Filtering（客户端 IP 地址过滤）**
   - 可选：如果需要限制 IP，可以设置
   - 通常不需要设置，留空即可

8. **设置 TTL（生存时间）**
   - 可选：设置 Token 的过期时间
   - 建议：对于生产环境，设置合理的过期时间
   - 开发环境可以设置为 "Never expire"（永不过期）

9. **创建 Token**
   - 点击 **Continue to summary**（继续到摘要）
   - 检查配置是否正确
   - 点击 **Create Token**（创建令牌）

10. **复制 Token**
    - ⚠️ **重要**：Token 只会显示一次，请立即复制并妥善保存
    - 如果丢失，需要重新创建新的 Token
    - 将 Token 保存到安全的地方（如密码管理器）

---

## 步骤 3：配置环境变量

在项目的 `.env.local` 文件中添加以下配置：

```env
# Cloudflare Stream 配置
CLOUDFLARE_ACCOUNT_ID=你的账户ID
CLOUDFLARE_API_TOKEN=你的API_Token
```

### 示例

```env
CLOUDFLARE_ACCOUNT_ID=1234567890abcdef1234567890abcdef
CLOUDFLARE_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmtzZG53dndtbW12cW94enlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI1NjcxNSwiZXhwIjoyMDczODMyNzE1fQ.GaQBgf4HDuU5x_BiVqM6MCKtFPTWG8b2XNHYZlM-no8
```

---

## 步骤 4：验证配置

### 方法一：检查环境变量

重启开发服务器后，尝试上传视频，如果配置正确，应该能够：
- 成功创建上传会话
- 成功上传视频到 Cloudflare Stream

### 方法二：测试 API Token

可以使用 curl 命令测试 API Token 是否有效：

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/stream" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

如果返回 200 状态码和视频列表，说明配置正确。

---

## 常见问题

### Q1: 找不到 Stream 服务？

**A:** Stream 是 Cloudflare 的付费服务，需要：
1. 确保你的账户已启用 Stream
2. 如果没有，需要先订阅 Stream 服务
3. 访问 https://dash.cloudflare.com/ 查看是否有 Stream 选项

### Q2: API Token 权限不足？

**A:** 确保 Token 有以下权限：
- **Account** → **Cloudflare Stream** → **Edit**

如果只有 Read 权限，无法创建上传会话。

### Q3: Token 创建后找不到？

**A:** API Token 创建后只会显示一次。如果丢失：
1. 需要删除旧的 Token
2. 重新创建新的 Token
3. 更新 `.env.local` 文件中的 `CLOUDFLARE_API_TOKEN`

### Q4: Account ID 格式是什么？

**A:** Account ID 通常是 32 位的十六进制字符串，例如：
- `1234567890abcdef1234567890abcdef`
- 长度：32 个字符
- 格式：小写字母和数字

### Q5: API Token 格式是什么？

**A:** API Token 是 JWT 格式的字符串，例如：
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- 长度：通常很长（几百个字符）
- 格式：Base64 编码的 JWT

---

## 安全建议

1. **不要将 Token 提交到 Git**
   - 确保 `.env.local` 在 `.gitignore` 中
   - 不要将 Token 分享给他人

2. **定期轮换 Token**
   - 建议每 3-6 个月更换一次 Token
   - 删除不再使用的旧 Token

3. **限制 Token 权限**
   - 只授予必要的权限（Stream:Edit）
   - 不要授予过宽的权限

4. **使用环境变量**
   - 生产环境使用环境变量或密钥管理服务
   - 不要在代码中硬编码 Token

---

## 相关链接

- [Cloudflare Stream 文档](https://developers.cloudflare.com/stream/)
- [Cloudflare API Tokens 文档](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Direct Creator Upload 文档](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/)
