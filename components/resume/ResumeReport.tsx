'use client'

import { useMemo, useRef, useState } from 'react'
import type { ResumeDocument, ResumeReportData } from '@/lib/resume/schema'
import { renderResumeBody, resumeHtml, resumeStyles, styleNames, type ResumeStyle } from '@/lib/resume/templates'
import { resumeCss } from '@/lib/resume/styles.mjs'
import styles from './ResumeReport.module.css'

type Props = {
  document: ResumeDocument
  template: ResumeStyle
  onTemplate: (style: ResumeStyle) => void
  result: ResumeReportData | null
  original: boolean
  onOriginal: (original: boolean) => void
}

export default function ResumeReport({ document: doc, template, onTemplate, result, original, onOriginal }: Props) {
  const [notice, setNotice] = useState('')
  const sheet = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const body = useMemo(() => renderResumeBody(doc, template), [doc, template])

  async function copy() {
    try { await navigator.clipboard.writeText(sheet.current?.innerText ?? ''); setNotice('已复制简历正文。') }
    catch { setNotice('可直接选中预览中的文字复制。') }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([resumeHtml(body)], { type: 'text/html;charset=utf-8' }))
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${doc.name || '个人简历'}-${styleNames[template]}.html`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function print() {
    const paper = frame.current?.contentWindow
    if (!paper) return
    paper.document.open()
    paper.document.write(resumeHtml(body))
    paper.document.close()
    paper.focus()
    paper.print()
  }

  return <>
    <fieldset className="grid min-w-0 grid-cols-3 gap-2 px-4 pb-5 sm:gap-3 sm:px-6">
      <legend className="sr-only">选择简历样式</legend>
      {resumeStyles.map((id, index) => <label key={id} className={styles.option}>
        <input type="radio" name="resume-style" checked={template === id} onChange={() => onTemplate(id)} />
        <span className={styles.tile}>
          <span className={styles.thumb} data-look={id} aria-hidden="true"><i /><b /><em /></span>
          <span><span className={styles.number}>样式 {index + 1}</span><strong>{styleNames[id]}</strong></span>
          <span className={styles.check} aria-hidden="true">✓</span>
        </span>
      </label>)}
    </fieldset>

    <div className="border-t border-[#d4dfe8] bg-[#e9eff3] p-3 sm:p-5 lg:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#4e6174]">
        {result ? <div className="flex rounded-md border border-[#bccbd7] bg-white p-0.5" aria-label="对照原稿和优化稿">
          {([false, true] as const).map(raw => <button type="button" key={String(raw)} aria-pressed={original === raw} onClick={() => onOriginal(raw)}
            className="rounded px-2.5 py-1.5 font-semibold aria-pressed:bg-[#e2ecf9] aria-pressed:text-blue-800">{raw ? '看原稿' : '看优化稿'}</button>)}
        </div> : <span className="font-medium tracking-wide">A4 纵向</span>}
        <div className={styles.tools} aria-label="当前简历的导出操作">
          <button type="button" onClick={copy}>复制正文</button>
          <button type="button" onClick={download}>下载 HTML</button>
          <button type="button" onClick={print}>导出 PDF <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      {notice && <p role="status" className="mb-2 text-xs text-blue-800">{notice}</p>}
      <style>{resumeCss}</style>
      <div ref={sheet} className={'cv-surface ' + styles.sheet} aria-label="当前简历版式" dangerouslySetInnerHTML={{ __html: body }} />
      <iframe ref={frame} title="简历打印文档" aria-hidden="true" tabIndex={-1} sandbox="allow-same-origin allow-modals"
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px border-0 opacity-0" />
    </div>
    {result && <details className="border-t border-slate-200 px-5 py-4 text-sm text-slate-700 sm:px-6">
      <summary className="cursor-pointer font-semibold text-slate-900">查看优化建议 <span className="ml-2 font-normal text-slate-500">岗位匹配度 {result.score} / 100</span></summary>
      <p className="mt-4 leading-7">{result.positioning}</p>
      {[
        { title: '可改进之处', items: result.coreProblems }, { title: '岗位关键词', items: result.keywords },
        { title: '下一步行动', items: result.actionPlan }, { title: '面试可展开的经历', items: result.interviewStories },
      ].filter(group => group.items.length).map(group => <section key={group.title} className="mt-3">
        <h3 className="font-semibold text-slate-900">{group.title}</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 leading-6">{group.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
      </section>)}
    </details>}
  </>
}
