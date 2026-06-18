type SkeletonProps = {
  className?: string
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`rounded-md animate-shimmer ${className}`} aria-hidden="true" />
}
