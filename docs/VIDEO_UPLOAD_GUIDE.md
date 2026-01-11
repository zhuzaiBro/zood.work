# 课程视频上传指南

本指南介绍如何使用 Cloudflare Stream 上传课程视频。

## 前置准备

### 1. 创建 Supabase 数据表

在 Supabase 控制台的 SQL Editor 中执行 `.sql/create_courses_tables.sql` 文件中的 SQL 脚本，创建以下表：

- `courses` - 课程表
- `chapters` - 章节表
- `lessons` - 课程视频表

### 2. 配置 Cloudflare Stream

详细步骤请参考 [Cloudflare Stream 配置指南](./CLOUDFLARE_SETUP.md)

快速步骤：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 获取 Account ID（在 Dashboard 右侧边栏或 Stream 页面）
3. 创建 API Token（My Profile → API Tokens → Create Token）
   - 权限：Account → Cloudflare Stream → Edit
4. 将获取的信息添加到 `.env.local` 文件中

### 3. 配置环境变量

在 `.env.local` 文件中添加以下环境变量：

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## 使用步骤

### 1. 访问视频管理页面

访问 `/admin/videoManage` 页面（需要管理员权限）

### 2. 创建课程

1. 在"创建课程"区域填写课程标题和描述
2. 点击"创建课程"按钮
3. 创建成功后，课程会自动出现在"选择课程"下拉框中

### 3. 创建章节

1. 从"选择课程"下拉框中选择一个课程
2. 在"创建章节"区域填写章节标题
3. 点击"创建章节"按钮
4. 创建成功后，章节会出现在章节列表中

### 4. 上传视频

1. 选择一个章节（点击章节卡片）
2. 填写课程标题和描述
3. 选择视频文件（支持 MP4, MOV, AVI 等格式）
4. 设置排序号和是否免费
5. 点击"上传视频"按钮
6. 等待上传完成（会显示进度条）

## 功能特性

- ✅ 自动上传到 Cloudflare Stream
- ✅ 自动转换为 HLS 格式（M3U8）
- ✅ 自动生成播放链接和缩略图
- ✅ 支持免费/付费课程设置
- ✅ 支持课程排序
- ✅ 管理员权限验证
- ✅ 上传进度显示

## API 接口

### POST /api/upload/video

上传视频到 Cloudflare Stream

**请求格式：**
- Content-Type: `multipart/form-data`
- 参数：
  - `file`: 视频文件（必需）
  - `title`: 视频标题（可选）
  - `meta`: JSON 格式的元数据（可选）

**响应格式：**
```json
{
  "success": true,
  "video": {
    "id": "video_id",
    "url": "https://customer-xxx.cloudflarestream.com/video_id/manifest/video.m3u8",
    "thumbnail": "thumbnail_url",
    "duration": 120,
    "status": "ready",
    "meta": {}
  }
}
```

### GET /api/upload/video?videoId=xxx

获取视频信息

**响应格式：**
```json
{
  "success": true,
  "video": {
    "id": "video_id",
    "status": "ready",
    "duration": 120,
    ...
  }
}
```

## 注意事项

1. **文件大小限制**：Cloudflare Stream 支持最大 5GB 的视频文件
2. **视频格式**：支持常见视频格式，推荐使用 MP4
3. **处理时间**：视频上传后需要一定时间进行转码，转码完成后才能播放
4. **权限要求**：只有管理员可以上传视频
5. **环境变量**：确保在生产环境中正确配置 Cloudflare 凭证

## 故障排查

### 上传失败

1. 检查环境变量是否正确配置
2. 检查 Cloudflare API Token 是否有 Stream:Edit 权限
3. 检查视频文件格式是否支持
4. 查看浏览器控制台和服务器日志

### 视频无法播放

1. 检查视频是否已完成转码（status 应为 "ready"）
2. 检查视频 URL 是否正确
3. 检查网络连接和 CORS 设置

## 参考资料

- [Cloudflare Stream 文档](https://developers.cloudflare.com/stream/)
- [Supabase 文档](https://supabase.com/docs)
