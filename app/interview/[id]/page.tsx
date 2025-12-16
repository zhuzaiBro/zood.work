import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types/database.types';

type Collection = Database['public']['Tables']['interview_collections']['Row'];
type Question = Database['public']['Tables']['interview_question']['Row'] & {
  interview_question_tags: {
    interview_tags: Database['public']['Tables']['interview_tags']['Row'];
  }[];
};

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: collectionData } = await supabase
    .from('interview_collections')
    .select('*')
    .eq('id', id)
    .single();

  const collection = collectionData as Collection | null;

  if (!collection) {
    notFound();
  }

  const { data: questionsData } = await supabase
    .from('interview_question')
    .select(`
      *,
      interview_question_tags (
        interview_tags (
          *
        )
      )
    `)
    .eq('collection_id', id)
    .order('sort', { ascending: true })
    .order('created_at', { ascending: true });

  // Using 'any' cast here because Supabase complex joins type inference can be tricky
  // but we know the shape from the query
  const questions = questionsData as any[] as Question[];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-50 to-gray-50 pt-20 mt-[-5rem] border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/interview" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回列表
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
              {collection.icon ? (
                collection.icon.startsWith('http') || collection.icon.startsWith('/') ? (
                  <Image
                    src={collection.icon}
                    alt={collection.title}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">{collection.icon}</span>
                )
              ) : (
                <div className="w-full h-full bg-blue-100" />
              )}
            </div>
            
            <div className="flex-grow space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{collection.title}</h1>
                <p className="text-gray-600 leading-relaxed text-lg">{collection.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow">
                  继续刷题
                </button>
                {/* <button className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors">
                  在线测验
                </button> */}
                <Link 
                  href="/mock-interview"
                  className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  模拟面试
                </Link>
                <button className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  分享
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
            <h2 className="font-bold text-gray-900 text-lg">题目列表</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              <button className="flex items-center gap-1 hover:text-gray-900 whitespace-nowrap">
                搜索题目 <span className="text-xs">▼</span>
              </button>
              <button className="flex items-center gap-1 hover:text-gray-900 whitespace-nowrap">
                标记 <span className="text-xs">▼</span>
              </button>
              <button className="flex items-center gap-1 hover:text-gray-900 whitespace-nowrap">
                难度 <span className="text-xs">▼</span>
              </button>
              <button className="flex items-center gap-1 hover:text-gray-900 whitespace-nowrap">
                会员专属 <span className="text-xs">▼</span>
              </button>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="可选 10 个标签，支持搜索" 
                  className="pl-3 pr-8 py-1.5 border border-gray-200 rounded-md text-sm w-64 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
            <div className="col-span-1 text-center">标记</div>
            <div className="col-span-7 md:col-span-8">题目</div>
            <div className="col-span-2 md:col-span-1 text-center">难度</div>
            <div className="col-span-2">标签</div>
          </div>

          {/* List */}
          <div className="divide-y divide-gray-50">
            {questions?.map((question) => (
              <div key={question.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-blue-50/30 transition-colors items-center group">
                <div className="col-span-1 flex justify-center">
                   <button className="text-gray-300 hover:text-yellow-500 transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                     </svg>
                   </button>
                </div>
                
                <div className="col-span-7 md:col-span-8 pr-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/question/${question.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate block">
                      {question.title}
                    </Link>
                    {question.is_vip && (
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded border border-orange-200 font-medium flex-shrink-0">
                        VIP
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="col-span-2 md:col-span-1 text-center">
                  <span className={`
                    inline-block px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${question.difficulty === '简单' ? 'bg-green-100 text-green-700' : ''}
                    ${question.difficulty === '中等' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${question.difficulty === '困难' ? 'bg-red-100 text-red-700' : ''}
                    ${!question.difficulty ? 'bg-gray-100 text-gray-600' : ''}
                  `}>
                    {question.difficulty || '未知'}
                  </span>
                </div>
                
                <div className="col-span-2 flex flex-wrap gap-1.5">
                  {question.interview_question_tags?.map((tagRel) => (
                    <span 
                      key={tagRel.interview_tags.id}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 whitespace-nowrap"
                    >
                      {tagRel.interview_tags.name}
                    </span>
                  ))}
                  {(!question.interview_question_tags || question.interview_question_tags.length === 0) && (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </div>
              </div>
            ))}

            {(!questions || questions.length === 0) && (
              <div className="py-24 text-center">
                <div className="text-6xl mb-4 opacity-20">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">暂无面试题</h3>
                <p className="text-gray-500">该题集下暂时还没有添加面试题</p>
              </div>
            )}
          </div>
          
          {/* Footer/Pagination Placeholder */}
          {questions && questions.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
              <div>
                显示 {questions.length} 道题目
              </div>
              <div className="flex gap-2">
                <button disabled className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-400 cursor-not-allowed">上一页</button>
                <button disabled className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-400 cursor-not-allowed">下一页</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
