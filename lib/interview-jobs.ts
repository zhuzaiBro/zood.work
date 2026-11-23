export const interviewJobs = [
  { slug: 'programmer', name: '程序员' },
  { slug: 'design', name: '设计' },
  { slug: 'cross-border-ops', name: '跨境电商运营' },
  { slug: 'crypto-bd', name: '加密行业BD' },
  { slug: 'cross-border-bd', name: '跨境电商BD' },
  { slug: 'crypto-ops', name: '加密行业运营' },
] as const

export type InterviewJobSlug = (typeof interviewJobs)[number]['slug']

export function interviewJob(slug: string | undefined) {
  return interviewJobs.find((job) => job.slug === slug) ?? null
}

export function interviewIndexRequest(role: string | undefined, tag?: string) {
  const requestedJob = interviewJob(role)
  const unknownJob = Boolean(role) && !requestedJob
  const activeJob = requestedJob ?? interviewJobs[0]
  const technical = activeJob.slug === 'programmer' && !unknownJob

  if (unknownJob) {
    return {
      unknownJob: true as const,
      technical: false as const,
      activeSlug: '',
      activeName: '',
      path: null,
    }
  }

  const query = new URLSearchParams()
  if (!technical) query.set('role', activeJob.slug)
  if (technical && tag) query.set('tag', tag)
  const search = query.toString()

  return {
    unknownJob: false as const,
    technical,
    activeSlug: activeJob.slug,
    activeName: activeJob.name,
    path: search ? `/api/platform/interview?${search}` : '/api/platform/interview',
  }
}
