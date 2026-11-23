import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, ListRows } from '@/components/ui/LoadingLayout'

export default function ProfileLoading() {
  return (
    <LoadingFrame label="正在加载个人中心" className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Skeleton className="mb-6 h-7 w-24" /><Skeleton className="mx-auto h-24 w-24 rounded-full" />
            <Skeleton className="mx-auto my-4 h-6 w-28" /><Skeleton className="mx-auto h-6 w-20" />
          </div>
          <div className="rounded-2xl bg-white p-6"><ListRows /></div>
        </div>
        <div className="space-y-6 lg:col-span-9">
          <div className="rounded-2xl bg-white p-6"><Skeleton className="mb-5 h-7 w-28" /><div className="grid gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div></div>
          <div className="rounded-2xl bg-white p-6"><Skeleton className="mb-4 h-6 w-32" /><ListRows /></div>
        </div>
      </div>
    </LoadingFrame>
  )
}
