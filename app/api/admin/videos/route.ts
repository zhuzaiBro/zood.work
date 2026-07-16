import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/admin/requireAdmin';
import { videoApiUrl } from '@/lib/videoApi';
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

  const adminClient = createAdminClient();
  const { data, error, count } = await adminClient
    .from('videos')
    .select(
      'id, title, description, duration, status, created_at, updated_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (!error) {
    return NextResponse.json({
      items: (data ?? []).map((video) => serializeVideo(video as VideoRow)),
      total: count ?? 0,
      page,
      pageSize,
      source: 'supabase-database',
    });
  }

  console.warn('Supabase 视频列表查询失败，回退视频服务:', error.message);
  const {
    data: { session },
  } = await auth.supabase.auth.getSession();
  const fallbackUrl = videoApiUrl(
    `/api/videos?page=${page}&pageSize=${pageSize}`,
  );
  const fallback = await fetch(fallbackUrl, {
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined,
    cache: 'no-store',
  });
  const body = await fallback.json().catch(() => ({}));

  if (!fallback.ok) {
    return NextResponse.json(
      { error: (body as { error?: string }).error || error.message },
      { status: fallback.status || 500 },
    );
  }

  return NextResponse.json({ ...body, source: 'video-api-fallback' });
}
