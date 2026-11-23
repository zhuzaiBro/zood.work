'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CodeOutlined, HighlightOutlined, ShopOutlined, LinkOutlined, GlobalOutlined, ApartmentOutlined } from '@ant-design/icons'
import { interviewJobs } from '@/lib/interview-jobs'

const jobIcons = {
  programmer: CodeOutlined,
  design: HighlightOutlined,
  'cross-border-ops': ShopOutlined,
  'crypto-bd': LinkOutlined,
  'cross-border-bd': GlobalOutlined,
  'crypto-ops': ApartmentOutlined,
}

export default function RoleFilter({ activeSlug }: { activeSlug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedSlug = searchParams.get('q') ? '' : activeSlug

  const selectJob = (slug: string) => {
    if (slug === activeSlug && !searchParams.has('q')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    if (slug === 'programmer') {
      params.delete('role')
    } else {
      params.set('role', slug)
      params.delete('tag')
    }
    const query = params.toString()
    router.push(query ? `/interview?${query}` : '/interview', { scroll: false })
  }

  return (
    <>
      <select
        value={selectedSlug}
        onChange={(event) => selectJob(event.currentTarget.value)}
        aria-label="岗位分类"
        className="col-start-1 row-start-1 h-11 w-full max-w-48 rounded-lg border border-slate-200 bg-white px-2 text-base font-semibold text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 md:hidden"
      >
        {!selectedSlug && <option value="" disabled>选择岗位</option>}
        {interviewJobs.map((job) => <option key={job.slug} value={job.slug}>{job.name}</option>)}
      </select>
      <nav className="col-span-full row-start-2 -mb-px hidden flex-wrap items-center gap-x-4 md:flex lg:gap-x-6 xl:col-span-1 xl:col-start-1 xl:row-start-1" aria-label="岗位分类">
        {interviewJobs.map((job) => {
          const active = job.slug === selectedSlug
          const Icon = jobIcons[job.slug]
          return (
            <button
              key={job.slug}
              type="button"
              onClick={() => selectJob(job.slug)}
              aria-pressed={active}
              className={`flex min-h-12 items-center xl:min-h-16 gap-2 border-b-2 px-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${
                active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'
              }`}
            >
              <Icon aria-hidden="true" className="!hidden text-base lg:!inline-flex" />
              {job.name}
            </button>
          )
        })}
      </nav>
    </>
  )
}
