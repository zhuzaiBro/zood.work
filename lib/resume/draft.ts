import type { ResumeDocument, ResumeEntry } from './schema'

export const exampleRole = 'Web3 / AI 全栈开发工程师'
export const exampleResume = `姓名：林舟
求职意向：应用开发工程师
杭州 · lin.zhou@example.com

个人简介
专注于学习产品与内容工具的应用开发，熟悉从页面实现、接口联调到上线排查的完整流程。喜欢把复杂的业务步骤整理成清晰、可靠的交互。

专业技能
应用开发：TypeScript、React、Next.js
服务与数据：Node.js、PostgreSQL
工程协作：Git、Playwright

工作经历
远帆数字工作室｜应用开发工程师｜2023.07 — 至今
- 负责在线课程的学习页与内容后台，和设计师一起梳理报名、学习及回看流程。
- 将课程进度写入与异常重试封装为公共模块，维护发布前的回归用例。

栖木产品实验室｜前端开发实习生｜2022.06 — 2022.12
- 实现活动报名页与名单导出，协助运营核对报名记录和邮件送达状态。

项目经历
课程内容工作台｜主要开发｜2024.03 — 2024.09
- 为教研团队搭建课程编辑、预览与发布流程，统一处理草稿和已发布版本。
- 与后端约定版本校验规则，避免多人编辑时覆盖他人的修改。
技术栈：Next.js、TypeScript、PostgreSQL

学习资料检索助手｜应用开发｜2023.10 — 2024.02
- 接入课程讲义并整理检索结果，让学员能从回答跳回原文段落。
技术栈：Node.js、向量检索

教育背景
软件工程｜工学学士｜2019.09 — 2023.06`

const sections = {
  summary: /^(个人简介|个人优势|个人总结|自我介绍|自我评价|职业概述|summary|profile|about me)$/i,
  skills: /^(技能|技能清单|专业技能|技术技能|核心技能|技能特长|skills|technical skills)$/i,
  work: /^(工作经历|工作经验|职业经历|实习经历|experience|work experience|professional experience|employment)$/i,
  projects: /^(项目|项目经历|项目经验|项目实践|作品|projects|selected projects)$/i,
  education: /^(教育|教育经历|教育背景|学历信息|学历|education)$/i,
  other: /^(其他|补充信息|荣誉奖项|证书|获奖经历|certifications|awards|additional information)$/i,
}
type Section = keyof typeof sections
const sectionNames = Object.keys(sections) as Section[]
const stripBullet = (line: string) => line.replace(/^(?:[-*•●▪]\s*|\d+[.、)]\s*)/, '').trim()
const splitItems = (line: string) => line.split(/[、,，;；|｜]/).map(part => part.trim()).filter(Boolean)

function readEntries(lines: string[]): ResumeEntry[] {
  const entries: ResumeEntry[] = []
  let current: ResumeEntry | undefined
  for (const line of lines) {
    if (!line) { current = undefined; continue }
    const labels = line.match(/^(?:技术栈|项目标签|工具|tags|stack)\s*[:：]\s*(.*)/i)
    const isHeader = !labels && stripBullet(line) === line && line.length < 90
    if (!current || (isHeader && /[|｜\t]/.test(line))) {
      current = { title: '', subtitle: '', dates: '', points: [], tags: [] }
      entries.push(current)
      if (isHeader) {
        const [title, ...parts] = line.split(/\s*[|｜\t]\s*/).filter(Boolean)
        const last = parts.at(-1)
        if (last && /\d{4}/.test(last)) current.dates = parts.pop()!
        current.title = title
        current.subtitle = parts.join(' · ')
        continue
      }
    }
    if (labels) current.tags.push(...splitItems(labels[1]))
    else current.points.push(stripBullet(line))
  }
  return entries
}

// Preview the original wording while typing. Unclassified lines stay in the document.
export function draftResume(raw: string, targetRole: string): ResumeDocument {
  const groups: Record<Section, string[]> = { summary: [], skills: [], work: [], projects: [], education: [], other: [] }
  const contacts: string[] = []
  let name = ''
  let role = ''
  let section: Section = 'summary'
  let inHeader = true
  const sourceLines = raw.trim().split(/\r?\n/).flatMap(line =>
    /@|(?:姓名|name|手机|电话)\s*[:：]/i.test(line) ? line.split(/\s*[|｜\t]\s*|\s+·\s+/) : [line])
  for (const [index, source] of sourceLines.entries()) {
    let line = source.trim()
    if (!line) { groups[section].push(''); continue }
    if (/^--\s*\d+ of \d+\s*--$/i.test(line)) continue
    const heading = line.replace(/^#{1,4}\s*/, '').split(/[:：]/, 1)[0].trim()
    const found = sectionNames.find(key => sections[key].test(heading))
    if (found) {
      section = found
      inHeader = false
      line = line.slice(line.indexOf(heading) + heading.length).replace(/^\s*[:：]\s*/, '').trim()
      if (!line) continue
    }
    if (inHeader) {
      const named = line.match(/^(?:姓名|name)\s*[:：]\s*(.+)$/i)
      const job = line.match(/^(?:求职意向|目标(?:岗位|职位)?|应聘岗位|target role|job title)\s*[:：]\s*(.+)$/i)
      if (named) { name = named[1]; continue }
      if (job) { role = job[1]; continue }
      if (/^(?:个人简历|简历|résumé|resume|curriculum vitae)$/i.test(line)) continue
      if (name && !role && line.length < 48 && /(?:工程师|开发|运营|设计师|经理|分析师|负责人|engineer|developer|designer|manager)$/i.test(line)) {
        role = line
        continue
      }
      if (/^(?:手机|电话|邮箱|所在地|现居地|城市|联系方式|email|phone|location|github|linkedin)\s*[:：]/i.test(line) ||
          (line.length < 140 && (/@\S+\.\S+|^(?:https?:\/\/|www\.)|^\+?[\d ()-]{7,24}$/.test(line))) ||
          (name && line.length <= 12 && [sourceLines[index - 1], sourceLines[index + 1]].some(text => text && /@\S+\.\S+/.test(text)))) {
        contacts.push(line)
        continue
      }
      if (!name && !groups.summary.some(Boolean) && /^(?:[\u3400-\u9fff]{2,4}|[A-Z][a-z'-]+(?: [A-Z][a-z'-]+){1,3})$/.test(line)) {
        name = line
        continue
      }
    }
    groups[section].push(line)
  }
  const skills = groups.skills.filter(Boolean).map(line => {
    const [first, ...rest] = stripBullet(line).split(/[:：]/)
    return { label: rest.length ? first : '', items: splitItems(rest.length ? rest.join('：') : first) }
  })
  return {
    name, role: role || targetRole, contacts, summary: groups.summary.join('\n').trim(), skills,
    work: readEntries(groups.work), projects: readEntries(groups.projects), education: readEntries(groups.education),
    other: groups.other.filter(Boolean).map(stripBullet),
  }
}

export const exampleDocument = draftResume(exampleResume, exampleRole)
