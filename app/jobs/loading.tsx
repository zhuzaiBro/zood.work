import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame } from '@/components/ui/LoadingLayout'

export default function JobsLoading() {
  return (
    <LoadingFrame label="正在加载岗位" className="min-h-[calc(100vh-var(--site-header-height))] bg-[#f5f8fc] pb-14">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8">
          <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2 sm:flex lg:max-w-3xl">
            <Skeleton className="col-span-2 h-11 flex-1" />
            <Skeleton className="my-3 h-4 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <Skeleton className="mb-4 h-7 w-44 sm:h-8" />
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {[0, 1, 2, 3].map(item => (
            <div key={item} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1"><Skeleton className="h-6 w-44" /><Skeleton className="mt-1 h-5 w-24" /></div>
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="mt-3 space-y-2 py-1"><Skeleton className="h-4" /><Skeleton className="h-4 w-2/3" /></div>
              <Skeleton className="mt-3 h-6 w-36" />
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="mt-1.5 h-5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingFrame>
  )
}
