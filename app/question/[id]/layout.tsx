import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Database } from '@/types/database.types';

type Question = Database['public']['Tables']['interview_question']['Row'];

export default async function QuestionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch current question details (minimal needed for sidebar)
  const { data: question } = await supabase
    .from('interview_question')
    .select('id, title, collection_id')
    .eq('id', id)
    .single<Question>();

  // 2. Fetch all questions in the same collection
  let collectionQuestions: Pick<Question, 'id' | 'title'>[] = [];
  if (question?.collection_id) {
    const { data } = await supabase
      .from('interview_question')
      .select('id, title')
      .eq('collection_id', question.collection_id)
      .order('id', { ascending: true })
      .limit(100);
    
    if (data) {
      collectionQuestions = data;
    }
  }

  return (
    <div className="min-h-screen mt-[-5rem] bg-gray-50 pt-32 pb-12 bg-gradient-to-b from-blue-50 to-gray-50">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar: Question List */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-[calc(var(--site-header-height)+1.5rem)] max-h-[calc(100vh-var(--site-header-height)-3rem)] flex flex-col">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="搜索题目" 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                <div className="space-y-1">
                  {collectionQuestions.map((q) => {
                    const isActive = q.id === question?.id;
                    return (
                      <Link 
                        key={q.id} 
                        href={`/question/${q.id}`}
                        className={`block p-3 rounded-lg text-sm transition-colors ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {q.title}
                      </Link>
                    );
                  })}
                  
                  {collectionQuestions.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-xs">
                      暂无相关题目
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content & Right Sidebar */}
          {children}

        </div>
      </div>
    </div>
  );
}

