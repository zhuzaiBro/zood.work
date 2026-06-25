'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { isRunnableLanguage } from '@/lib/codePlayground'

interface CodeBlockProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
  node?: any
  onRunCode?: (payload: { code: string; language: string; title: string }) => void
  [key: string]: any
}

export default function CodeBlock({
  inline,
  className,
  children,
  node,
  onRunCode,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  
  // 从 className 中提取语言类型（如 "language-javascript" -> "javascript"）
  const match = /language-([\w-]+)/.exec(className || '')
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

  // 检测是否为行内代码 `xxx` ``` xxx ```
  // 方法1: 使用 inline 属性（react-markdown 传递）
  // 方法2: 没有 className 并且没有换行符，通常是行内代码
  // 方法3: 检查 node.position 或其他特征
  const isInline = inline || (!className && !code.includes('\n'))


  // 如果是行内代码 (`xxx`)，只显示简单高亮，无代码块背景和复制按钮
  if (isInline) {
    return (
      <code
        className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-700"
        {...props}
      >
        {children}
      </code>
    )
  }

  // 语言显示名映射
  const languageNames: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    jsx: 'React JSX',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    tsx: 'React TSX',
    py: 'Python',
    python: 'Python',
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
    solidity: 'Solidity',
    text: 'Plain Text',
  }

  const displayLanguage = languageNames[language] || language.toUpperCase() || 'Plain Text'
  const canRun = Boolean(onRunCode && isRunnableLanguage(language))

  const handleRun = () => {
    if (!onRunCode || !canRun) return
    onRunCode({
      code,
      language,
      title: displayLanguage,
    })
  }

  return (
    <div className="not-prose my-7 overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fa] shadow-sm">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 text-slate-500">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">▾</span>
          <span className="text-base font-medium text-slate-600">代码块</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600">
            {displayLanguage}
          </span>
          <span className="h-5 w-px bg-slate-200" />
          <span className="hidden rounded-lg px-2 py-1 text-sm font-medium text-slate-500 sm:inline">
            自动换行
          </span>
          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          {canRun && (
            <button
              onClick={handleRun}
              className="group inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#2563eb_0%,#6366f1_48%,#a855f7_100%)] px-3 py-1.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(99,102,241,0.45)] transition hover:scale-[1.02] hover:shadow-[0_8px_26px_rgba(168,85,247,0.5)] focus:outline-none focus:ring-2 focus:ring-violet-200 active:scale-[0.98]"
              title="在线运行这段代码"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 font-mono text-[11px] leading-none">
                &gt;_
              </span>
              <span>在线运行</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            title={copied ? '已复制！' : '复制代码'}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[56px_minmax(0,1fr)] px-0 py-4">
        <div className="select-none border-r border-slate-200 px-3 text-right font-mono text-sm leading-6 text-slate-400">
          {Array.from({ length: Math.max(1, code.split('\n').length) }).map((_, index) => (
            <div key={`line-${index}`}>{index + 1}</div>
          ))}
        </div>

        <SyntaxHighlighter
          style={oneLight}
          language={language || 'text'}
          PreTag="div"
          wrapLongLines
          customStyle={{
            margin: 0,
            padding: '0 1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5rem',
            overflow: 'visible',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
            },
          }}
          showLineNumbers={false}
          {...props}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
