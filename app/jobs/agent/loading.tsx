import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame } from '@/components/ui/LoadingLayout'

export default function AgentLoading() {
  return (
    <LoadingFrame label="正在加载岗位助手" className="min-h-screen bg-[#f5f8fc]">
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.65fr_1.35fr] lg:px-8 lg:py-10">
        <div>
          <Skeleton className="h-8 w-24" /><Skeleton className="mt-3 h-7 w-full" />
          <div className="mt-8 flex flex-wrap gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-9 w-24" />)}</div>
          <Skeleton className="mt-8 h-5 w-48" />
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-1 sm:p-2">
          <div className="border-b border-slate-200 px-4 py-3"><Skeleton className="h-5 w-20" /></div>
          <div className="flex h-[min(520px,70vh)] flex-col">
            <div className="flex-1 px-4 py-6"><Skeleton className="h-16 w-2/3" /></div>
            <div className="flex gap-3 border-t p-4"><Skeleton className="h-12 flex-1" /><Skeleton className="h-12 w-16" /></div>
          </div>
        </div>
      </div>
    </LoadingFrame>
  )
}
