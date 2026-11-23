import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame } from '@/components/ui/LoadingLayout'

export default function MockFormLoading({ steps }: { steps: number }) {
  return (
    <LoadingFrame label="正在加载模拟面试表单" className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <Skeleton className="mb-8 h-6 w-16" />
        <div className="mb-8"><Skeleton className="mb-2 h-8 w-28" /><Skeleton className="h-6 w-72" /></div>
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            {Array.from({ length: steps }, (_, i) => <div key={i} className="flex min-w-0 items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" /><Skeleton className="h-5 w-16" />
            </div>)}
          </div>
        </div>
        <div className="min-h-[600px] rounded-xl bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-3xl space-y-8 py-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="grid grid-cols-12 items-center gap-4">
              <Skeleton className="col-span-3 ml-auto h-5 w-16" /><Skeleton className="col-span-9 h-11" />
            </div>)}
          </div>
        </div>
      </div>
    </LoadingFrame>
  )
}
