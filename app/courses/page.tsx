import { createClient } from '@/lib/supabase/server'
import LazyLink from '@/components/LazyLink'
import { getPublishedCoursesWithStats } from '@/lib/courses/getPublishedCoursesWithStats'
import { formatDuration } from '@/lib/formatDuration'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Web3学习课程 - Agent学习路线与 CEX 项目实战',
  description: '油条TV 课程覆盖 web3学习、agent学习路线、AI 应用开发、CEX项目和交易所业务实战，适合想系统转型的开发者。',
  keywords: ['web3学习', 'agent学习路线', 'cex项目', '交易所攻略', '油条TV', 'AI应用开发', 'Web3课程'],
  alternates: {
    canonical: '/courses',
  },
}

export const revalidate = 60

interface Course {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  price: number
  is_free: boolean
  status: string
  created_at: string
  lessonCount: number
  totalDuration: number
}

export default async function CoursesPage() {
  let coursesWithStats: Course[] = []

  try {
    coursesWithStats = await getPublishedCoursesWithStats()
  } catch (error) {
    console.error('获取课程统计失败:', error)

    const supabase = await createClient()
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('获取课程列表失败:', coursesError)
    }

    coursesWithStats = ((courses ?? []) as Course[]).map((course) => ({
      ...course,
      lessonCount: 0,
      totalDuration: 0,
    }))
  }

  return (
    <div className="container  mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">所有课程</h1>
          <p className="text-gray-600 dark:text-gray-400">
            从 Web3 学习、Agent 学习路线到 CEX 项目和交易所业务实战，开始你的系统学习之旅。
          </p>
        </div>

        {coursesWithStats && coursesWithStats.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesWithStats.map((course: Course) => (
              <LazyLink
                key={course.id}
                href={`/learn?courseId=${course.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
              >
                {/* 封面：固定 4:3 */}
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                      <svg
                        className="h-16 w-16 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* 封面底部：全透明 → 白色，衔接到下方信息区 */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white dark:to-gray-900" />

                  <div className="absolute right-3 top-3 z-10">
                    {course.is_free ? (
                      <span className="rounded-full bg-green-500/95 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                        免费
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-500/95 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                        ¥{course.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* 底部信息：白底 */}
                <div className="relative bg-white px-5 pb-5 pt-3 dark:bg-gray-900">
                  <h2 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                    {course.title}
                  </h2>

                  {course.description && (
                    <p className="mb-4 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                      {course.description}
                    </p>
                  )}

                  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      {course.lessonCount} 个课时
                    </span>
                    {course.totalDuration >= 3600 && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        总课时：
                        {formatDuration(course.totalDuration)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(course.created_at).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-semibold text-sky-600 transition-colors group-hover:text-sky-700 dark:text-sky-400 dark:group-hover:text-sky-300">
                      开始学习 →
                    </span>
                  </div>
                </div>
              </LazyLink>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg">暂无课程</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              课程正在准备中，敬请期待
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
