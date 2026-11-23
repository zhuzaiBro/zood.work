import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, ListRows } from '@/components/ui/LoadingLayout'

export default function InboxLoading() {
  return (
    <LoadingFrame label="正在加载客服收件箱" className="mx-auto max-w-7xl space-y-4">
      <Skeleton className="h-8 w-36" /><Skeleton className="h-14" />
      <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="border-b p-4 lg:border-b-0 lg:border-r"><Skeleton className="h-6 w-20" /><ListRows /></div>
        <div className="min-w-0 p-4">
          <Skeleton className="h-6 w-28" /><Skeleton className="my-5 h-16 w-2/3" />
          <Skeleton className="ml-auto h-12 w-1/2" /><Skeleton className="mt-5 h-16" />
        </div>
      </div>
    </LoadingFrame>
  )
}
