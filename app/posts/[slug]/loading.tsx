import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines } from '@/components/ui/LoadingLayout'

export default function ArticleLoading() {
  return (
    <LoadingFrame label="正在加载文章" className="min-h-screen">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-20" /><Skeleton className="h-8 w-16" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[28px] bg-white px-6 py-8 shadow-sm sm:px-10 lg:px-14">
          <Skeleton className="mb-4 h-6 w-20" /><Skeleton className="mb-4 h-12 w-3/4" />
          <div className="mb-10 flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-40" /></div>
          <TextLines count={5} /><div className="mt-8"><TextLines count={6} /></div>
        </div>
      </div>
    </LoadingFrame>
  )
}
