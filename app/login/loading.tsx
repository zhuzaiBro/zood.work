import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame } from '@/components/ui/LoadingLayout'

export default function LoginLoading() {
  return (
    <LoadingFrame label="正在加载登录表单" className="container mx-auto px-4 py-8">
      <div className="auth-loading mx-auto max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <Skeleton className="mx-auto mb-6 h-9 w-16" />
        <div className="space-y-4">
          {[0, 1].map(field => (
            <div key={field}><Skeleton className="mb-2 h-5 w-16" /><Skeleton className="h-[42px] w-full rounded-lg" /></div>
          ))}
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mx-auto h-6 w-36" />
        </div>
        <Skeleton className="mx-auto my-6 h-5 w-36" />
        <Skeleton className="h-12 w-full" />
      </div>
    </LoadingFrame>
  )
}
