import { platformPublic, PlatformError } from '@/lib/platform/client';
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

  type SidebarQuestion = Pick<Question, 'id' | 'title' | 'collection_id'> & {
    interview_collections?: { title?: string | null } | { title?: string | null }[] | null;
  };
  let question: SidebarQuestion | null = null;
  let collectionQuestions: Pick<Question, 'id' | 'title'>[] = [];

  try {
    const result = await platformPublic<{
      question: SidebarQuestion | null;
      navigation?: { questions?: Pick<Question, 'id' | 'title'>[] };
    }>(`/api/platform/interview/questions/${encodeURIComponent(id)}`);
    question = result.question ?? null;
    collectionQuestions = result.navigation?.questions ?? [];
  } catch (error) {
    if (!(error instanceof PlatformError && error.status === 404)) {
      console.error('Load question sidebar failed:', error);
    }
  }

  if (collectionQuestions.length === 0 && question) {
    collectionQuestions = [{ id: question.id, title: question.title }];
  }
  const embeddedCollection = question?.interview_collections;
  const collectionTitle = Array.isArray(embeddedCollection)
    ? embeddedCollection[0]?.title ?? null
    : embeddedCollection?.title ?? null;

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
