type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`rounded-full border-sky-200 border-t-sky-500 dark:border-sky-900 dark:border-t-sky-400 animate-spin-slow ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="加载中"
    />
  )
}
