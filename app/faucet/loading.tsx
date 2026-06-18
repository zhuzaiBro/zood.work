import Skeleton from '@/components/ui/Skeleton'
import Spinner from '@/components/ui/Spinner'

export default function FaucetLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <Spinner size="md" className="mx-auto" />
          <p className="text-sm text-gray-500">Web3 工具箱加载中</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
