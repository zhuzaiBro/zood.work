import { NextRequest } from 'next/server';
import { proxyPlatform } from '@/lib/platform/proxy';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  return proxyPlatform(request, `/api/platform/me/progress${params ? `?${params}` : ''}`);
}

export async function POST(request: NextRequest) {
  return proxyPlatform(request, '/api/platform/me/progress');
}
