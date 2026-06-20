'use client'

import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface ArticleTocProps {
  content: string
}

export default function ArticleToc({ content }: ArticleTocProps) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // 解析 Markdown 中的标题
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: TocItem[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      // 生成唯一的 id，移除特殊字符
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)

      headings.push({ id, text, level })
    }

    setToc(headings)
  }, [content])

  // 防止移动端弹出层时背景滚动
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    // 监听滚动，高亮当前标题
    const handleScroll = () => {
      const headingElements = toc.map(item => {
        return document.getElementById(item.id)
      }).filter(Boolean)

      // 找到当前视口中的标题
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i]
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100) {
            setActiveId(toc[i].id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始检查

    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // 偏移量，避免被 header 遮挡
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
      // 移动端点击后关闭菜单
      setIsMobileMenuOpen(false)
    }
  }

  if (toc.length === 0) {
    return null
  }

  // 渲染目录内容组件
  const TocContent = () => (
    <>
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          文章目录
        </h3>
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            // 移动端同时控制菜单关闭
            if (window.innerWidth < 1280) {
              setIsMobileMenuOpen(false)
            }
          }}
          className="hidden rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700 xl:block"
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        {/* 移动端关闭按钮 */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-slate-400 transition hover:text-slate-700 xl:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 目录列表 */}
      {isOpen && (
        <nav className="max-h-[calc(100vh-16rem)] overflow-y-auto py-3">
          <ul className="space-y-1 px-2">
            {toc.map((item, index) => {
              const isActive = activeId === item.id
              const paddingLeft = (item.level - 1) * 12 + 14 // 根据标题级别设置缩进

              return (
                <li key={`${item.id}-${index}`}>
                  <button
                    onClick={() => handleClick(item.id)}
                    className={`w-full rounded-xl py-2 pr-3 text-left text-sm transition-all ${
                      isActive
                        ? 'bg-sky-50 font-semibold text-sky-700 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.45)]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                  >
                    <span className="line-clamp-2">{item.text}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </>
  )

  return (
    <>
      {/* 桌面端 - 贴近正文区域 */}
      <div className="fixed left-6 top-44 z-20 hidden xl:block 2xl:left-[calc(50%-42rem)]">
        <div className="w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <TocContent />
        </div>
      </div>

      {/* 移动端 - 固定按钮 */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed bottom-20 right-4 z-40 rounded-full bg-slate-900 p-3 text-white shadow-[0_18px_30px_rgba(15,23,42,0.2)] transition-all hover:scale-110 hover:bg-slate-800 active:scale-95 xl:hidden"
        aria-label="打开目录"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      {/* 移动端 - 弹出层 */}
      {isMobileMenuOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 bg-black/50 z-50 xl:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* 目录抽屉 */}
          <div className="fixed inset-x-0 bottom-0 z-50 xl:hidden animate-slide-up">
            <div className="flex max-h-[80vh] flex-col rounded-t-[28px] border-t border-slate-200 bg-white shadow-2xl">
              <TocContent />
            </div>
          </div>
        </>
      )}
    </>
  )
}
