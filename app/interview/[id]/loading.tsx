import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, ListRows } from '@/components/ui/LoadingLayout'

export default function CollectionLoading() {
  return (
    <LoadingFrame label="正在加载题集" className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-8 h-7 w-24" />
        <div className="flex flex-col items-start gap-6 md:flex-row">
          <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
          <div className="min-w-0 w-full"><Skeleton className="mb-2 h-9 w-2/3" /><Skeleton className="h-7 w-3/4" />
            <div className="mt-4 flex flex-wrap gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-11 w-24" />)}</div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b bg-slate-50 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
            <div><Skeleton className="h-7 w-20" /><Skeleton className="mt-1 h-4 w-44" /></div>
            <div className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_140px_140px] xl:w-[680px]">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-10" />)}
            </div>
          </div>
          <div className="px-5"><ListRows count={6} /></div>
        </div>
      </div>
    </LoadingFrame>
  )
}
