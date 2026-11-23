import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame } from '@/components/ui/LoadingLayout'

export default function CategoriesLoading() {
  return (
    <LoadingFrame label="正在加载分类" className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Skeleton className="mb-8 h-10 w-36" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="auth-loading rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <Skeleton className="mb-2 h-7 w-2/3" /><Skeleton className="mb-3 h-5" /><Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </LoadingFrame>
  )
}
