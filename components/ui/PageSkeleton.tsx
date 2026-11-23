import Skeleton from './Skeleton'

export function AdminListSkeleton({ rows = 6, stats = 0, tableOnly = false }: { rows?: number; stats?: number; tableOnly?: boolean } = {}) {
  return (
    <div role="status" aria-label="正在加载管理页面" aria-busy="true" className="route-loading space-y-4">
      {!tableOnly && <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-3 h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>}
      {stats > 0 && !tableOnly && <div className={stats === 5 ? "grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4" : "flex flex-wrap gap-4"}>
        {Array.from({ length: stats }, (_, item) => (
          <div key={item} className={stats === 4 ? "rounded-lg border border-slate-200 bg-white p-3" : "rounded-lg border border-slate-200 bg-white p-5"}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-20" />
          </div>
        ))}
      </div>}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-5 flex justify-between gap-4">
          <Skeleton className="h-9 w-64 min-w-0" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, item) => (
            <Skeleton key={item} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
