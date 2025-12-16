import Link from 'next/link';

const INTERVIEW_TYPES = [
  {
    id: 'comprehensive',
    title: '综合面试',
    icon: '🏆',
    tags: ['全面', '深度'],
    description: '全方位考察技术能力、项目经验和综合素质，模拟真实面试场景',
    href: '/mock-interview/comprehensive',
    disabled: false
  },
  {
    id: 'resume',
    title: '简历押题',
    icon: '📄',
    tags: ['精准', '高效'],
    description: '基于简历内容生成针对性面试题目，精准命中面试重点',
    href: '/mock-interview/resume',
    disabled: false
  },
  {
    id: 'custom',
    title: '自定义面试',
    icon: '💡',
    tags: ['灵活', '自定义'],
    description: '根据您的需求自定义面试流程和内容',
    href: '/mock-interview/custom',
    disabled: true,
    statusText: '敬请期待'
  }
];

export default function MockInterviewPage() {
  return (
    <div className="min-h-screen mt-[-5rem] bg-gray-50 pt-40 pb-12 bg-gradient-to-b from-blue-50 to-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <Link href="/interview" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">选择面试类型</h1>
          <p className="text-gray-500 text-lg">请选择适合您的面试类型，开始定制化的面试体验</p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {INTERVIEW_TYPES.map((type) => (
            <Link 
              key={type.id}
              href={type.disabled ? '#' : type.href}
              className={`
                relative block p-8 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all
                ${type.disabled 
                  ? 'opacity-60 cursor-not-allowed bg-gray-50' 
                  : 'hover:shadow-md hover:border-blue-100 hover:-translate-y-1 cursor-pointer'
                }
              `}
            >
              {/* Status Badge for disabled items */}
              {type.statusText && (
                <span className="absolute top-6 right-6 px-3 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                  {type.statusText}
                </span>
              )}

              {/* Arrow Icon for active items */}
              {!type.disabled && (
                <svg className="absolute top-8 right-8 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-3xl border border-gray-100">
                  {type.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {type.title}
                    </h3>
                    <div className="flex gap-2">
                      {type.tags.map((tag, i) => (
                        <span 
                          key={tag} 
                          className={`
                            text-xs px-2 py-0.5 rounded font-medium
                            ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-50 text-blue-600'}
                          `}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-500 leading-relaxed">
                    {type.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

