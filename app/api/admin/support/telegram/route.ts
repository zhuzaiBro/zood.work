import { NextRequest, NextResponse } from 'next/server'
import { proxyPlatform } from '@/lib/platform/proxy'

export async function GET(request: NextRequest) {
  return proxyPlatform(request, '/api/platform/admin/support/telegram')
}

export async function PUT(request: NextRequest) {
  if (request.headers.get('x-zood-request') !== 'support-config') {
    return NextResponse.json({ error: '请求来源未通过校验', code: 'CSRF_REJECTED' }, { status: 403 })
  }
  return proxyPlatform(request, '/api/platform/admin/support/telegram')
}
