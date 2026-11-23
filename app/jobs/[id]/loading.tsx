import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines } from '@/components/ui/LoadingLayout'

export default function JobDetailLoading() {
  return (
    <LoadingFrame label="正在加载岗位详情" className="min-h-screen bg-[#f5f8fc]">
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-7 w-28" />
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 shrink-0" />
              <div className="flex-1"><Skeleton className="h-6 w-24" /><Skeleton className="mt-2 h-8 w-2/3" /><Skeleton className="mt-1.5 h-6 w-28" /></div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map(item => <Skeleton key={item} className="h-[76px]" />)}
            </div>
            <Skeleton className="mt-8 h-6 w-36" />
            <div className="mt-10"><Skeleton className="mb-4 h-7 w-24" /><TextLines count={7} /></div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Skeleton className="mb-5 h-7 w-24" /><Skeleton className="h-11" />
          </div>
        </div>
      </div>
    </LoadingFrame>
  )
}
