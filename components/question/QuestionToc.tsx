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

export default function QuestionToc({ content }: QuestionTocProps) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

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

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = toc.map(item => 
        document.getElementById(item.id)
      ).filter(Boolean)

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
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

  if (toc.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sticky top-24">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">目录</h3>
        <span className="text-gray-400 text-sm">»</span>
      </div>
      <nav className="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 text-sm">
          {toc.map((item, index) => {
            const isActive = activeId === item.id
            
            return (
              <li key={`${item.id}-${index}`}>
                <button
                  onClick={() => handleClick(item.id)}
                  className={`w-full text-left py-1.5 px-2 border-l-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                  style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                >
                  <span className="line-clamp-1">{item.text}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

