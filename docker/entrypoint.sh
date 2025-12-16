#!/bin/bash

set -e

echo "🚀 Starting Blog FE..."

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED:-1}

# 设置 Next.js 公共环境变量
export NEXT_PUBLIC_DEPLOY_ENV=${DEPLOY_ENV}
export NEXT_PUBLIC_EDITION=${EDITION}
export NEXT_PUBLIC_API_PREFIX=${CONSOLE_API_URL}/console/api
export NEXT_PUBLIC_PUBLIC_API_PREFIX=${APP_API_URL}/api
export NEXT_PUBLIC_SENTRY_DSN=${SENTRY_DSN}
export NEXT_PUBLIC_SITE_ABOUT=${SITE_ABOUT}
export NEXT_PUBLIC_TEXT_GENERATION_TIMEOUT_MS=${TEXT_GENERATION_TIMEOUT_MS}
export NEXT_PUBLIC_CSP_WHITELIST=${CSP_WHITELIST}

echo "Environment variables set"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# 启动应用
if [ -f "./pm2.json" ]; then
    echo "Starting with PM2..."
    pm2 start ./pm2.json --no-daemon
else
    echo "Starting with Node.js directly..."
    exec node server.js
fi 