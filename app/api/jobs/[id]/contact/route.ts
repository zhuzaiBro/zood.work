import { NextRequest } from 'next/server';
import { proxyPlatform } from '@/lib/platform/proxy';

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const mode = request.nextUrl.searchParams.get('mode');
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  return proxyPlatform(request, `/api/platform/jobs/${id}/contact${query}`);
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  return proxyPlatform(request, `/api/platform/jobs/${id}/contact`);
}
