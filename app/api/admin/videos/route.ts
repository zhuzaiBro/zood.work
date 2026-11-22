import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin/requireAdmin';
import { videoApiUrl } from '@/lib/videoApi';
import { platformServer, serverAccessToken } from '@/lib/platform/server';
import type { Database } from '@/types/database.types';

type VideoRow = Database['public']['Tables']['videos']['Row'];

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function serializeVideo(video: VideoRow) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    duration: video.duration,
    status: video.status,
    createdAt: video.created_at,
    updatedAt: video.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminRequest();
  if ('response' in auth) return auth.response;

  const page = positiveInteger(request.nextUrl.searchParams.get('page'), 1);
  const pageSize = Math.min(
    positiveInteger(request.nextUrl.searchParams.get('pageSize'), 10),
    100,
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const data = await platformServer<{ videos: VideoRow[] }>('/api/platform/admin/videos');
    const videos = data.videos ?? [];
    const slice = videos.slice(from, to + 1);
    return NextResponse.json({
      items: slice.map((video) => serializeVideo(video)),
      total: videos.length,
      page,
      pageSize,
      source: 'platform-api',
    });
  } catch (error) {
    console.warn('平台视频列表查询失败，回退视频服务:', error);
  }

  const token = await serverAccessToken();
  const fallbackUrl = videoApiUrl(
    `/api/videos?page=${page}&pageSize=${pageSize}`,
  );
  const fallback = await fetch(fallbackUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });
  const body = await fallback.json().catch(() => ({}));

  if (!fallback.ok) {
    return NextResponse.json(
      { error: (body as { error?: string }).error || '获取视频列表失败' },
      { status: fallback.status || 500 },
    );
  }

  return NextResponse.json({ ...body, source: 'video-api-fallback' });
}
