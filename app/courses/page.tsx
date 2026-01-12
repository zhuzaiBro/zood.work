import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

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
  totalDuration: number // 总时长（秒）
}

// 格式化时长（秒转 MM:SS 或 HH:MM:SS）
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default async function CoursesPage() {
  const supabase = await createClient()

  // 获取所有已发布的课程
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('获取课程列表失败:', error)
  }

  // 为每门课程统计课程数量和总时长
  const coursesWithStats: Course[] = []
  
  if (courses && Array.isArray(courses)) {
    for (const course of courses as any[]) {
      // 获取该课程的所有章节
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('course_id', course.id)

      const chapterIds: string[] = []
      if (chapters && Array.isArray(chapters)) {
        for (const ch of chapters as any[]) {
          if (ch?.id) {
            chapterIds.push(ch.id)
          }
        }
      }
      
      // 获取该课程的所有课程（lessons）
      let lessonCount = 0
      let totalDuration = 0

      if (chapterIds.length > 0) {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('duration')
          .in('chapter_id', chapterIds)

        if (lessons && Array.isArray(lessons)) {
          lessonCount = lessons.length
          for (const lesson of lessons as any[]) {
            if (lesson?.duration) {
              totalDuration += lesson.duration
            }
          }
        }
      }

      coursesWithStats.push({
        id: course.id,
        title: course.title,
        description: course.description,
        cover_image_url: course.cover_image_url,
        price: course.price,
        is_free: course.is_free,
        status: course.status,
        created_at: course.created_at,
        lessonCount,
        totalDuration,
      })
    }
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
                      {course.lessonCount} 个课程
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
