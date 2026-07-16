import type { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { videoApiUrl } from '@/lib/videoApi';

type BrowserSupabaseClient = ReturnType<typeof createClient>;
type VideoRow = Pick<
  Database['public']['Tables']['videos']['Row'],
  'id' | 'title' | 'description' | 'duration' | 'status' | 'created_at' | 'updated_at'
>;

export type UploadProgressState = {
  uploaded: number;
  total: number;
  percent: number;
};

export type VideoRecord = {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  status: 'waiting' | 'processing' | 'ready' | 'failed' | string;
  createdAt?: string;
  updatedAt?: string;
};

export type VideoListResult = {
  items: VideoRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getVideoApiAuthHeaders(
  supabase: BrowserSupabaseClient,
): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export async function fetchVideoApiJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (body as { message?: string; error?: string; code?: string }).message ||
      (body as { message?: string; error?: string; code?: string }).error ||
      (body as { message?: string; error?: string; code?: string }).code ||
      response.statusText;
    throw new Error(message);
  }

  return body as T;
}

export async function listVideos(
  supabase: BrowserSupabaseClient,
  page = 1,
  pageSize = 10,
): Promise<VideoListResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('videos')
    .select('id, title, description, duration, status, created_at, updated_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (!error) {
    return {
      items: ((data ?? []) as VideoRow[]).map((video) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        status: video.status,
        createdAt: video.created_at ?? undefined,
        updatedAt: video.updated_at ?? undefined,
      })),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return fetchVideoApiJson<VideoListResult>(`/api/admin/videos?${params.toString()}`);
}

export async function getVideoDetail(
  supabase: BrowserSupabaseClient,
  videoId: string,
): Promise<VideoRecord> {
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, duration, status, created_at, updated_at')
    .eq('id', videoId)
    .maybeSingle();

  const video = data as VideoRow | null;
  if (!error && video) {
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      status: video.status,
      createdAt: video.created_at ?? undefined,
      updatedAt: video.updated_at ?? undefined,
    };
  }

  return fetchVideoApiJson<VideoRecord>(`/api/admin/videos/${videoId}`);
}

export async function saveLesson(options: {
  lessonId?: string;
  chapterId: string;
  title: string;
  description: string;
  coursewareName?: string | null;
  coursewareUrl?: string | null;
  contentHtml?: string | null;
  contentMarkdown?: string | null;
  videoId?: string | null;
  duration?: number | null;
  isFree: boolean;
  sortOrder: number;
}) {
  const {
    lessonId,
    chapterId,
    title,
    description,
    coursewareName,
    coursewareUrl,
    contentHtml,
    contentMarkdown,
    videoId,
    duration,
    isFree,
    sortOrder,
  } = options;

  const hasVideo = Boolean(videoId?.trim());
  const payload: Record<string, unknown> = {
    id: lessonId,
    chapterId,
    title,
    description,
    coursewareName: coursewareName ?? null,
    coursewareUrl: coursewareUrl ?? null,
    contentHtml: contentHtml ?? null,
    contentMarkdown: contentMarkdown ?? null,
    isFree,
    isLocked: !isFree,
    sortOrder,
  };

  if (lessonId || hasVideo) {
    payload.videoId = hasVideo ? videoId : null;
    payload.videoUrl = hasVideo ? videoApiUrl(`/api/videos/${videoId}`) : null;
    payload.duration = hasVideo ? duration ?? null : null;
  }

  const lessonResponse = await fetch('/api/lessons', {
    method: lessonId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!lessonResponse.ok) {
    const errorData = await lessonResponse.json().catch(() => ({}));
    throw new Error(
      '保存课时失败: ' + ((errorData as { error?: string }).error || '未知错误'),
    );
  }
}

export async function saveLessonWithVideo(options: {
  lessonId?: string;
  chapterId: string;
  title: string;
  description: string;
  coursewareName?: string | null;
  coursewareUrl?: string | null;
  contentHtml?: string | null;
  contentMarkdown?: string | null;
  videoId: string;
  duration?: number | null;
  isFree: boolean;
  sortOrder: number;
}) {
  return saveLesson(options);
}

export function formatVideoDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
