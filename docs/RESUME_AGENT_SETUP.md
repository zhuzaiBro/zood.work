# 简历优化 Agent 配置

页面入口：`/resume-agent`

## 通义千问

```env
DASHSCOPE_API_KEY=你的 DashScope API Key
QWEN_MODEL=qwen-plus
```

`QWEN_MODEL` 可选，不配置时默认使用 `qwen-plus`。

## 腾讯云 COS

```env
TENCENT_COS_SECRET_ID=你的 SecretId
TENCENT_COS_SECRET_KEY=你的 SecretKey
TENCENT_COS_BUCKET=your-bucket-1250000000
TENCENT_COS_REGION=ap-shanghai
TENCENT_COS_DOMAIN=https://your-bucket-1250000000.cos.ap-shanghai.myqcloud.com
```

`TENCENT_COS_DOMAIN` 可选。配置后上传 API 会返回可访问的文件 URL；不配置时只返回 COS Key。

## 当前能力

- 支持上传 PDF / TXT 简历到 COS。
- PDF 会在服务端自动抽取文本并填入简历内容。
- Agent 使用 LangChain.js + LangGraph.js + 通义千问生成优化结果。
- Agent 会额外生成一份可打印 HTML 简历。
- 前端支持下载 HTML，以及通过浏览器打印导出 PDF。
