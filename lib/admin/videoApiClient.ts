import { SupabaseClient } from '@supabase/supabase-js';
import { videoApiUrl } from '@/lib/videoApi';

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

export async function getVideoApiAuthHeaders(supabase: SupabaseClient) {
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
  supabase: SupabaseClient,
  page = 1,
  pageSize = 10,
): Promise<VideoListResult> {
  const authHeaders = await getVideoApiAuthHeaders(supabase);
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  return fetchVideoApiJson<VideoListResult>(
    videoApiUrl(`/api/videos?${params.toString()}`),
    { headers: authHeaders },
  );
}

export async function getVideoDetail(
  supabase: SupabaseClient,
  videoId: string,
): Promise<VideoRecord> {
  const authHeaders = await getVideoApiAuthHeaders(supabase);
  return fetchVideoApiJson<VideoRecord>(videoApiUrl(`/api/videos/${videoId}`), {
    headers: authHeaders,
  });
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

  const lessonResponse = await fetch('/api/lessons', {
    method: lessonId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: lessonId,
      chapterId,
      title,
      description,
      coursewareName: coursewareName ?? null,
      coursewareUrl: coursewareUrl ?? null,
      contentHtml: contentHtml ?? null,
      contentMarkdown: contentMarkdown ?? null,
      videoId,
      videoUrl: videoApiUrl(`/api/videos/${videoId}`),
      duration: duration ?? null,
      isFree,
      isLocked: !isFree,
      sortOrder,
    }),
  });

  if (!lessonResponse.ok) {
    const errorData = await lessonResponse.json().catch(() => ({}));
    throw new Error(
      '保存课时失败: ' + ((errorData as { error?: string }).error || '未知错误'),
    );
  }
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
