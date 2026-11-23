import type { ReactNode } from 'react'
import Skeleton from './Skeleton'

export function LoadingFrame({ children, className = '', label = '正在加载页面' }: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <div role="status" aria-busy="true" className={'route-loading ' + className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export function TextLines({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={index === count - 1 ? 'h-3.5 w-2/3' : 'h-3.5 w-full'} />
      ))}
    </div>
  )
}

export function ListRows({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex min-h-14 items-center justify-between gap-4 py-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  )
}
