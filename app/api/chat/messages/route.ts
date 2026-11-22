import { NextRequest } from 'next/server';
import { proxyPlatform } from '@/lib/platform/proxy';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return proxyPlatform(request, '/api/platform/messages');
}
