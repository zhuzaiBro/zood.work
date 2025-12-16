import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            认证失败
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            抱歉，验证邮箱链接无效或已过期。
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回登录
          </Link>
        </div>
      </div>
    </div>
  )
}

