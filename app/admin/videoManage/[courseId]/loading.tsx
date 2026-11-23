import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, ListRows } from '@/components/ui/LoadingLayout'

export default function CourseLessonsLoading() {
  return (
    <LoadingFrame label="正在加载课程章节" className="space-y-4">
      <Skeleton className="h-5 w-44" />
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <Skeleton className="h-8 w-8 shrink-0" /><Skeleton className="h-[54px] w-[72px] shrink-0" />
        <div className="min-w-0 flex-1"><Skeleton className="h-6 w-44" /><Skeleton className="mt-2 h-4 w-28" /></div>
        <Skeleton className="hidden h-8 w-40 md:block" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6"><ListRows count={5} /></div>
    </LoadingFrame>
  )
}
