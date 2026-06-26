'use client'

import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface QuestionTocProps {
  content: string
}

const TOC_STICKY_TOP = 'calc(var(--site-header-height) + 1.5rem)'
const TOC_MAX_HEIGHT = 'calc(100vh - var(--site-header-height) - 3rem)'
const SCROLL_OFFSET_PX = 96

export default function QuestionToc({ content }: QuestionTocProps) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: TocItem[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)

      headings.push({ id, text, level })
    }

    setToc(headings)
  }, [content])

  useEffect(() => {
    if (toc.length === 0) return

    const headingElements = toc
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element))

    if (headingElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
          return
        }

        for (let i = headingElements.length - 1; i >= 0; i -= 1) {
          const element = headingElements[i]
          if (element.getBoundingClientRect().top <= SCROLL_OFFSET_PX + 8) {
            setActiveId(element.id)
            break
          }
        }
      },
      {
        root: null,
        rootMargin: `-${SCROLL_OFFSET_PX}px 0px -60% 0px`,
        threshold: [0, 0.1, 1],
      },
    )

    headingElements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [toc])

  useEffect(() => {
    if (!activeId) return
    const activeButton = document.querySelector<HTMLElement>(
      `[data-toc-id="${activeId}"]`,
    )
    activeButton?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  if (toc.length === 0) {
    return null
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
      style={{
        position: 'sticky',
        top: TOC_STICKY_TOP,
        maxHeight: TOC_MAX_HEIGHT,
      }}
    >
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">目录</h3>
        <span className="text-xs text-gray-400">{toc.length} 节</span>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
        <ul className="space-y-0.5 text-[13px] leading-5">
          {toc.map((item, index) => {
            const isActive = activeId === item.id

            return (
              <li key={`${item.id}-${index}`}>
                <button
                  type="button"
                  data-toc-id={item.id}
                  onClick={() => handleClick(item.id)}
                  className={`w-full rounded-md border-l-2 py-1.5 pr-2 text-left transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 font-medium text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  style={{ paddingLeft: `${(item.level - 1) * 10 + 10}px` }}
                >
                  <span className="line-clamp-2">{item.text}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
