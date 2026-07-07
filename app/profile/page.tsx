'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useProfile, useUser, useIsAuthenticated, useUserStore } from '@/store/userStore'
import QiniuUploader from '@/components/QiniuUploader'
import MembershipConsultationModal from '@/components/MembershipConsultationModal'

type ProfileDashboardData = {
  enrollments: any[]
  purchaseRequests: any[]
  progress: any[]
  courses: any[]
  lessonCountsByCourse: Record<string, number>
  favorites: any[]
  submissions: any[]
  resumeRecords: any[]
}

const emptyDashboardData: ProfileDashboardData = {
  enrollments: [],
  purchaseRequests: [],
  progress: [],
  courses: [],
  lessonCountsByCourse: {},
  favorites: [],
  submissions: [],
  resumeRecords: [],
}

export default function ProfilePage() {
  const router = useRouter()
  const user = useUser()
  const profile = useProfile()
  const isAuthenticated = useIsAuthenticated()
  const setProfile = useUserStore((state) => state.setProfile)
  const [activeTab, setActiveTab] = useState('courses')
  const [copiedId, setCopiedId] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [membershipConsultationOpen, setMembershipConsultationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dashboardData, setDashboardData] = useState<ProfileDashboardData>(emptyDashboardData)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
  })

  useEffect(() => {
    // 如果未登录，跳转到登录页
    if (!isAuthenticated && user === null) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    let cancelled = false

    async function loadDashboardData() {
      setIsDashboardLoading(true)
      setDashboardError('')

      const supabase = createClient() as any
      const [
        enrollmentsResult,
        purchaseRequestsResult,
        progressResult,
        favoritesResult,
        submissionsResult,
        resumeRecordsResult,
      ] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select(`
            id,
            course_id,
            status,
            source,
            granted_at,
            expires_at,
            note,
            courses (
              id,
              title,
              description,
              cover_image_url,
              price,
              is_free
            )
          `)
          .eq('user_id', userId)
          .order('granted_at', { ascending: false }),
        supabase
          .from('course_purchase_requests')
          .select('id, course_id, course_title, course_price, status, admin_note, contacted_at, paid_at, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('lesson_progress')
          .select(`
            id,
            course_id,
            lesson_id,
            current_seconds,
            duration_seconds,
            progress_percent,
            is_completed,
            last_watched_at,
            lessons (
              id,
              title
            ),
            courses (
              id,
              title
            )
          `)
          .eq('user_id', userId)
          .order('last_watched_at', { ascending: false }),
        supabase
          .from('interview_question_favorites')
          .select(`
            id,
            created_at,
            interview_question (
              id,
              title,
              content,
              difficulty,
              collection_id
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('interview_question_submissions')
          .select('id, title, content, tags, status, admin_note, created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('resume_optimization_records')
          .select('id, target_role, score, positioning, rewritten_summary, keywords, resume_html, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ])

      if (cancelled) return

      const errors = [
        enrollmentsResult.error,
        purchaseRequestsResult.error,
        progressResult.error,
        favoritesResult.error,
        submissionsResult.error,
        resumeRecordsResult.error,
      ].filter(Boolean)

      if (errors.length > 0) {
        setDashboardError(
          `部分数据加载失败：${errors
            .map((error: { message?: string }) => error.message)
            .filter(Boolean)
            .slice(0, 2)
            .join('；')}`
        )
      }

      const enrollments = enrollmentsResult.data ?? []
      const purchaseRequests = purchaseRequestsResult.data ?? []
      const progressRows = progressResult.data ?? []
      const courseIds = Array.from(
        new Set(
          [
            ...enrollments.map((item: any) => item.course_id),
            ...purchaseRequests.map((item: any) => item.course_id),
            ...progressRows.map((item: any) => item.course_id),
          ].filter(Boolean)
        )
      )

      let courses: any[] = []
      let lessonCountsByCourse: Record<string, number> = {}

      if (courseIds.length > 0) {
        const [coursesResult, chaptersResult] = await Promise.all([
          supabase
            .from('courses')
            .select('id, title, description, cover_image_url, price, is_free, status')
            .in('id', courseIds),
          supabase
            .from('chapters')
            .select('id, course_id')
            .in('course_id', courseIds),
        ])

        if (cancelled) return

        if (coursesResult.error || chaptersResult.error) {
          setDashboardError((current) =>
            [current, coursesResult.error?.message, chaptersResult.error?.message]
              .filter(Boolean)
              .join('；')
          )
        }

        courses = coursesResult.data ?? []
        const chapters = chaptersResult.data ?? []
        const chapterToCourse = new Map(
          chapters.map((chapter: any) => [chapter.id, chapter.course_id])
        )
        const chapterIds = chapters.map((chapter: any) => chapter.id)

        if (chapterIds.length > 0) {
          const lessonsResult = await supabase
            .from('lessons')
            .select('id, chapter_id')
            .in('chapter_id', chapterIds)

          if (cancelled) return

          if (lessonsResult.error) {
            setDashboardError((current) =>
              [current, lessonsResult.error?.message].filter(Boolean).join('；')
            )
          }

          ;(lessonsResult.data ?? []).forEach((lesson: any) => {
            const courseId = chapterToCourse.get(lesson.chapter_id)
            if (!courseId) return
            lessonCountsByCourse[courseId] = (lessonCountsByCourse[courseId] ?? 0) + 1
          })
        }
      }

      setDashboardData({
        enrollments,
        purchaseRequests,
        progress: progressRows,
        courses,
        lessonCountsByCourse,
        favorites: favoritesResult.data ?? [],
        submissions: submissionsResult.data ?? [],
        resumeRecords: resumeRecordsResult.data ?? [],
      })
      setIsDashboardLoading(false)
    }

    void loadDashboardData()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const displayName = profile?.display_name || profile?.username || '用户'
  const vipLevel = profile?.vip_level || 0
  const userAvatar = profile?.avatar_url

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const handleOpenEditDialog = () => {
    // 填充当前的 profile 数据到表单
    setFormData({
      username: profile?.username || '',
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      console.error('用户 ID 不存在')
      return
    }

    console.log('开始保存个人资料...')
    console.log('环境变量检查:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })

    setIsSubmitting(true)
    
    try {
      const supabase = createClient()
      console.log('Supabase 客户端创建成功')

      const updateData = {
        id: user.id,
        username: formData.username,
        display_name: formData.display_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(),
      }
      
      console.log('准备更新数据:', updateData)

      // 使用 upsert 操作：如果记录不存在则插入，存在则更新
      const { data, error } = await supabase
        .from('user_profiles')
        // @ts-expect-error - Supabase type inference issue with upsert method
        .upsert(updateData, {
          onConflict: 'id', // 根据 id 字段判断是否冲突
        })
        .select()
        .single()

      console.log('Supabase 响应:', { data, error })

      if (error) {
        console.error('Supabase 错误详情:', error)
        throw new Error(`保存失败: ${error.message || '未知错误'}`)
      }

      // 更新 Zustand store
      if (data) {
        console.log('更新 store:', data)
        setProfile(data as any)
      }

      setIsEditDialogOpen(false)
      alert('个人资料保存成功！')
    } catch (error) {
      console.error('保存个人资料失败:', error)
      const errorMessage = error instanceof Error ? error.message : '保存失败，请重试'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
      console.log('保存流程结束')
    }
  }

  const tabs = [
    { id: 'courses', label: '我的课程' },
    { id: 'favorites', label: '题目收藏' },
    { id: 'submissions', label: '投稿记录' },
    { id: 'resumes', label: '简历优化' },
  ]

  const courseProgress = buildCourseProgress(
    dashboardData.progress,
    dashboardData.lessonCountsByCourse
  )
  const participatedCourses = buildParticipatedCourses(dashboardData, courseProgress)
  const averageProgress = calculateAverageProgress(courseProgress)
  const recentProgress = dashboardData.progress[0]
  const renderTabContent = () => {
    if (isDashboardLoading) {
      return <LoadingState />
    }

    if (activeTab === 'courses') {
      return (
        <div className="space-y-5">
          <SectionTitle
            title="学习与购买的课程"
            description="这里汇总平台给你开通的课程、购买意向，以及每个课程最近的学习进度。"
          />
          {participatedCourses.length === 0 ? (
            <EmptyState
              title="还没有课程记录"
              description="去课程页选择感兴趣的 Web3 / AI 课程，免费课可直接学习，付费课提交购买意向后平台会联系你。"
              href="/courses"
              action="去看课程"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {participatedCourses.map((item) => {
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${item.borderClass}`}
                  >
                    <div className="relative aspect-[16/7] overflow-hidden bg-slate-950">
                      {item.coverImageUrl ? (
                        <Image
                          src={item.coverImageUrl}
                          alt={item.title}
                          fill
                          unoptimized
                          sizes="(min-width: 768px) 50vw, 100vw"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0f172a_0%,#075985_55%,#22d3ee_100%)] px-6 text-center">
                          <span className="line-clamp-2 text-xl font-black text-white/95">
                            {item.title}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/65 to-transparent" />
                      <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
                        {item.priceLabel}
                      </span>
                    </div>

                    <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.statusClass}`}>
                            {item.statusLabel}
                          </span>
                          {item.sourceLabel && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                              {item.sourceLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-lg font-black text-slate-950 group-hover:text-sky-600">
                          {item.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ProgressBar value={item.progress.averagePercent} />
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        已学习 {item.progress.watchedLessons}/{item.progress.totalLessons} 节
                        {item.progress.completedLessons > 0 ? ` / 完成 ${item.progress.completedLessons}` : ''}
                      </span>
                      <span>{item.progress.totalLessons > 0 ? `${Math.round(item.progress.averagePercent)}%` : '暂无课时'}</span>
                    </div>
                    <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <div className="flex items-center justify-between gap-3">
                        <span className="line-clamp-1">
                          {item.progress.lastLessonTitle
                            ? `最近：${item.progress.lastLessonTitle}`
                            : item.progress.lastWatchedAt
                              ? `最近学习：${formatDate(item.progress.lastWatchedAt)}`
                              : item.footerHint}
                        </span>
                        <span className="shrink-0 text-sm font-bold text-sky-600 transition group-hover:translate-x-0.5">
                          {item.actionLabel} →
                        </span>
                      </div>
                      {item.progress.lastWatchedAt && (
                        <span className="text-slate-400">
                          更新时间：{formatDate(item.progress.lastWatchedAt)}
                        </span>
                      )}
                    </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    if (activeTab === 'favorites') {
      return (
        <div className="space-y-5">
          <SectionTitle title="收藏的面试题" description="把值得反复刷的题目先收藏，复盘时从这里直接进入。" />
          {dashboardData.favorites.length === 0 ? (
            <EmptyState title="还没有收藏题目" description="打开面试题详情页，点击收藏后会出现在这里。" href="/interview" action="去刷题库" />
          ) : (
            <div className="space-y-3">
              {dashboardData.favorites.map((favorite) => {
                const question = relationOne(favorite.interview_question)

                return (
                  <Link
                    key={favorite.id}
                    href={question?.id ? `/question/${question.id}` : '/interview'}
                    className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                        {question?.difficulty || '面试题'}
                      </span>
                      <span className="text-xs text-slate-400">收藏于 {formatDate(favorite.created_at)}</span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-lg font-black text-slate-950">
                      {question?.title || '题目已不存在'}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {question?.content || '点击查看题目详情。'}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    if (activeTab === 'submissions') {
      return (
        <div className="space-y-5">
          <SectionTitle title="我的面试题投稿" description="查看你提交的问题、审核状态，以及平台管理员给你的答复。" />
          {dashboardData.submissions.length === 0 ? (
            <EmptyState title="还没有投稿记录" description="遇到真实面试题、学习卡点或项目坑，可以快速投递给社区整理。" href="/interview" action="去投稿" />
          ) : (
            <div className="space-y-3">
              {dashboardData.submissions.map((submission) => (
                <div key={submission.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${submissionStatusClass(submission.status)}`}>
                      {formatSubmissionStatus(submission.status)}
                    </span>
                    <span className="text-xs text-slate-400">提交于 {formatDate(submission.created_at)}</span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-black text-slate-950">{submission.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{submission.content}</p>
                  {Array.isArray(submission.tags) && submission.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {submission.tags.map((tag: string) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    <span className="font-bold text-slate-900">平台答复：</span>
                    {submission.admin_note || '暂未答复，审核后会在这里展示。'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <SectionTitle title="简历优化历史" description="每次使用简历优化 Agent 生成的结果都会沉淀在这里，方便回看、复制和导出。" />
        {dashboardData.resumeRecords.length === 0 ? (
          <EmptyState title="还没有简历优化记录" description="去简历优化 Agent 填入简历和目标岗位，生成后会自动保存历史。" href="/resume-agent" action="去优化简历" />
        ) : (
          <div className="space-y-3">
            {dashboardData.resumeRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                      匹配分 {record.score ?? '-'}
                    </span>
                    <h3 className="mt-3 text-lg font-black text-slate-950">{record.target_role}</h3>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(record.created_at)}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                  {record.positioning || record.rewritten_summary || '暂无定位摘要'}
                </p>
                {Array.isArray(record.keywords) && record.keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {record.keywords.slice(0, 8).map((keyword: string) => (
                      <span key={keyword} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                {record.resume_html && (
                  <button
                    type="button"
                    onClick={() => downloadHtml(record.resume_html, record.target_role)}
                    className="mt-4 rounded-full border border-sky-200 px-4 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
                  >
                    下载 HTML 简历
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 如果还在检查登录状态或未登录，不渲染
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧个人信息卡片 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 个人信息卡 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">个人信息</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenEditDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="编辑资料"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors" title="设置">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 头像 */}
              <div className="flex flex-col items-center mb-6">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center border-4 border-gray-100 mb-4">
                    <span className="text-white text-3xl">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-2">{displayName}</h3>

                {/* VIP 等级 */}
                <div className={`px-4 py-1 rounded-full text-sm font-bold ${
                  vipLevel > 0 
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {vipLevel > 0 ? `VIP ${vipLevel}` : 'LV 0'}
                </div>
              </div>

              {/* 社交链接 */}
              <div className="flex justify-center gap-3 mb-6">
                <a
                  href={`https://github.com/${profile?.username || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                  title="GitHub"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors" title="网站">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </button>
              </div>

              {/* 个人简介 */}
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500">
                  {profile?.bio || '暂无个人简介'}
                </p>
              </div>

              {/* 用户 ID */}
              <div className="text-center text-xs text-gray-400 mb-6 flex items-center justify-center gap-2">
                <span>ID: {user.id?.substring(0, 18)}...</span>
                <button
                  onClick={handleCopyId}
                  className="text-blue-500 hover:text-blue-600"
                  title={copiedId ? '已复制!' : '复制ID'}
                >
                  {copiedId ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* VIP 开通卡片 */}
            {vipLevel === 0 && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg p-6 text-white">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold mb-2">未开通永久会员</h3>
                  <p className="text-sm text-gray-300">畅刷 9000+ 高频面试题</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMembershipConsultationOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  立即开通
                </button>
              </div>
            )}
          </div>

          {/* 右侧主内容区 */}
          <div className="lg:col-span-9 space-y-6">
            {/* 会员等级卡片 */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                <svg viewBox="0 0 100 100" fill="white">
                  <polygon points="50,10 61,35 90,35 67,53 77,78 50,60 23,78 33,53 10,35 39,35" />
                </svg>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs opacity-80 mb-1">当前等级</div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold">{vipLevel > 0 ? `VIP ${vipLevel}` : 'LV 0'}</span>
                      <span className="text-sm opacity-80">排名 -</span>
                      <span className="text-sm opacity-80">经验 {vipLevel * 100}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                      经验值明细
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="opacity-80">参与课程 {participatedCourses.length} 门</span>
                  <span className="opacity-80">收藏题目 {dashboardData.favorites.length} 道</span>
                  <span className="opacity-80">简历优化 {dashboardData.resumeRecords.length} 次</span>
                </div>
              </div>
            </div>

            {/* 学习概览 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard
                label="参与课程"
                value={participatedCourses.length}
                hint="已学习 / 已购买 / 已开通"
              />
              <StatCard
                label="平均学习进度"
                value={`${Math.round(averageProgress)}%`}
                hint={recentProgress ? `最近：${relationOne(recentProgress.lessons)?.title || '课程学习'}` : '还没有学习记录'}
              />
              <StatCard
                label="收藏面试题"
                value={dashboardData.favorites.length}
                hint="复盘高频题"
              />
              <StatCard
                label="简历优化"
                value={dashboardData.resumeRecords.length}
                hint="历史生成记录"
              />
            </div>

            {/* Tab 切换和内容区域 */}
            <div className="bg-white rounded-2xl shadow-sm">
              {/* Tab 导航 */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 内容区域 */}
              <div className="p-6">
                {dashboardError && (
                  <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    {dashboardError}。如果刚新增表，请先执行对应 `.sql` 脚本并刷新页面。
                  </div>
                )}
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑资料对话框 */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsEditDialogOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Dialog 头部 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">编辑个人资料</h2>
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Dialog 内容 */}
            <form onSubmit={handleSubmitEdit} className="p-6 space-y-6">
              {/* 头像和基本信息布局 */}
              <div className="flex gap-6">
                {/* 左侧：头像上传 */}
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    头像
                  </label>
                  <QiniuUploader
                    maxSize={1}
                    accept="image/*"
                    onSuccess={(response) => {
                      setFormData({ ...formData, avatar_url: response.url })
                    }}
                    onError={(error) => {
                      alert(`上传失败: ${error.message}`)
                    }}
                  >
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-blue-500 cursor-pointer transition-all group">
                      {formData.avatar_url ? (
                        <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.avatar_url}
                            alt="头像"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex flex-col items-center justify-center text-white group-hover:from-blue-500 group-hover:to-blue-600 transition-all">
                          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-sm font-medium">上传头像</span>
                        </div>
                      )}
                    </div>
                  </QiniuUploader>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    点击上传<br />最大 1MB
                  </p>
                </div>

                {/* 右侧：用户名和显示名称 */}
                <div className="flex-1 space-y-4">
                  {/* 用户名 */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      用户名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入用户名"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">用于登录和显示</p>
                  </div>

                  {/* 显示名称 */}
                  <div>
                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                      显示名称
                    </label>
                    <input
                      type="text"
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入显示名称"
                    />
                    <p className="mt-1 text-xs text-gray-500">在主页和评论中展示</p>
                  </div>
                </div>
              </div>

              {/* 个人简介 */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  个人简介
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="介绍一下自己..."
                />
                <p className="mt-1 text-xs text-gray-500">简要介绍你的背景、兴趣或专业领域</p>
              </div>

              {/* 手动输入URL（备用选项，折叠状态） */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>或手动输入头像链接</span>
                </summary>
                <div className="mt-3 pl-6">
                  <input
                    type="url"
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </details>

              {/* 按钮组 */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MembershipConsultationModal
        open={membershipConsultationOpen}
        onClose={() => setMembershipConsultationOpen(false)}
        source="profile"
      />
    </div>
  )
}

function relationOne<T = any>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function buildCourseProgress(
  progressRows: any[],
  lessonCountsByCourse: Record<string, number> = {}
) {
  const result = new Map<
    string,
    {
      totalLessons: number
      watchedLessons: number
      completedLessons: number
      averagePercent: number
      lastWatchedAt: string | null
      lastLessonTitle: string | null
    }
  >()

  progressRows.forEach((row) => {
    if (!row.course_id) return

    const current = result.get(row.course_id) ?? {
      totalLessons: lessonCountsByCourse[row.course_id] ?? 0,
      watchedLessons: 0,
      completedLessons: 0,
      averagePercent: 0,
      lastWatchedAt: null,
      lastLessonTitle: null,
    }

    current.watchedLessons += 1
    current.completedLessons += row.is_completed ? 1 : 0
    current.averagePercent += Number(row.progress_percent ?? 0)

    if (!current.lastWatchedAt || new Date(row.last_watched_at).getTime() > new Date(current.lastWatchedAt).getTime()) {
      current.lastWatchedAt = row.last_watched_at
      current.lastLessonTitle = relationOne(row.lessons)?.title || null
    }

    result.set(row.course_id, current)
  })

  result.forEach((value) => {
    const totalLessons = value.totalLessons || value.watchedLessons
    value.totalLessons = totalLessons
    value.averagePercent = totalLessons > 0 ? value.averagePercent / totalLessons : 0
  })

  return result
}

function buildParticipatedCourses(
  dashboardData: ProfileDashboardData,
  courseProgress: Map<
    string,
    {
      totalLessons: number
      watchedLessons: number
      completedLessons: number
      averagePercent: number
      lastWatchedAt: string | null
      lastLessonTitle: string | null
    }
  >
) {
  const coursesById = new Map<string, any>()
  dashboardData.courses.forEach((course) => {
    if (course?.id) coursesById.set(course.id, course)
  })
  dashboardData.enrollments.forEach((enrollment) => {
    const course = relationOne(enrollment.courses)
    if (course?.id) coursesById.set(course.id, { ...coursesById.get(course.id), ...course })
  })
  dashboardData.progress.forEach((row) => {
    const course = relationOne(row.courses)
    if (row.course_id && course) {
      coursesById.set(row.course_id, { ...coursesById.get(row.course_id), ...course })
    }
  })

  const rows = new Map<string, any>()

  dashboardData.progress.forEach((row) => {
    if (!row.course_id || rows.has(row.course_id)) return
    const course = coursesById.get(row.course_id)
    rows.set(row.course_id, {
      key: `progress-${row.course_id}`,
      courseId: row.course_id,
      course,
      statusLabel: '学习中',
      statusClass: 'bg-sky-50 text-sky-700',
      borderClass: 'border-sky-100 hover:border-sky-300',
      sourceLabel: '有学习记录',
      footerHint: '点击进入课程页',
      actionLabel: '继续学习',
      sortTime: row.last_watched_at,
    })
  })

  dashboardData.enrollments.forEach((enrollment) => {
    if (!enrollment.course_id) return
    const course = coursesById.get(enrollment.course_id)
    const existing = rows.get(enrollment.course_id)
    rows.set(enrollment.course_id, {
      ...existing,
      key: `course-${enrollment.course_id}`,
      courseId: enrollment.course_id,
      course,
      statusLabel: enrollment.status === 'active' ? '已开通' : '已关闭',
      statusClass:
        enrollment.status === 'active'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-500',
      borderClass:
        enrollment.status === 'active'
          ? 'border-sky-100 hover:border-sky-300'
          : 'border-slate-100 hover:border-slate-300',
      sourceLabel: enrollment.source === 'purchase' ? '已购买' : '管理员开通',
      footerHint: enrollment.note || '点击进入课程页',
      actionLabel: '继续学习',
      sortTime: existing?.sortTime || enrollment.granted_at,
    })
  })

  dashboardData.purchaseRequests.forEach((request) => {
    if (!request.course_id) return
    const existing = rows.get(request.course_id)
    if (existing?.statusLabel === '已开通') return

    const course = coursesById.get(request.course_id)
    rows.set(request.course_id, {
      ...existing,
      key: `course-${request.course_id}`,
      courseId: request.course_id,
      course,
      fallbackTitle: request.course_title,
      fallbackPrice: request.course_price,
      statusLabel: formatPurchaseStatus(request.status),
      statusClass:
        request.status === 'paid'
          ? 'bg-emerald-50 text-emerald-700'
          : request.status === 'closed'
            ? 'bg-slate-100 text-slate-500'
            : 'bg-amber-100 text-amber-700',
      borderClass: 'border-amber-100 hover:border-amber-300',
      sourceLabel: '购买意向',
      footerHint: request.admin_note || '平台正在处理中',
      actionLabel: '查看课程',
      sortTime: existing?.sortTime || request.paid_at || request.contacted_at || request.created_at,
    })
  })

  return Array.from(rows.values())
    .map((item) => {
      const progress = courseProgress.get(item.courseId) ?? {
        totalLessons: dashboardData.lessonCountsByCourse[item.courseId] ?? 0,
        watchedLessons: 0,
        completedLessons: 0,
        averagePercent: 0,
        lastWatchedAt: null,
        lastLessonTitle: null,
      }
      const course = item.course
      const price = Number(course?.price ?? item.fallbackPrice ?? 0)

      return {
        ...item,
        href: `/learn?courseId=${item.courseId}`,
        title: course?.title || item.fallbackTitle || '未命名课程',
        description: course?.description || item.footerHint || '继续学习，保持节奏。',
        coverImageUrl: course?.cover_image_url || null,
        priceLabel: course?.is_free ? '免费' : price > 0 ? `¥${price}` : '待确认',
        progress,
      }
    })
    .sort((a, b) => {
      const timeA = a.sortTime ? new Date(a.sortTime).getTime() : 0
      const timeB = b.sortTime ? new Date(b.sortTime).getTime() : 0
      return timeB - timeA
    })
}

function calculateAverageProgress(
  courseProgress: Map<string, { averagePercent: number }>
) {
  const rows = Array.from(courseProgress.values())
  if (rows.length === 0) return 0
  return rows.reduce((sum, item) => sum + item.averagePercent, 0) / rows.length
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatPurchaseStatus(status: string | null | undefined) {
  const map: Record<string, string> = {
    pending: '待联系',
    contacted: '已联系',
    paid: '已支付',
    closed: '已关闭',
  }
  return map[status || ''] || '处理中'
}

function formatSubmissionStatus(status: string | null | undefined) {
  const map: Record<string, string> = {
    pending: '待审核',
    accepted: '已采纳',
    rejected: '未采纳',
  }
  return map[status || ''] || '待审核'
}

function submissionStatusClass(status: string | null | undefined) {
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-700'
  if (status === 'rejected') return 'bg-rose-50 text-rose-700'
  return 'bg-amber-50 text-amber-700'
}

function downloadHtml(html: string, targetRole: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${targetRole || 'optimized-resume'}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 line-clamp-1 text-xs text-slate-400">{hint}</p>
    </div>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string
  description: string
  href: string
  action: string
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
        📝
      </div>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-full bg-sky-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-sky-600"
      >
        {action}
      </Link>
    </div>
  )
}
