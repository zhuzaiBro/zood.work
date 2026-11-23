import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines } from '@/components/ui/LoadingLayout'

export default function CategoryLoading() {
  return (
    <LoadingFrame label="正在加载分类文章" className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8"><Skeleton className="mb-4 h-5 w-36" /><Skeleton className="mb-3 h-10 w-48" />
          <Skeleton className="h-6 w-72" /><Skeleton className="mt-2 h-5 w-20" /></div>
        <div className="space-y-6">
          {[0, 1, 2].map(i => <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-6">
            <Skeleton className="mb-3 h-8 w-2/3" /><TextLines count={2} /><Skeleton className="mt-4 h-5 w-28" />
          </div>)}
        </div>
      </div>
    </LoadingFrame>
  )
}
