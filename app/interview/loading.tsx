import QuestionPreviewLoading from '@/components/interview/QuestionPreviewLoading'
import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, ListRows } from '@/components/ui/LoadingLayout'

export default function InterviewLoading() {
  return (
    <LoadingFrame label="正在加载面试题库" className="min-h-screen bg-[#f5f8fc] pb-16">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:px-6 md:gap-x-3 md:gap-y-1 md:pb-0 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(180px,248px)_auto] xl:py-0">
          <Skeleton className="col-start-1 row-start-1 h-11 w-full max-w-48 md:hidden" />
          <div className="col-span-full row-start-2 hidden h-12 items-center gap-5 md:flex xl:col-span-1 xl:col-start-1 xl:row-start-1 xl:h-16">
            {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-5 w-16 lg:w-20" />)}
          </div>
          <Skeleton className="col-span-full col-start-1 row-start-2 h-11 w-full md:col-span-1 md:row-start-1 xl:col-start-2" />
          <Skeleton className="col-start-2 row-start-1 h-11 w-24 xl:col-start-3" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <Skeleton className="h-7 w-60 sm:h-8" /><Skeleton className="h-9 w-72" />
        </div>
        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          <div className="dark-bones flex flex-col bg-[#102744] p-5 sm:p-7">
            <Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-9 w-3/4" /><Skeleton className="mt-2 h-6 w-full" /><Skeleton className="mt-1 h-4 w-1/2 md:hidden" />
            <div className="mt-auto pt-5"><Skeleton className="h-11 w-28" /></div>
          </div>
          <div className="flex min-w-0 flex-col px-5 pb-1 pt-4 sm:px-7 sm:pb-3 sm:pt-6">
            <div className="border-b border-slate-200 pb-3"><Skeleton className="h-5 w-20" /></div>
            <QuestionPreviewLoading />
          </div>
        </div>
        <Skeleton className="mb-3 mt-7 h-6 w-24" />
        <div className="grid gap-x-8 rounded-xl border border-slate-200 bg-white px-4 sm:px-5 md:grid-cols-2">
          {[0, 1].map(i => <ListRows key={i} count={3} />)}
        </div>
      </div>
    </LoadingFrame>
  )
}
