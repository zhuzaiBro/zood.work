import { NextRequest } from 'next/server';
import { proxyPlatform } from '@/lib/platform/proxy';

export async function GET(request: NextRequest) {
  return proxyPlatform(request, '/api/platform/admin/consultations');
}

export async function PATCH(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}));
  const id = body.id ?? body.requestId;
  return proxyPlatform(request, `/api/platform/admin/consultations/${id}`);
}
