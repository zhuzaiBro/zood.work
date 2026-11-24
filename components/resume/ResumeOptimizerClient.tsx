'use client'

import { type FormEvent, useMemo, useRef, useState } from 'react'
import { PaperClipOutlined } from '@ant-design/icons'
import type { ResumeExperienceLevel } from '@/lib/agents/resumeOptimizationAgent'
import type { ResumeReportData } from '@/lib/resume/schema'
import { draftResume, exampleDocument, exampleResume, exampleRole } from '@/lib/resume/draft'
import type { ResumeStyle } from '@/lib/resume/templates'
import ResumeReport from './ResumeReport'

const input = 'mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm'
const label = 'text-sm font-semibold text-slate-800'

export default function ResumeOptimizerClient() {
  const [role, setRole] = useState(exampleRole)
  const [level, setLevel] = useState<ResumeExperienceLevel>('mid')
  const [resume, setResume] = useState('')
  const [job, setJob] = useState('')
  const [file, setFile] = useState('')
  const [result, setResult] = useState<ResumeReportData | null>(null)
  const [pending, setPending] = useState<'upload' | 'report' | null>(null)
  const [error, setError] = useState('')
  const [template, setTemplate] = useState<ResumeStyle>('classic')
  const [original, setOriginal] = useState(false)
  const [panel, setPanel] = useState<'edit' | 'preview'>('preview')
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const resumeInput = useRef<HTMLTextAreaElement>(null)
  const length = resume.trim().length
  const draft = useMemo(() => resume.trim() ? draftResume(resume, role) : exampleDocument, [resume, role])
  const showingResult = !!result && !original

  function updateResume(text: string) {
    setResume(text)
    setResult(null)
    setError('')
  }

  function showPreview() {
    setPanel('preview')
    requestAnimationFrame(() => resultHeading.current?.focus())
  }

  function fillExample() {
    updateResume(exampleResume)
    setFile('')
    resumeInput.current?.focus()
  }

  async function upload(selected?: File) {
    if (!selected || pending) return
    setPending('upload')
    setError('')
    try {
      if (selected.size > 20 * 1024 * 1024) throw new Error('简历文件不能超过 20 MB。')
      const isPdf = selected.type === 'application/pdf' || /\.pdf$/i.test(selected.name)
      if (!isPdf && selected.type !== 'text/plain' && !/\.txt$/i.test(selected.name)) {
        throw new Error('请选择 PDF 或 TXT 简历。')
      }
      let text: string
      if (isPdf) {
        try { text = await (await import('@/lib/resume/readPdf')).readPdf(selected) }
        catch { throw new Error('无法读取这份 PDF，请导入可复制文字的文件，或粘贴简历原文。') }
      } else {
        text = await selected.text()
      }
      if (text.trim().length < 20) throw new Error('提取到的简历文字太少，请粘贴原文或更换文件。')
      updateResume(text.trim())
      setFile(selected.name)
      showPreview()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '文件上传失败，请重试。')
    } finally {
      setPending(null)
    }
  }

  async function optimize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    if (role.trim().length < 2 || length < 80 || length > 20000) {
      setError('目标岗位至少需要 2 个字，简历原文需要 80 至 20,000 个字符。')
      return
    }
    setPending('report')
    setError('')
    try {
      const response = await fetch('/api/agents/resume-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume, targetRole: role, experienceLevel: level, jobDescription: job, language: 'zh', template }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(response.status === 400 && data.error ? data.error : '内容优化暂时不可用，你可以继续试排和导出原稿。')
      const { readResumeReport } = await import('@/lib/resume/schema')
      setResult(readResumeReport(data.result, draft, role))
      setOriginal(false)
      showPreview()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '生成失败，请重试。')
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <div className="mb-3 flex rounded-lg border border-slate-200 bg-white p-1 lg:hidden" aria-label="简历工作区">
        {(['edit', 'preview'] as const).map(key => <button key={key} type="button" aria-controls={key === 'edit' ? 'resume-editor' : 'resume-report'}
          aria-pressed={panel === key} onClick={() => setPanel(key)}
          className="min-h-10 flex-1 rounded-md text-sm font-semibold text-slate-600 aria-pressed:bg-[#eaf1fa] aria-pressed:text-[#234f90]">
          {key === 'edit' ? '编辑材料' : '预览简历'}
        </button>)}
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(285px,.64fr)_minmax(0,1.36fr)] xl:gap-6">
      <section id="resume-editor" className={`min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:block ${panel === 'edit' ? 'block' : 'hidden'}`} aria-labelledby="resume-materials">
        <header className="mb-5">
          <h2 id="resume-materials" className="text-2xl font-bold tracking-tight text-slate-950">投递材料</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">粘贴或导入简历，即可用自己的经历试排。</p>
        </header>
        <form method="post" onSubmit={optimize}>
          <fieldset disabled={pending !== null} className="min-w-0 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label className={label}>目标岗位
                <input className={input} value={role} onChange={e => { setRole(e.target.value); setResult(null) }} minLength={2} maxLength={120} required placeholder="例如：应用开发工程师" />
              </label>
              <label className={label}>经验阶段
                <select className={input} value={level} onChange={e => { setLevel(e.target.value as ResumeExperienceLevel); setResult(null) }}>
                  <option value="student">学生 / 转行准备</option><option value="junior">初级工程师</option>
                  <option value="mid">中级工程师</option><option value="senior">资深 / 负责人</option>
                </select>
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <label htmlFor="resume-original" className={label}>简历原文</label>
                <button type="button" onClick={fillExample} className="text-sm font-semibold text-blue-700 hover:underline disabled:text-slate-400 disabled:no-underline">{length ? '替换为示例' : '填入示例'}</button>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <textarea id="resume-original" ref={resumeInput} aria-describedby="resume-length" value={resume} onChange={e => updateResume(e.target.value)}
                  rows={6} minLength={80} maxLength={20000} required className="block min-h-36 w-full resize-y bg-white px-3 py-3 text-base leading-7 text-slate-900 outline-none placeholder:text-slate-500 sm:text-sm sm:leading-7"
                  placeholder="粘贴一段工作或项目经历，写下你负责的事、用过的方法和实际结果。" />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
                  <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded text-xs font-semibold text-blue-700 hover:underline focus-within:ring-2 focus-within:ring-blue-500">
                    <PaperClipOutlined aria-hidden /> {pending === 'upload' ? '正在读取文件…' : '上传 PDF / TXT'}
                    <input type="file" className="sr-only" aria-label="上传简历文件" accept=".pdf,.txt,application/pdf,text/plain"
                      onChange={e => { const selected = e.currentTarget.files?.[0]; e.currentTarget.value = ''; void upload(selected) }} />
                  </label>
                  <span id="resume-length" className="text-xs tabular-nums text-slate-600">{length.toLocaleString('zh-CN')} 字 · 至少 80 字</span>
                </div>
              </div>
              {file && <p className="mt-2 break-all text-xs leading-5 text-slate-600">
                  已导入 {file}
              </p>}
            </div>

            <details className="group rounded-lg border border-slate-200">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                岗位描述 <span className="font-normal text-slate-500">选填</span>
                <span aria-hidden="true" className="ml-auto text-lg leading-none text-slate-500 group-open:hidden">+</span>
                <span aria-hidden="true" className="ml-auto hidden text-lg leading-none text-slate-500 group-open:inline">−</span>
              </summary>
              <div className="px-3.5 pb-3"><textarea aria-label="目标岗位描述" value={job} onChange={e => { setJob(e.target.value); setResult(null) }} rows={3}
                maxLength={10000} placeholder="粘贴招聘要求，可以逐条对照岗位需要的能力。" className={input + ' !mt-0 resize-y'} /></div>
            </details>

            {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p>}
            <button type="submit" className="inline-flex min-h-11 min-w-40 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60">
              {pending === 'report' ? '正在优化…' : result ? '重新优化简历' : '优化简历内容'} <span aria-hidden="true">→</span>
            </button>
            {length > 0 && <button type="button" onClick={showPreview} className="ml-3 text-sm font-semibold text-blue-700 lg:hidden">查看试排</button>}
          </fieldset>
        </form>
      </section>

      <section id="resume-report" aria-labelledby="report-title" className={`min-w-0 overflow-hidden rounded-xl border border-[#d6dfe7] bg-white shadow-sm lg:block ${panel === 'preview' ? 'block' : 'hidden'}`}>
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <h2 id="report-title" ref={resultHeading} tabIndex={-1} className="scroll-mt-[calc(var(--site-header-height)+1rem)] text-2xl font-bold tracking-tight text-slate-950 outline-none">简历预览</h2>
          <span role="status" className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${showingResult ? 'bg-teal-600' : 'bg-slate-400'}`} />
            {pending === 'report' ? '正在优化内容…' : showingResult ? '你的优化稿' : length ? '你的原稿试排' : '示例简历'}
          </span>
        </header>
        <ResumeReport document={result && !original ? result.document : draft} template={template} onTemplate={setTemplate}
          result={result} original={original} onOriginal={setOriginal} />
      </section>
      </div>
    </>
  )
}
