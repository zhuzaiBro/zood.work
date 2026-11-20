import { NextRequest } from 'next/server';
import { proxyPlatform } from '@/lib/platform/proxy';

export async function GET(request: NextRequest) {
  return proxyPlatform(request, '/api/platform/admin/users/study');
}

export async function POST(request: NextRequest) {
  return proxyPlatform(request, '/api/platform/admin/users/sync-profiles');
}
