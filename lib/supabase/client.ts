import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase 环境变量缺失:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    // 预渲染发生在服务端。缺少 Preview 环境变量时不能在渲染阶段抛错，
    // 否则 next build 会失败。真正调用认证方法时仍然会失败。
    if (typeof window === 'undefined') {
      return new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
        get() {
          throw new Error('Supabase 环境变量未配置')
        },
      })
    }
    throw new Error('Supabase 环境变量未配置')
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}
