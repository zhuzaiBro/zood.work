import { z } from 'zod'

const text = z.string().trim().nullish().transform(value => value ?? '')
export const lines = z.array(z.string().trim()).nullish().transform(value => value?.filter(Boolean) ?? [])
const entry = z.object({ title: text, subtitle: text, dates: text, points: lines, tags: lines })
const entries = z.array(entry).nullish().transform(value => (value ?? []).filter(item =>
  item.title || item.subtitle || item.dates || item.points.length || item.tags.length))
const skills = z.array(z.object({ label: text, items: lines })).nullish()
  .transform(value => (value ?? []).filter(group => group.items.length))

export const resumeDocumentSchema = z.object({
  name: text, role: text, contacts: lines, summary: text, skills,
  work: entries, projects: entries, education: entries, other: lines, highlights: lines.optional(),
}).refine(doc => Boolean(doc.summary || doc.skills.length || doc.work.length ||
  doc.projects.length || doc.education.length || doc.other.length))

export type ResumeDocument = z.infer<typeof resumeDocumentSchema>
export type ResumeEntry = z.infer<typeof entry>

const feedback = z.object({
  document: resumeDocumentSchema.optional(), rewrittenSummary: text, optimizedBullets: lines,
  score: z.number().min(0).max(100), positioning: text, coreProblems: lines,
  keywords: lines, actionPlan: lines, interviewStories: lines,
})

export function readResumeReport(value: unknown, original: ResumeDocument, role: string) {
  const response = feedback.safeParse(value)
  if (!response.success || !(response.data.document || response.data.rewrittenSummary || response.data.optimizedBullets.length)) {
    throw new Error('本次没有收到可排版的优化内容，你可以继续试排原稿。')
  }
  const { document, rewrittenSummary, optimizedBullets, ...advice } = response.data
  // The existing API returns rewritten points without employer or project IDs.
  // Keep them together rather than attaching them to an unrelated experience.
  const originalPoints = new Set([...original.work, ...original.projects].flatMap(item => item.points))
  return {
    ...advice, document: document ?? {
      ...original, role, summary: rewrittenSummary || original.summary,
      highlights: optimizedBullets.filter(point => !originalPoints.has(point)),
    },
  }
}

export type ResumeReportData = ReturnType<typeof readResumeReport>
