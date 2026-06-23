import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getPublishedCoursesWithStats } from '@/lib/courses/getPublishedCoursesWithStats'
import { formatDuration } from '@/lib/formatDuration'

export const metadata = {
  title: '课程列表 - zood的小破站',
  description: '浏览所有在线课程',
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

    coursesWithStats = (courses ?? []).map((course) => ({
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
            探索我们的在线课程，开始你的学习之旅
          </p>
        </div>

        {coursesWithStats && coursesWithStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesWithStats.map((course: Course) => (
              <Link
                key={course.id}
                href={`/learn?courseId=${course.id}`}
                className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* 封面图片 */}
                <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                      <svg
                        className="w-16 h-16 text-white opacity-50"
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
                  {/* 状态标签 */}
                  <div className="absolute top-2 right-2">
                    {course.is_free ? (
                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        免费
                      </span>
                    ) : (
                      <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        ¥{course.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* 课程信息 */}
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {course.title}
                  </h2>
                  
                  {course.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm">
                      {course.description}
                    </p>
                  )}

                  {/* 课程统计信息 */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
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
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
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
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
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
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      开始学习 →
                    </span>
                  </div>
                </div>
              </Link>
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
