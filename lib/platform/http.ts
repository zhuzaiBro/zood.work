export class PlatformError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function platformBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL ||
    process.env.PLATFORM_API_BASE_URL ||
    'https://video-api.zood.work'
  ).replace(/\/$/, '')
}

type PlatformOptions = {
  method?: string
  body?: unknown
  token?: string | null
  cache?: RequestCache
  headers?: HeadersInit
}

const blockedHeaders = new Set(['authorization', 'cookie', 'host'])

export function platformHeaders(options: PlatformOptions) {
  const headers = new Headers({ Accept: 'application/json' })
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }
  const extra = new Headers(options.headers)
  extra.forEach((value, key) => {
    if (blockedHeaders.has(key.toLowerCase())) return
    headers.set(key, value)
  })
  return headers
}

export async function platformRequest<T = any>(path: string, options: PlatformOptions = {}): Promise<T> {
  const headers = platformHeaders(options)

  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }
  if (options.token || options.cache === 'no-store') {
    requestInit.cache = 'no-store'
  } else if (options.cache) {
    requestInit.cache = options.cache
  } else {
    requestInit.next = { revalidate: 60 }
  }

  const response = await fetch(`${platformBaseUrl()}${path}`, requestInit)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new PlatformError(response.status, payload.error || '请求失败', payload.code)
  }
  return payload as T
}
