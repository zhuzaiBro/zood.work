import { NextRequest } from 'next/server';
import { proxyPlatform } from '@/lib/platform/proxy';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') || 'published';
  const scope = status === 'all' ? '&scope=admin' : '';
  return proxyPlatform(request, `/api/platform/courses?status=${encodeURIComponent(status)}${scope}`);
}
