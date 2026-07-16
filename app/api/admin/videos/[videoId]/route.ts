import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/admin/requireAdmin';
import { videoApiUrl } from '@/lib/videoApi';
import type { Database } from '@/types/database.types';

type VideoRow = Database['public']['Tables']['videos']['Row'];

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const auth = await requireAdminRequest();
  if ('response' in auth) return auth.response;

  const { videoId } = await params;
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('videos')
    .select('id, title, description, duration, status, created_at, updated_at')
    .eq('id', videoId)
    .maybeSingle();

  if (!error && data) {
    return NextResponse.json(serializeVideo(data as VideoRow));
  }

  if (!error) {
    return NextResponse.json({ error: '视频不存在' }, { status: 404 });
  }

  console.warn('Supabase 视频详情查询失败，回退视频服务:', error.message);
  const {
    data: { session },
  } = await auth.supabase.auth.getSession();
  const fallback = await fetch(videoApiUrl(`/api/videos/${videoId}`), {
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

  return NextResponse.json(body);
}
