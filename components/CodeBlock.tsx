'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
  node?: any
  [key: string]: any
}

export default function CodeBlock({ inline, className, children, node, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  
  // 从 className 中提取语言类型（如 "language-javascript" -> "javascript"）
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  
  // 获取代码内容
  const code = String(children).replace(/\n$/, '')

  // 复制代码到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // 检测是否为行内代码
  // 方法1: 使用 inline 属性（react-markdown 传递）
  // 方法2: 没有 className 并且没有换行符，通常是行内代码
  // 方法3: 检查 node.position 或其他特征
  const isInline = inline || (!className && !code.includes('\n'))


  // 如果是行内代码 (`xxx`)，只显示简单高亮，无代码块背景和复制按钮
  if (isInline) {
    return (
      <code
        className="bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-pink-200 dark:border-pink-800/30"
        {...props}
      >
        {children}
      </code>
    )
  }

  // 语言显示名映射
  const languageNames: Record<string, string> = {
    js: 'JavaScript',
    jsx: 'React JSX',
    ts: 'TypeScript',
    tsx: 'React TSX',
    py: 'Python',
    go: 'Go',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    rust: 'Rust',
    sh: 'Shell',
    bash: 'Bash',
    shell: 'Shell',
    sql: 'SQL',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    md: 'Markdown',
    markdown: 'Markdown',
  }

  const displayLanguage = languageNames[language] || language.toUpperCase() || 'TEXT'

  // 代码块
  return (
    <div className="relative group my-6 not-prose">
      {/* 语言标签和复制按钮 */}
      <div className="flex items-center justify-between bg-gray-700 dark:bg-gray-900 text-gray-300 text-xs font-medium px-4 py-2 rounded-t-lg border-b border-gray-600 dark:border-gray-800">
        <span className="font-semibold">
          {displayLanguage}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={copied ? '已复制！' : '复制代码'}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">已复制</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* 代码高亮 */}
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || 'text'}
        PreTag="div"
        className="!mt-0 !rounded-t-none !rounded-b-lg overflow-hidden"
        showLineNumbers={true}
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          backgroundColor: '#1e1e1e',
        }}
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          color: '#858585',
          userSelect: 'none',
        }}
        {...props}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

