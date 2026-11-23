import { notFound, redirect } from 'next/navigation';
import QuestionReader from '@/components/question/QuestionReader';
import { getQuestionPageData, hasPublicAnswer } from '@/lib/interview/getQuestionPageData';
import type { Question } from '@/lib/interview/getCollectionPageData';
import { platformRequest } from '@/lib/platform/http';
import { isUuid } from '@/lib/interview-referral-cookies';

export const dynamic = 'force-static';
export const revalidate = 60;
export const preferredRegion = 'hkg1';

type QuestionFlags = Pick<Question, 'id' | 'is_vip' | 'vip_level_required'>;

export async function generateStaticParams() {
  const ids = new Set<string>();
  try {
    const { collections } = await platformRequest<{ collections: { id: string }[] }>('/api/platform/sitemap', { cache: 'no-store' });
    // Use collection lists for eligibility. The sitemap's question list is capped.
    for (let start = 0; start < collections.length; start += 5) {
      const batch = collections.slice(start, start + 5);
      const lists = await Promise.all(batch.map(({ id }) =>
        platformRequest<{ questions: QuestionFlags[] }>(
          `/api/platform/interview/collections/${encodeURIComponent(id)}`, { cache: 'no-store' },
        ),
      ));
      for (const { questions } of lists) {
        for (const question of questions) {
          if (hasPublicAnswer(question)) ids.add(question.id);
        }
      }
    }
  } catch (error) {
    // Any remaining pages, including questions added after deployment, render on demand.
    console.warn('Question pre-render inventory unavailable:', error);
  }
  return Array.from(ids, (id) => ({ id }));
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const data = await getQuestionPageData(id, 'public');
  // The cached page contains only public answers. The reader also resolves rows
  // that the API may hide from anonymous callers.
  if (!data || !hasPublicAnswer(data.question)) {
    redirect(`/question/${id}/read`);
  }

  return <QuestionReader data={data} />;
}
