export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 页头骨架 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>

        {/* 操作区域骨架 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 animate-pulse">
          <div className="space-y-6">
            {/* 选择题集 */}
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>

            {/* 上传文件 */}
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* 提示信息骨架 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-32 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded"></div>
            <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded w-5/6"></div>
            <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

