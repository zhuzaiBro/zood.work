import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame } from '@/components/ui/LoadingLayout'

export default function CatalogLoading() {
  return (
    <LoadingFrame label="正在加载课程" className="min-h-screen bg-gradient-to-b from-[#f8fbff] to-[#f7f9fc] pb-16">
      <div className="border-b border-slate-200/70 bg-white/65">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Skeleton className="h-11 w-full lg:max-w-md" /><Skeleton className="h-[46px] w-full lg:w-64" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-5 w-64" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(item => (
            <div key={item} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <Skeleton className="aspect-video rounded-none" />
              <div className="p-5">
                <div className="min-h-14 pt-1"><Skeleton className="h-6 w-3/4" /></div>
                <div className="mt-2 flex min-h-12 flex-col justify-around"><Skeleton className="h-4" /><Skeleton className="h-4 w-2/3" /></div>
                <Skeleton className="mt-4 h-7 w-28" />
                <div className="mt-5 border-t border-slate-100 pt-4"><Skeleton className="h-5 w-24" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingFrame>
  )
}
