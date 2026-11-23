import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines } from '@/components/ui/LoadingLayout'

export default function ResumeLoading() {
  return (
    <LoadingFrame label="正在加载简历优化工具" className="dark-bones -mt-20 min-h-screen bg-[#02050b] pt-[calc(var(--site-header-height)+1.5rem)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div className="min-w-0 rounded-[2rem] border border-sky-300/15 bg-[#07101f] p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1"><Skeleton className="mb-2 h-8 w-48" /><TextLines count={2} /></div>
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
          <div className="mt-6 space-y-4">
            {[0, 1].map(i => <div key={i}><Skeleton className="h-5 w-16" /><Skeleton className="mt-2 h-12 rounded-2xl" /></div>)}
            <div className="rounded-3xl border border-sky-300/15 p-4"><Skeleton className="mb-3 h-5 w-24" /><TextLines count={2} /><Skeleton className="mt-3 h-10 w-28" /></div>
            <div><Skeleton className="h-5 w-24" /><Skeleton className="mt-2 h-80 rounded-3xl" /></div>
            <div><Skeleton className="h-5 w-28" /><Skeleton className="mt-2 h-28 rounded-3xl" /></div>
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        </div>
        <div className="min-w-0 rounded-[2rem] border border-sky-300/15 bg-[#06101f] p-5 sm:p-7">
          <Skeleton className="mb-4 h-8 w-32" /><Skeleton className="h-5 w-2/3" /><Skeleton className="mt-6 h-72 rounded-3xl" />
        </div>
      </div>
    </LoadingFrame>
  )
}
