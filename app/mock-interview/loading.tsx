import InterviewTypeHeading from './InterviewTypeHeading'
import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines } from '@/components/ui/LoadingLayout'

export default function MockInterviewLoading() {
  return (
    <LoadingFrame label="正在加载面试类型" className="-mt-20 min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 pb-12 pt-40">
      <div className="container mx-auto max-w-5xl px-4">
        <InterviewTypeHeading />
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-start gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><Skeleton className="mb-3 h-7 w-28" /><TextLines count={2} /></div>
            </div>
          ))}
        </div>
      </div>
    </LoadingFrame>
  )
}
