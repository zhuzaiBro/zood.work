'use client'

import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from '@/components/CodeBlock'
import { PythonBookSection } from '@/lib/pythonBook'

interface PythonBookViewerProps {
  sections: PythonBookSection[]
}

export default function PythonBookViewer({ sections }: PythonBookViewerProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    if (!sections.some((section) => section.id === activeId)) {
      setActiveId(sections[0]?.id ?? '')
    }
  }, [activeId, sections])

  const activeIndex = useMemo(
    () => sections.findIndex((section) => section.id === activeId),
    [activeId, sections],
  )

  const activeSection = activeIndex >= 0 ? sections[activeIndex] : sections[0]
  const prevSection = activeIndex > 0 ? sections[activeIndex - 1] : null
  const nextSection =
    activeIndex >= 0 && activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null

  if (!activeSection) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="mb-4 border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">Python Book</p>
          <h3 className="mt-2 text-lg font-bold text-slate-950">边学边查的轻文档</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            参考文档站的学习节奏，整理成更适合课程页内连续阅读的版本。
          </p>
        </div>

        <nav className="space-y-2">
          {sections.map((section, index) => {
            const isActive = section.id === activeSection.id

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.48)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Chapter {String(index + 1).padStart(2, '0')}
                </p>
                <p className="mt-1 text-sm font-semibold">{section.title}</p>
              </button>
            )
          })}
        </nav>
      </aside>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(148,163,184,0.14)]">
        <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-600">Python Book</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {activeSection.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                {activeSection.summary}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Progress</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {activeIndex + 1} / {sections.length}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="document-prose prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-pre:overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock as any,
              }}
            >
              {activeSection.markdown}
            </ReactMarkdown>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={() => prevSection && setActiveId(prevSection.id)}
            disabled={!prevSection}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {prevSection ? `← ${prevSection.title}` : '已是第一节'}
          </button>

          <button
            type="button"
            onClick={() => nextSection && setActiveId(nextSection.id)}
            disabled={!nextSection}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nextSection ? `${nextSection.title} →` : '已经学完这本书'}
          </button>
        </div>
      </section>
    </div>
  )
}
