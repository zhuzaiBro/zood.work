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
        hostname: "t6opae36u.hd-bkt.clouddn.com",
      }
    ],
  },
};

module.exports = nextConfig;
