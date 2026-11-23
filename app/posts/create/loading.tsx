import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines } from '@/components/ui/LoadingLayout'

export default function EditorLoading() {
  return (
    <LoadingFrame label="正在加载文章编辑器" className="min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 lg:px-8">
        <Skeleton className="h-9 w-24" /><div className="flex gap-3"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-24" /></div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-28 pt-8 sm:px-6 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="mx-auto w-full max-w-4xl rounded-[28px] bg-white px-6 py-8 shadow-sm sm:px-10 lg:px-14">
          <Skeleton className="mb-5 h-10 w-2/3" /><TextLines count={2} /><Skeleton className="mt-8 h-80" />
        </div>
        <div className="self-start rounded-2xl bg-white p-6"><Skeleton className="h-6 w-24" /><Skeleton className="mt-5 h-32" /><Skeleton className="mt-4 h-10" /></div>
      </div>
    </LoadingFrame>
  )
}
