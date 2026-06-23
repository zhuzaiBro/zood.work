import { createAdminClient } from '@/lib/supabase/server';
import { videoApiUrl } from '@/lib/videoApi';

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price: number;
  is_free: boolean;
  status: string;
  created_at: string;
};

type LessonRow = {
  id: string;
  chapter_id: string;
  duration: number | null;
  video_id: string | null;
};

export type PublishedCourseWithStats = CourseRow & {
  lessonCount: number;
  totalDuration: number;
};

async function fetchVideoDurationSeconds(videoId: string): Promise<number | null> {
  try {
    const response = await fetch(videoApiUrl(`/api/videos/${videoId}`), {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const body = (await response.json()) as { duration?: number | null };
    const duration = body.duration;

    if (typeof duration === 'number' && duration > 0) {
      return Math.round(duration);
    }
  } catch {
    // 忽略单个视频详情失败
  }

  return null;
}

function normalizeDuration(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  return 0;
}

export async function getPublishedCoursesWithStats(): Promise<PublishedCourseWithStats[]> {
  const adminClient = createAdminClient();

  const { data: courses, error: coursesError } = await adminClient
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (coursesError) {
    throw new Error(coursesError.message);
  }

  if (!courses?.length) {
    return [];
  }

  const courseIds = courses.map((course) => course.id);

  const { data: chapters, error: chaptersError } = await adminClient
    .from('chapters')
    .select('id, course_id')
    .in('course_id', courseIds);

  if (chaptersError) {
    throw new Error(chaptersError.message);
  }

  const chapterToCourse = new Map(
    (chapters ?? []).map((chapter) => [chapter.id, chapter.course_id]),
  );
  const chapterIds = [...chapterToCourse.keys()];

  const statsByCourse = new Map<string, { lessonCount: number; totalDuration: number }>(
    courseIds.map((courseId) => [courseId, { lessonCount: 0, totalDuration: 0 }]),
  );

  if (chapterIds.length === 0) {
    return courses.map((course) => ({
      ...(course as CourseRow),
      lessonCount: 0,
      totalDuration: 0,
    }));
  }

  const { data: lessons, error: lessonsError } = await adminClient
    .from('lessons')
    .select('id, chapter_id, duration, video_id')
    .in('chapter_id', chapterIds);

  if (lessonsError) {
    throw new Error(lessonsError.message);
  }

  const lessonsMissingDuration: LessonRow[] = [];
  const videoIdsToFetch = new Set<string>();

  for (const lesson of (lessons ?? []) as LessonRow[]) {
    const courseId = chapterToCourse.get(lesson.chapter_id);
    if (!courseId) continue;

    const stats = statsByCourse.get(courseId);
    if (!stats) continue;

    stats.lessonCount += 1;

    const duration = normalizeDuration(lesson.duration);
    if (duration > 0) {
      stats.totalDuration += duration;
      continue;
    }

    if (lesson.video_id) {
      lessonsMissingDuration.push(lesson);
      videoIdsToFetch.add(lesson.video_id);
    }
  }

  const durationByVideoId = new Map<string, number>();
  await Promise.all(
    [...videoIdsToFetch].map(async (videoId) => {
      const duration = await fetchVideoDurationSeconds(videoId);
      if (duration) {
        durationByVideoId.set(videoId, duration);
      }
    }),
  );

  const lessonUpdates: Array<{ id: string; duration: number }> = [];

  for (const lesson of lessonsMissingDuration) {
    const courseId = chapterToCourse.get(lesson.chapter_id);
    if (!courseId || !lesson.video_id) continue;

    const duration = durationByVideoId.get(lesson.video_id);
    if (!duration) continue;

    const stats = statsByCourse.get(courseId);
    if (stats) {
      stats.totalDuration += duration;
    }

    lessonUpdates.push({ id: lesson.id, duration });
  }

  if (lessonUpdates.length > 0) {
    await Promise.all(
      lessonUpdates.map(({ id, duration }) =>
        adminClient.from('lessons').update({ duration }).eq('id', id),
      ),
    );
  }

  return courses.map((course) => {
    const stats = statsByCourse.get(course.id) ?? { lessonCount: 0, totalDuration: 0 };

    return {
      ...(course as CourseRow),
      lessonCount: stats.lessonCount,
      totalDuration: stats.totalDuration,
    };
  });
}
