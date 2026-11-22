import { NextRequest } from 'next/server';
import { proxyPlatform } from '@/lib/platform/proxy';

export async function POST(request: NextRequest) {
  return proxyPlatform(request, '/api/platform/membership-consultations');
}
