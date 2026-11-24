import { resumeCss } from './styles.mjs'
import type { ResumeDocument, ResumeEntry } from './schema'

export const resumeStyles = ['classic', 'editorial', 'portfolio'] as const
export type ResumeStyle = typeof resumeStyles[number]
export const styleNames: Record<ResumeStyle, string> = { classic: '经典双栏', editorial: '单栏履历', portfolio: '项目优先' }

const labels = {
  zh: { title: '个人简历', summary: '个人简介', skills: '专业技能', work: '工作经历', projects: '项目经历', education: '教育背景', other: '补充信息', highlights: '经历亮点' },
  en: { title: 'Résumé', summary: 'Profile', skills: 'Skills', work: 'Experience', projects: 'Projects', education: 'Education', other: 'Additional information', highlights: 'Career highlights' },
}
type Language = keyof typeof labels
const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escape = (text: string) => text.replace(/[&<>"']/g, char => entities[char])

function list(items: string[], className: string) {
  return items.length ? `<ul class="${className}">${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : ''
}

function entry(item: ResumeEntry) {
  return `<div class="cv-entry"><div class="cv-entry-line">
    ${item.title ? `<h4>${escape(item.title)}</h4>` : ''}
    ${item.dates ? `<span class="cv-date">${escape(item.dates)}</span>` : ''}</div>
    ${item.subtitle ? `<p class="cv-subtitle">${escape(item.subtitle)}</p>` : ''}
    ${list(item.points, 'cv-points')}${list(item.tags, 'cv-tags')}</div>`
}

// Only this renderer owns markup. Every field supplied by a person or the model is text.
export function renderResumeBody(doc: ResumeDocument, style: ResumeStyle, language: Language = 'zh') {
  const l = labels[language]
  function section(id: Exclude<keyof typeof l, 'title'>, content: string) {
    return content ? `<section class="cv-section cv-${id}"><h3>${l[id]}</h3>${content}</section>` : ''
  }
  const summary = section('summary', doc.summary && `<p class="cv-summary-text">${escape(doc.summary)}</p>`)
  const highlights = section('highlights', list(doc.highlights ?? [], 'cv-points'))
  const skills = section('skills', doc.skills.map(group => `<div class="cv-skill-group">
    ${group.label ? `<h4>${escape(group.label)}</h4>` : ''}${list(group.items, 'cv-tags')}</div>`).join(''))
  const work = section('work', doc.work.map(entry).join(''))
  const projects = section('projects', doc.projects.map(entry).join(''))
  const education = section('education', doc.education.map(entry).join(''))
  const other = section('other', list(doc.other, 'cv-points'))
  let body = summary + highlights + work + projects + skills + education + other
  if (style === 'classic') {
    const side = summary + skills + education
    const main = highlights + work + projects + other
    body = side && main
      ? `<div class="cv-columns"><div class="cv-side">${side}</div><div class="cv-main">${main}</div></div>`
      : side + main
  } else if (style === 'portfolio') {
    body = projects + highlights + summary + work + skills + education + other
  }
  return `<article class="cv cv-${style}" lang="${language === 'zh' ? 'zh-CN' : 'en'}">
    <header class="cv-header"><div><h2>${escape(doc.name || l.title)}</h2>
    ${doc.role ? `<p class="cv-role">${escape(doc.role)}</p>` : ''}</div>${list(doc.contacts, 'cv-contacts')}</header>
    <div class="cv-body">${body}</div></article>`
}

export function resumeHtml(body: string, language: Language = 'zh') {
  return `<!doctype html><html lang="${language === 'zh' ? 'zh-CN' : 'en'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${labels[language].title}</title>
<style>${resumeCss}
@page{size:A4;margin:10mm}body{margin:0;background:#eff2f4}.cv-surface{max-width:210mm;margin:24px auto;background:white}
@media print{body{background:white}.cv-surface{max-width:none;margin:0;container-type:normal}}
</style></head><body><main class="cv-surface">${body}</main></body></html>`
}
