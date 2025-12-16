import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 添加环境变量检查和详细日志
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase 环境变量缺失:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl,
    })
    throw new Error('Supabase 环境变量未配置')
  }

  console.log('创建 Supabase 客户端:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
  })

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

