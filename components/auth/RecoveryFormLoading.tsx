import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame } from '@/components/ui/LoadingLayout'

export default function RecoveryFormLoading({ fields }: { fields: number }) {
  return (
    <LoadingFrame label="正在加载密码恢复表单" className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{fields === 1 ? '找回密码' : '设置新密码'}</h1>
        <div className="mt-4 space-y-4">
          {fields === 1 && <p className="text-sm leading-6 text-slate-600">输入注册时使用的邮箱，我们会发送一封密码重置邮件。</p>}
          {Array.from({ length: fields }, (_, field) => (
            <div key={field}><Skeleton className={fields === 1 ? "mb-4 h-5 w-20" : "mb-2 h-5 w-20"} /><Skeleton className="h-11" /></div>
          ))}
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="mt-5 h-5 w-20" />
      </div>
    </LoadingFrame>
  )
}
