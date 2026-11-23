import TestHeader from './TestHeader'
import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines } from '@/components/ui/LoadingLayout'

export default function LearningTestLoading() {
  return (
    <LoadingFrame label="正在加载学习测试" className="-mt-20 min-h-screen bg-[#02050b]">
      <TestHeader />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <div className="rounded-[28px] bg-[#f8fbff] px-5 py-7 sm:px-8 lg:px-12">
          <Skeleton className="mb-8 h-9 w-36" />
          <div className="space-y-10">{[0, 1, 2].map(question => (
            <div key={question}>
              <TextLines count={2} />
              <div className="mt-5 space-y-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            </div>
          ))}</div>
        </div>
        <div className="dark-bones self-start rounded-2xl border border-sky-300/20 bg-[#07101f] p-5"><Skeleton className="mb-4 h-6 w-20" /><Skeleton className="h-40" /></div>
      </div>
    </LoadingFrame>
  )
}
