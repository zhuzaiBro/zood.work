import Skeleton from '@/components/ui/Skeleton'

export default function QuestionPreviewLoading({ count = 3 }: { count?: number }) {
  return (
    <div aria-label="正在加载题目预览" role="status" className="route-loading flex flex-1 flex-col divide-y divide-slate-100">
      {Array.from({ length: Math.min(count, 3) }, (_, i) => (
        <div key={i} className="flex flex-1 items-center gap-3 py-4 sm:gap-4">
          <div className="min-w-0 flex-1">
            <Skeleton className="my-1 h-4 w-3/4" />
            <div className="h-6 pt-1 lg:hidden"><Skeleton className="h-4 w-1/2" /></div>
          </div>
          <Skeleton className="h-6 w-10" /><Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  )
}
