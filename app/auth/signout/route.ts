import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // 获取重定向的基础 URL
  // 优先使用环境变量 NEXT_PUBLIC_SITE_URL (需要在部署平台配置)
  // 如果没有配置，则回退到 request.url 的 origin (本地开发通常没问题)
  // 针对您提到的生产环境域名问题，建议在生产环境配置 NEXT_PUBLIC_SITE_URL=https://blog.wcsjfmsl.cn
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  
  return NextResponse.redirect(`${siteUrl}/`)
}

