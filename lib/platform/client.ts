import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { platformRequest } from '@/lib/platform/http'

export { platformBaseUrl, platformRequest, PlatformError } from '@/lib/platform/http'

type PlatformOptions = {
  method?: string
  body?: unknown
  token?: string | null
  cache?: RequestCache
  headers?: HeadersInit
}

export async function browserAccessToken() {
  const supabase = createBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function platformBrowser<T = any>(path: string, options: Omit<PlatformOptions, 'token'> = {}) {
  return platformRequest<T>(path, { ...options, token: await browserAccessToken() })
}

export async function platformPublic<T = any>(path: string, options: Omit<PlatformOptions, 'token'> = {}) {
  return platformRequest<T>(path, options)
}
