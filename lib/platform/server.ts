import { createClient } from '@/lib/supabase/server'
import { platformRequest, PlatformError } from '@/lib/platform/client'

export { platformRequest, PlatformError }

export async function serverAccessToken() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function platformServer<T = any>(
  path: string,
  options: { method?: string; body?: unknown; cache?: RequestCache } = {},
) {
  return platformRequest<T>(path, { ...options, token: await serverAccessToken() })
}
