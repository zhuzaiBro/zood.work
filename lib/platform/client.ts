import { readBrowserToken } from '@/lib/auth/session'
import { platformRequest } from '@/lib/platform/http'

export { platformBaseUrl, platformRequest, PlatformError } from '@/lib/platform/http'

type PlatformOptions = {
  method?: string
  body?: unknown
  token?: string | null
  cache?: RequestCache
}

export function browserAccessToken() {
  return readBrowserToken()
}

export async function platformBrowser<T = any>(path: string, options: Omit<PlatformOptions, 'token'> = {}) {
  return platformRequest<T>(path, { ...options, token: browserAccessToken() })
}

export async function platformPublic<T = any>(path: string, options: Omit<PlatformOptions, 'token'> = {}) {
  return platformRequest<T>(path, options)
}
