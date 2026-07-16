import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';
import QuestionSidebar from '@/components/question/QuestionSidebar';

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
  let collectionTitle: string | null = null;
  if (question?.collection_id) {
    const [{ data }, { data: collection }] = await Promise.all([
      supabase
        .from('interview_question')
        .select('id, title')
        .eq('collection_id', question.collection_id)
        .order('sort', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(300),
      supabase
        .from('interview_collections')
        .select('title')
        .eq('id', question.collection_id)
        .maybeSingle(),
    ]);
    
    if (data) {
      collectionQuestions = data;
    }
    collectionTitle = (collection as { title: string } | null)?.title ?? null;
  }

  return (
    <div className="min-h-screen mt-[-5rem] bg-gray-50 pt-32 pb-12 bg-gradient-to-b from-blue-50 to-gray-50">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar: Question List */}
          <QuestionSidebar questions={collectionQuestions} activeQuestionId={question?.id ?? id} collectionTitle={collectionTitle} />

          {/* Main Content & Right Sidebar */}
          {children}

        </div>
      </div>
    </div>
  );
}
