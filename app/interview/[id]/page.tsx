import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types/database.types';
import ReferralShareButton from '@/components/interview/ReferralShareButton';
import QuestionCollectionBrowser, { type CollectionQuestionItem } from '@/components/interview/QuestionCollectionBrowser';

type Collection = Pick<
  Database['public']['Tables']['interview_collections']['Row'],
  'id' | 'title' | 'description' | 'icon'
>;
type Question = Pick<
  Database['public']['Tables']['interview_question']['Row'],
  'id' | 'title' | 'difficulty' | 'is_vip' | 'vip_level_required' | 'sort' | 'created_at'
> & {
  interview_question_tags: {
    interview_tags: Pick<Database['public']['Tables']['interview_tags']['Row'], 'id' | 'name'>;
  }[];
};

export const revalidate = 300;
export const dynamic = 'force-static';

const getCollectionPageData = unstable_cache(
  async (id: string) => {
    const supabase = createAdminClient();
    const [collectionResult, questionsResult] = await Promise.all([
      supabase
        .from('interview_collections')
        .select('id, title, description, icon')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('interview_question')
        .select(`
          id,
          title,
          difficulty,
          is_vip,
          vip_level_required,
          sort,
          created_at,
          interview_question_tags (
            interview_tags (
              id,
              name
            )
          )
        `)
        .eq('collection_id', id)
        .order('sort', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    if (collectionResult.error) throw collectionResult.error;
    if (questionsResult.error) throw questionsResult.error;

    return {
      collection: collectionResult.data as Collection | null,
      questions: (questionsResult.data ?? []) as Question[],
    };
  },
  ['interview-collection-page-v2'],
  { revalidate: 300, tags: ['interview-collections'] },
);

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { collection, questions } = await getCollectionPageData(id);

  if (!collection) {
    notFound();
  }

  const browserQuestions: CollectionQuestionItem[] = questions.map((question) => ({
    id: question.id,
    title: question.title,
    difficulty: question.difficulty,
    isVip: Boolean(question.is_vip || (question.vip_level_required ?? 0) > 0),
    tags: (question.interview_question_tags ?? []).map((tagRel) => ({
      id: tagRel.interview_tags.id,
      name: tagRel.interview_tags.name,
    })),
  }));
  const firstQuestion = browserQuestions[0] ?? null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)] pb-12">
      {/* Header */}
      <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)] pt-20 mt-[-5rem]">
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
                {firstQuestion ? (
                  <Link href={`/question/${firstQuestion.id}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow">
                    开始刷题
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ) : null}
                {/* <button className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors">
                  在线测验
                </button> */}
                <Link 
                  href="/mock-interview"
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  模拟面试
                </Link>
                <ReferralShareButton
                  sharePath={`/interview/${collection.id}`}
                  title={collection.title}
                  collectionId={collection.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <QuestionCollectionBrowser questions={browserQuestions} />
      </div>
    </div>
  );
}
