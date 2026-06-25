'use client'

import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from '@/components/CodeBlock'
import DraggableCodePlayground from '@/components/DraggableCodePlayground'
import {
  type PlaygroundSnippet,
} from '@/components/CodePlaygroundPanel'
import { isRunnableLanguage } from '@/lib/codePlayground'

export interface DocumentLessonItem {
  id: string
  title: string
  description?: string | null
  contentMarkdown: string
  isLocked: boolean
  accessReason?: 'login' | 'purchase' | null
  coursewareName?: string | null
  coursewareUrl?: string | null
}

export interface DocumentChapterGroup {
  id: string
  title: string
  lessons: DocumentLessonItem[]
}

interface LessonDocumentViewerProps {
  chapters: DocumentChapterGroup[]
  activeLessonId: string
  onSelectLesson: (lessonId: string) => void
  blocked?: boolean
  blockTitle?: string
  blockDescription?: string
  loginHref?: string
  onPurchase?: () => void
  showPurchaseButton?: boolean
}

export default function LessonDocumentViewer({
  chapters,
  activeLessonId,
  onSelectLesson,
  blocked = false,
  blockTitle = '登录后即可阅读文档',
  blockDescription = '请先登录账号，再阅读课时文档并同步学习进度。',
  loginHref,
  onPurchase,
  showPurchaseButton = false,
}: LessonDocumentViewerProps) {
  const [playground, setPlayground] = useState<PlaygroundSnippet | null>(null)
  const [runToken, setRunToken] = useState(0)

  const flatLessons = useMemo(
    () => chapters.flatMap((chapter) => chapter.lessons),
    [chapters],
  )

  const activeIndex = useMemo(
    () => flatLessons.findIndex((lesson) => lesson.id === activeLessonId),
    [activeLessonId, flatLessons],
  )

  const activeLesson = activeIndex >= 0 ? flatLessons[activeIndex] : flatLessons[0]
  const prevLesson = activeIndex > 0 ? flatLessons[activeIndex - 1] : null
  const nextLesson =
    activeIndex >= 0 && activeIndex < flatLessons.length - 1
      ? flatLessons[activeIndex + 1]
      : null

  const playgroundOpen = Boolean(
    playground && isRunnableLanguage(playground.language) && !blocked,
  )

  useEffect(() => {
    setPlayground(null)
    setRunToken(0)
  }, [activeLessonId])

  const handleRunCode = (payload: { code: string; language: string; title: string }) => {
    if (!isRunnableLanguage(payload.language)) return
    setPlayground({
      code: payload.code.trim(),
      language: payload.language,
      title: payload.title,
    })
    setRunToken((value) => value + 1)
  }

  if (!activeLesson) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-700">暂无文档课时</p>
          <p className="mt-2 text-sm text-slate-500">
            请在后台为课时填写 Markdown 讲义内容。
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(148,163,184,0.14)]">
        <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-600">课时文档</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {activeLesson.title}
              </h2>
              {activeLesson.description && (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  {activeLesson.description}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Progress</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {activeIndex + 1} / {flatLessons.length}
              </p>
            </div>
          </div>

          {activeLesson.coursewareUrl && !blocked && (
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={activeLesson.coursewareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                下载课件{activeLesson.coursewareName ? `：${activeLesson.coursewareName}` : ''}
              </a>
            </div>
          )}
        </div>

        <div className="relative px-6 py-6 sm:px-8">
          {blocked ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <div className="max-w-md">
                <p className="text-lg font-semibold text-slate-900">{blockTitle}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{blockDescription}</p>
                {showPurchaseButton && onPurchase ? (
                  <button
                    type="button"
                    onClick={onPurchase}
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    立即购买
                  </button>
                ) : loginHref ? (
                  <a
                    href={loginHref}
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    去登录
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="document-prose prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-pre:overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ((props: any) => (
                    <CodeBlock {...props} onRunCode={handleRunCode} />
                  )) as any,
                }}
              >
                {activeLesson.contentMarkdown}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={() => prevLesson && onSelectLesson(prevLesson.id)}
            disabled={!prevLesson}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {prevLesson ? `← ${prevLesson.title}` : '已是第一节'}
          </button>

          <button
            type="button"
            onClick={() => nextLesson && onSelectLesson(nextLesson.id)}
            disabled={!nextLesson}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nextLesson ? `${nextLesson.title} →` : '已是最后一节'}
          </button>
        </div>
      </section>

      {playgroundOpen && playground && (
        <DraggableCodePlayground
          snippet={playground}
          runToken={runToken}
          onClose={() => setPlayground(null)}
        />
      )}
    </>
  )
}
