import { NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin/requireAdmin';
import { videoApiUrl } from '@/lib/videoApi';
import { serverAccessToken } from '@/lib/platform/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const auth = await requireAdminRequest();
  if ('response' in auth) return auth.response;

  const { videoId } = await params;
  const token = await serverAccessToken();
  const fallback = await fetch(videoApiUrl(`/api/videos/${videoId}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });
  const body = await fallback.json().catch(() => ({}));

  if (!fallback.ok) {
    return NextResponse.json(
      { error: (body as { error?: string }).error || '视频不存在' },
      { status: fallback.status || 404 },
    );
  }

  return NextResponse.json(body);
}
