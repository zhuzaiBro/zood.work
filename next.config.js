/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 启用 standalone 输出模式以支持 Docker
  output: "standalone",
  // qiniu 通过 urllib 可选加载 proxy-agent。Turbopack 会把这个可选 require
  // 当成构建错误，而 Vercel 的 Next.js 16 默认使用 Turbopack。
  serverExternalPackages: ["qiniu", "urllib"],
  // 增加 body 大小限制（用于文件上传）
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "blog-1309397063.cos.ap-shanghai.myqcloud.com",
      },
      {
        protocol: "https",
        hostname: "*.cos.ap-shanghai.myqcloud.com",
      },
      {
        protocol: "https",
        hostname: "t6opae36u.hd-bkt.clouddn.com",
      }
    ],
  },
};

module.exports = nextConfig;
