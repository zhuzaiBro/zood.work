type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-3 w-10',
  md: 'h-4 w-24',
  lg: 'h-5 w-36',
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`rounded-full animate-shimmer ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="加载中"
    />
  )
}
