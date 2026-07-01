import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Database } from '@/types/database.types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';
import QuestionToc from '@/components/question/QuestionToc';
import MarkdownHeading from '@/components/MarkdownHeading';
import QuestionFavoriteButton from '@/components/interview/QuestionFavoriteButton';

type Question = Database['public']['Tables']['interview_question']['Row'] & {
  interview_question_tags: {
    interview_tags: Database['public']['Tables']['interview_tags']['Row'];
  }[];
};

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch current question details
  const { data: questionData } = await supabase
    .from('interview_question')
    .select(`
      *,
      interview_question_tags (
        interview_tags (
          *
        )
      )
    `)
    .eq('id', id)
    .single();

  if (!questionData) {
    notFound();
  }

  const question = questionData as any as Question;

  // 2. Check VIP Access
  let hasAccess = true;
  let accessReason = ''; // 'login' | 'upgrade'

  if (question.vip_level_required && question.vip_level_required > 0) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      hasAccess = false;
      accessReason = 'login';
    } else {
      // Get user VIP level
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('vip_level')
        .eq('id', user.id)
        .single();
      
      const userVipLevel = profile?.vip_level || 0;
      
      if (userVipLevel < question.vip_level_required) {
        hasAccess = false;
        accessReason = 'upgrade';
      }
    }
  }

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="mb-6">
          <Link 
            href={`/interview/${question.collection_id}`} 
            className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回题库
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Title */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-snug">
            {question.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`
              px-2.5 py-0.5 rounded text-xs font-medium
              ${question.difficulty === '简单' ? 'bg-green-100 text-green-700' : ''}
              ${question.difficulty === '中等' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${question.difficulty === '困难' ? 'bg-red-100 text-red-700' : ''}
              ${!question.difficulty ? 'bg-gray-100 text-gray-600' : ''}
            `}>
              {question.difficulty || '未知'}
            </span>
            
            {question.interview_question_tags?.map((tagRel) => (
              <span 
                key={tagRel.interview_tags.id}
                className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200"
              >
                {tagRel.interview_tags.name}
              </span>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-6 text-gray-500 text-sm">
              <QuestionFavoriteButton questionId={question.id} />
              <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                分享
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                0
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                0
              </span>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex items-center gap-8 border-b border-gray-100 mb-8">
            <button className="pb-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              推荐答案
            </button>
            <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800 transition-colors">
              测试一下
            </button>
            <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800 transition-colors">
              开始面试
            </button>
            <div className="ml-auto">
               <button className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                 </svg>
                 隐藏答案
               </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="question-prose prose prose-slate max-w-none relative">
            {!hasAccess ? (
              <div className="py-24 px-6 text-center bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
                {/* 背景装饰 */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/zood.jpg')] bg-cover bg-center filter blur-sm"></div>
                
                <div className="relative z-10 max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg text-white text-3xl">
                    🔒
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {accessReason === 'login' ? '需要登录查看' : `需要 VIP${question.vip_level_required} 等级`}
                  </h3>
                  
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    {accessReason === 'login' 
                      ? '这是一道精选面试题，请登录后解锁完整解析和代码示例。'
                      : `本题属于高阶面试题库，需要 VIP${question.vip_level_required} 会员权益才能查看完整解析。`
                    }
                  </p>
                  
                  {accessReason === 'login' ? (
                    <Link 
                      href="/login" 
                      className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      立即登录
                    </Link>
                  ) : (
                    <button className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-full hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      升级 VIP 会员
                    </button>
                  )}
                </div>
              </div>
            ) : question.content ? (
              <ReactMarkdown
                components={{
                  code: ({ node, inline, className, children, ...props }: any) => (
                    <CodeBlock
                      inline={inline}
                      className={className}
                      {...props}
                    >
                      {children}
                    </CodeBlock>
                  ),
                  h1: (props) => <MarkdownHeading level={1} {...props} />,
                  h2: (props) => <MarkdownHeading level={2} {...props} />,
                  h3: (props) => <MarkdownHeading level={3} {...props} />,
                  h4: (props) => <MarkdownHeading level={4} {...props} />,
                  h5: (props) => <MarkdownHeading level={5} {...props} />,
                  h6: (props) => <MarkdownHeading level={6} {...props} />,
                }}
                remarkPlugins={[remarkGfm]}
              >
                {question.content}
              </ReactMarkdown>
            ) : (
              <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                暂无答案内容，待补充...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar: TOC */}
      <aside className="hidden w-56 flex-shrink-0 xl:block 2xl:w-64">
        {question.content && hasAccess && (
          <QuestionToc content={question.content} />
        )}
      </aside>
    </>
  );
}
