import { SupabaseClient } from '@supabase/supabase-js';
import { videoApiUrl } from '@/lib/videoApi';
import {
  fetchVideoApiJson,
  getVideoApiAuthHeaders,
  saveLessonWithVideo,
  type UploadProgressState,
} from '@/lib/admin/videoApiClient';

export type { UploadProgressState };

export async function uploadLessonVideo(options: {
  supabase: SupabaseClient;
  videoFile: File;
  lessonTitle: string;
  lessonDescription: string;
  coursewareName?: string | null;
  coursewareUrl?: string | null;
  contentHtml?: string | null;
  contentMarkdown?: string | null;
  chapterId: string;
  isFreeLesson: boolean;
  sortOrder: number;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
  onChunkProgress?: (state: UploadProgressState) => void;
}) {
  const {
    supabase,
    videoFile,
    lessonTitle,
    lessonDescription,
    coursewareName,
    coursewareUrl,
    contentHtml,
    contentMarkdown,
    chapterId,
    isFreeLesson,
    sortOrder,
    signal,
    onProgress,
    onChunkProgress,
  } = options;

  if (!/\.mp4$/i.test(videoFile.name)) {
    throw new Error('外部视频 API 当前仅支持 .mp4 文件');
  }

  const authHeaders = await getVideoApiAuthHeaders(supabase);
  const chunkSize = 5 * 1024 * 1024;

  const init = await fetchVideoApiJson<{
    uploadId: string;
    chunkSize: number;
    totalChunks: number;
  }>(videoApiUrl('/api/admin/videos/upload/init'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({
      fileName: videoFile.name,
      fileSize: videoFile.size,
      chunkSize,
      title: lessonTitle,
      description: lessonDescription,
    }),
  });

  onProgress?.(2);
  onChunkProgress?.({ uploaded: 0, total: videoFile.size, percent: 0 });

  for (let index = 0; index < init.totalChunks; index += 1) {
    const start = index * init.chunkSize;
    const end = Math.min(start + init.chunkSize, videoFile.size);
    const chunk = videoFile.slice(start, end);

    const chunkResponse = await fetch(
      videoApiUrl(`/api/admin/videos/upload/${init.uploadId}/chunks/${index}`),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          ...authHeaders,
        },
        body: chunk,
        signal,
      },
    );

    const chunkBody = await chunkResponse.json().catch(() => ({}));
    if (!chunkResponse.ok) {
      throw new Error(
        (chunkBody as { message?: string; code?: string }).message ||
          (chunkBody as { message?: string; code?: string }).code ||
          `分片 ${index} 上传失败`,
      );
    }

    const uploadedBytes = end;
    const percent = Math.max(1, Math.round((uploadedBytes / videoFile.size) * 96));
    onProgress?.(percent);
    onChunkProgress?.({
      uploaded: uploadedBytes,
      total: videoFile.size,
      percent,
    });
  }

  onProgress?.(98);

  const complete = await fetchVideoApiJson<{ videoId: string }>(
    videoApiUrl(`/api/admin/videos/upload/${init.uploadId}/complete`),
    {
      method: 'POST',
      headers: authHeaders,
    },
  );

  let duration: number | null = null;
  try {
    const detail = await fetchVideoApiJson<{ duration?: number | null }>(
      videoApiUrl(`/api/videos/${complete.videoId}`),
      { headers: authHeaders },
    );
    duration = detail.duration ?? null;
  } catch {
    // 忽略详情失败
  }

  await saveLessonWithVideo({
    chapterId,
    title: lessonTitle,
    description: lessonDescription,
    coursewareName,
    coursewareUrl,
    contentHtml,
    contentMarkdown,
    videoId: complete.videoId,
    duration,
    isFree: isFreeLesson,
    sortOrder,
  });

  onProgress?.(100);
  return complete.videoId;
}
