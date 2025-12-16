# ====== 基础镜像 ======
FROM node:20-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat python3 make g++
# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# ====== 依赖安装阶段 ======
FROM base AS deps

# 复制 package files
COPY package.json package-lock.json* ./

# 安装依赖 (包括 devDependencies，构建时需要)
RUN pnpm i

# ====== 构建阶段 ======
FROM base AS builder

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 复制 .env 文件（如果存在）- Next.js 会自动读取
# 注意：确保 .env 文件在构建前已经创建
COPY .env* ./

# 设置构建时环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用（Next.js 会自动读取 .env 文件）
RUN pnpm run build

# ====== 运行时阶段 ======
FROM base AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 创建运行用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制公共资源
COPY --from=builder /app/public ./public

# 设置正确的权限为预渲染的缓存
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 复制构建产物
# 如果使用 standalone 输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 安装 PM2（在复制文件之前）
RUN npm install -g pm2


# 复制启动配置文件并设置权限
COPY --chown=nextjs:nodejs docker/pm2.json ./pm2.json
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh

# 设置启动脚本的执行权限
RUN chmod +x ./entrypoint.sh

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置入口点 - 使用绝对路径
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]