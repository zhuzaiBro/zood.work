import Link from 'next/link'

export default function InterviewTypeHeading() {
  return (
    <>
      <div className="mb-8">
        <Link href="/interview" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回题库
        </Link>
      </div>

      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">选择面试类型</h1>
        <p className="text-gray-500 text-lg">请选择适合您的面试类型，开始定制化的面试体验</p>
      </div>
    </>
  )
}
