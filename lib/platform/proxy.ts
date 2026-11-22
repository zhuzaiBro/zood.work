import { NextRequest, NextResponse } from 'next/server'
import { platformRequest, platformServer, PlatformError, serverAccessToken } from '@/lib/platform/server'

export async function proxyPlatform(request: NextRequest, path: string) {
  try {
    const token = await serverAccessToken()
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    const body = hasBody ? await request.json().catch(() => ({})) : undefined
    const marker = request.headers.get('x-zood-request')
    const payload = await platformRequest(path, {
      method: request.method,
      body,
      token,
      headers: marker ? { 'X-Zood-Request': marker } : undefined,
    })
    return NextResponse.json(payload)
  } catch (error) {
    return platformErrorResponse(error)
  }
}

export async function platformErrorResponse(error: unknown) {
  if (error instanceof PlatformError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }
  const message = error instanceof Error ? error.message : '服务器错误'
  return NextResponse.json({ error: message }, { status: 500 })
}

export { platformServer }
