import { PlatformError } from '@/lib/platform/http';
import { getQuestionPageData, type InterviewQuestion } from '@/lib/interview/getQuestionPageData';
import QuestionSidebar from '@/components/question/QuestionSidebar';

// Keep the server render close to video-api.zood.work.
export const preferredRegion = 'hkg1';

export default async function QuestionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let question: InterviewQuestion | null = null;
  let collectionQuestions: Pick<InterviewQuestion, 'id' | 'title'>[] = [];

  try {
    const result = await getQuestionPageData(id);
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
