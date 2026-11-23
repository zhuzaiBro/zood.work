import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, ListRows, TextLines } from '@/components/ui/LoadingLayout'

export default function QuestionLoading() {
  return (
    <LoadingFrame label="正在加载题目" className="-mt-20 min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 pb-12 pt-32">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full shrink-0 lg:w-80">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 lg:hidden">
              <Skeleton className="h-5 w-40" /><Skeleton className="mt-0.5 h-4 w-24" />
            </div>
            <div className="hidden rounded-lg border border-slate-200 bg-white p-4 lg:block">
              <Skeleton className="h-5 w-40" /><Skeleton className="mt-4 h-10" /><ListRows count={6} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-6 h-6 w-24" />
            <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8">
              <Skeleton className="h-6 w-24" /><Skeleton className="mb-8 mt-4 h-9 w-3/4" /><TextLines count={8} />
            </div>
          </div>
          <div className="hidden w-56 shrink-0 xl:block 2xl:w-64"><TextLines count={4} /></div>
        </div>
      </div>
    </LoadingFrame>
  )
}
