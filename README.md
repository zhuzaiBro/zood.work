# 博客系统前端

一个基于 Next.js 15 和 Supabase 构建的现代博客系统。

## 功能特性

- ✨ 现代化的 UI 设计
- 📝 文章发布和浏览
- 💬 评论系统（支持回复）
- 🏷️ 文章分类
- 👤 用户认证和个人资料管理
- 🔗 **Web3 钱包登录**（MetaMask、WalletConnect、Coinbase Wallet）
- 🌓 深色模式支持
- 📱 响应式设计

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth (含 Web3 原生支持)
- **样式**: Tailwind CSS
- **Markdown**: react-markdown + remark-gfm
- **Web3**: Supabase 原生 Web3 认证（无需额外依赖）

## 数据库结构

- `user_profiles`: 用户资料
- `posts`: 博客文章
- `post_cates`: 文章分类
- `post_cate_relations`: 文章-分类关联
- `post_comments`: 文章评论

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件（参考 `.env.local.example`）：

```
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥

# Web3 配置（可选）
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的WalletConnect项目ID
```

**获取 WalletConnect Project ID**: 访问 [WalletConnect Cloud](https://cloud.walletconnect.com) 创建项目并获取 ID。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
blog-fe/
├── app/                      # Next.js App Router 页面
│   ├── auth/                # 认证相关路由
│   ├── categories/          # 分类页面
│   ├── login/              # 登录页面
│   ├── posts/              # 文章详情页面
│   ├── profile/            # 个人资料页面
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   └── globals.css         # 全局样式
├── components/              # React 组件
│   ├── CommentForm.tsx     # 评论表单
│   ├── CommentList.tsx     # 评论列表
│   ├── CommentSection.tsx  # 评论区
│   ├── Footer.tsx          # 页脚
│   ├── Header.tsx          # 页眉
│   ├── LoginForm.tsx       # 登录表单
│   ├── PostCard.tsx        # 文章卡片
│   └── ProfileForm.tsx     # 个人资料表单
├── lib/                     # 工具库
│   ├── supabase/           # Supabase 客户端
│   │   ├── client.ts       # 浏览器客户端
│   │   ├── server.ts       # 服务器客户端
│   │   └── middleware.ts   # 中间件
│   └── utils.ts            # 工具函数
├── types/                   # TypeScript 类型定义
│   └── database.types.ts   # 数据库类型
├── middleware.ts            # Next.js 中间件
├── next.config.js          # Next.js 配置
├── tailwind.config.ts      # Tailwind CSS 配置
└── package.json            # 项目依赖
```

## 主要页面

- **首页** (`/`): 展示最新的博客文章列表
- **文章详情** (`/posts/[slug]`): 显示文章内容和评论
- **分类列表** (`/categories`): 展示所有分类
- **分类详情** (`/categories/[slug]`): 显示特定分类下的文章
- **登录/注册** (`/login`): 用户认证
- **个人中心** (`/profile`): 管理个人资料

## 注意事项

1. 确保你的 Supabase 项目已经创建了必要的数据表
2. 需要在 Supabase 中配置 Email 认证
3. 建议配置 RLS (Row Level Security) 策略以保护数据
4. 可以根据需要调整 `revalidate` 时间来控制缓存策略

## Web3 钱包登录

本项目已集成 **Supabase 官方 `signInWithWeb3` API**！支持：

- 🦊 MetaMask 和其他浏览器钱包
- 🔗 WalletConnect（200+ 钱包）
- 💰 Coinbase Wallet

✨ **特性**：
- ✅ 自动生成 SIWE (Sign-In with Ethereum) 消息
- ✅ 服务端自动验证签名
- ✅ 安全的会话管理
- ✅ 支持所有 EVM 兼容链

详细配置和使用说明请查看 [WEB3_SETUP.md](./WEB3_SETUP.md)

### 快速开始 Web3 登录

```typescript
// 简单的一行代码，Supabase 自动处理所有验证
const { data, error } = await supabase.auth.signInWithWeb3({
  chain: 'ethereum',
  statement: '登录到zood的小破站',
})
```

1. 安装依赖（已包含在 package.json 中）
2. 访问登录页面，选择"钱包登录"标签
3. 连接你的钱包并签名消息
4. Supabase 自动验证并创建会话
5. 完成登录！

## 后续开发建议

- [ ] 添加文章搜索功能
- [ ] 添加文章编辑器（支持 Markdown）
- [ ] 添加图片上传功能
- [ ] 添加点赞功能
- [ ] 添加文章草稿功能
- [ ] 添加标签系统
- [ ] NFT 头像集成
- [ ] ENS 域名支持
- [ ] SEO 优化
- [ ] 性能优化（图片懒加载等）

## License

MIT

