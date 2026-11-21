'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { interviewJobs } from '@/lib/interview-jobs'

export default function RoleFilter({ activeSlug }: { activeSlug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectJob = (slug: string) => {
    if (slug === activeSlug) return
    const params = new URLSearchParams(searchParams.toString())
    if (slug === 'programmer') {
      params.delete('role')
    } else {
      params.set('role', slug)
      params.delete('tag')
    }
    const query = params.toString()
    router.push(query ? `/interview?${query}` : '/interview')
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2" aria-label="岗位分类">
      {interviewJobs.map((job) => {
        const active = job.slug === activeSlug
        return (
          <button
            key={job.slug}
            type="button"
            onClick={() => selectJob(job.slug)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              active
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'
            }`}
          >
            {job.name}
          </button>
        )
      })}
    </div>
  )
}
