import { notFound, redirect } from 'next/navigation';
import QuestionReader from '@/components/question/QuestionReader';
import { getQuestionPageData } from '@/lib/interview/getQuestionPageData';
import { isUuid } from '@/lib/interview-referral-cookies';

export const dynamic = 'force-static';
export const revalidate = 60;
export const preferredRegion = 'hkg1';

export function generateStaticParams() {
  return [];
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const data = await getQuestionPageData(id, 'public');
  // The cached page contains only public answers. The reader also resolves rows
  // that the API may hide from anonymous callers.
  if (!data || data.question.is_vip || (data.question.vip_level_required ?? 0) > 0) {
    redirect(`/question/${id}/read`);
  }

  return <QuestionReader data={data} />;
}
