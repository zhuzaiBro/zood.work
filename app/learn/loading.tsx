import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines, ListRows } from '@/components/ui/LoadingLayout'

export default function PlayerLoading() {
  return (
    <LoadingFrame label="正在加载课程播放器" className="min-h-screen bg-gradient-to-b from-[#f7fbff] to-slate-50">
      <div className="border-b border-white/70 bg-white">
        <div className="mx-auto flex max-w-[1680px] items-center gap-3 px-4 pb-4 pt-5 sm:px-6 xl:px-8">
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1"><Skeleton className="h-4 w-16" /><Skeleton className="mt-0.5 h-6 w-40" /></div>
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1720px] gap-4 px-4 py-6 sm:px-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:gap-6 xl:px-8 xl:py-8 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="self-start overflow-hidden rounded-[30px] border border-slate-200 bg-white">
          <div className="border-b px-4 py-3"><Skeleton className="h-11" /></div>
          <div className="px-4 py-4"><Skeleton className="h-5 w-24" /><Skeleton className="mt-3 h-16" /><ListRows count={3} /></div>
        </div>
        <div className="min-w-0">
          <Skeleton className="aspect-video rounded-2xl" />
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><TextLines /></div>
        </div>
      </div>
    </LoadingFrame>
  )
}
