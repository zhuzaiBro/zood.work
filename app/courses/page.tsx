import type { Metadata } from 'next';
import CourseCatalog, { type CourseCatalogItem } from '@/components/courses/CourseCatalog';
import { createClient } from '@/lib/supabase/server';
import { getPublishedCoursesWithStats } from '@/lib/courses/getPublishedCoursesWithStats';

export const metadata: Metadata = {
  title: 'Web3学习课程 - Agent学习路线与 CEX 项目实战',
  description: '油条TV 课程覆盖 web3学习、agent学习路线、AI 应用开发、CEX项目和交易所业务实战，适合想系统转型的开发者。',
  keywords: ['web3学习', 'agent学习路线', 'cex项目', '交易所攻略', '油条TV', 'AI应用开发', 'Web3课程'],
  alternates: { canonical: '/courses' },
};

export const revalidate = 60;

export default async function CoursesPage() {
  let courses: CourseCatalogItem[] = [];

  try {
    courses = await getPublishedCoursesWithStats();
  } catch (error) {
    console.error('获取课程统计失败:', error);
    const supabase = await createClient();
    const { data } = await supabase
      .from('courses')
      .select('id, title, description, cover_image_url, price, is_free, status, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    const fallbackCourses = (data ?? []) as Array<Omit<CourseCatalogItem, 'lessonCount' | 'totalDuration'>>;
    courses = fallbackCourses.map((course) => ({
      ...course,
      lessonCount: 0,
      totalDuration: 0,
    }));
  }

  return <CourseCatalog courses={courses} />;
}
