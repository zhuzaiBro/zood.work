import { serverAccessToken } from '@/lib/auth/server'
import { platformRequest, PlatformError } from '@/lib/platform/http'

export { platformRequest, PlatformError, serverAccessToken }

export async function platformServer<T = any>(
  path: string,
  options: { method?: string; body?: unknown; cache?: RequestCache } = {},
) {
  return platformRequest<T>(path, { ...options, token: await serverAccessToken() })
}
