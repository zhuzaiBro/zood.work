import Spinner from '@/components/ui/Spinner'

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-sky-400/20 blur-xl scale-150" />
        <Spinner size="lg" className="relative" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 tracking-wide">
          页面加载中
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-sky-600 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
