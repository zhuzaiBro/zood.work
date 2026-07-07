import Skeleton from './Skeleton'

export function PageLoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen bg-slate-50 px-4 py-10 ${className}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-9 w-28" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Skeleton className="h-5 w-32" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-3 h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-5 flex justify-between gap-4">
          <Skeleton className="h-9 w-64" />
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

export function CoursePlayerLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef7ff_0%,#f8fbff_38%,#ffffff_100%)] px-4 py-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-36" />
          <div className="space-y-3 pt-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="aspect-video w-full rounded-[32px]" />
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-3 h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  )
}
