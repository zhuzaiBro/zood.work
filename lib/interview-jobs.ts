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
