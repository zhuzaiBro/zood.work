import { platformPublic } from '@/lib/platform/client';

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price: number;
  is_free: boolean;
  status: string;
  sort_order?: number;
  created_at: string;
};

export type PublishedCourseWithStats = CourseRow & {
  lessonCount: number;
  totalDuration: number;
};

export async function getPublishedCoursesWithStats(): Promise<PublishedCourseWithStats[]> {
  const { courses } = await platformPublic<{ courses: CourseRow[] }>(
    '/api/platform/courses?status=published',
  );

  return (courses ?? []).map((course) => ({
    ...course,
    price: Number(course.price ?? 0),
    is_free: Boolean(course.is_free),
    lessonCount: 0,
    totalDuration: 0,
  }));
}
