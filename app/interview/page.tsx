import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import TagFilter from '@/components/interview/TagFilter';
import CollectionCard from '@/components/interview/CollectionCard';
import InterviewQuestionSearch from '@/components/interview/InterviewQuestionSearch';
import QuestionContributionForm from '@/components/interview/QuestionContributionForm';
import { Database } from '@/types/database.types';
import type { Metadata } from 'next';

type Collection = Database['public']['Tables']['interview_collections']['Row'];
type Tag = Database['public']['Tables']['interview_tags']['Row'];

export const metadata: Metadata = {
  title: 'Web3 面试题库 - CEX 项目与交易所攻略',
  description:
    '油条TV 面试题库整理 Web3、AI、CEX项目、交易所业务和远程工作面试问题，支持普通用户快速投稿和社区共建。',
  keywords: ['web3学习', 'cex项目', '交易所攻略', '远程工作', '远程攻略', 'Web3面试', '油条TV'],
  alternates: {
    canonical: '/interview',
  },
};

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const currentTagSlug = params.tag;
  const searchQuery = params.q?.trim() ?? '';
  const isSearching = searchQuery.length > 0;

  // 1. Fetch all tags for the filter list
  const { data: tags } = await supabase
    .from('interview_tags')
    .select('*')
    .order('sort', { ascending: true })
    .order('created_at', { ascending: true });

  // 2. Fetch collections based on filter
  let collections: Collection[] | null = [];
  const questionCountByCollection = new Map<string, number>();

  // Default to first tag if no tag provided
  const effectiveTagSlug = currentTagSlug || (tags && tags.length > 0 ? (tags[0] as { slug: string }).slug : null);

  if (effectiveTagSlug) {
    // If a tag is selected, we need to find collections associated with this tag.
    // First, get the tag ID.
    const { data: currentTag } = await supabase
      .from('interview_tags')
      .select('id')
      .eq('slug', effectiveTagSlug)
      .single();

    if (currentTag) {
      // Then get collection IDs from the junction table
      const { data: relations } = await supabase
        .from('interview_collection_tags')
        .select('collection_id')
        .eq('tag_id', (currentTag as { id: string }).id);

      if (relations && relations.length > 0) {
        const collectionIds = relations.map((r: { collection_id: string }) => r.collection_id);
        const { data } = await supabase
          .from('interview_collections')
          .select('*')
          .in('id', collectionIds)
          .order('sort', { ascending: true })
          .order('created_at', { ascending: false });
        collections = data;
      }
    }
  } else {
    // Fallback if no tags exist at all
    const { data } = await supabase
      .from('interview_collections')
      .select('*')
      .order('sort', { ascending: true })
      .order('created_at', { ascending: false });
    collections = data;
  }

  if (collections?.length) {
    const collectionIds = collections.map((collection) => collection.id);
    const { data: questionRows } = await supabase
      .from('interview_question')
      .select('collection_id')
      .in('collection_id', collectionIds);

    const typedQuestionRows = (questionRows ?? []) as Array<{ collection_id: string | null }>;
    for (const row of typedQuestionRows) {
      if (!row.collection_id) continue;
      questionCountByCollection.set(
        row.collection_id,
        (questionCountByCollection.get(row.collection_id) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)] pb-12">
      <div className="mt-[-5rem] bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)] pt-24">
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">Q</span>
            <h1 className="text-2xl font-black text-gray-900">面试题库</h1>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-7 text-slate-600">
            围绕 Web3 学习、CEX 项目、交易所攻略和远程工作面试沉淀题库；你也可以把真实面试题、学习问题和踩坑记录快速投稿给社区。
          </p>

          <Suspense fallback={<div className="mb-4 h-11 rounded-xl bg-white/70" />}>
            <InterviewQuestionSearch initialQuery={searchQuery} />
          </Suspense>

          <Suspense fallback={null}>
            <TagFilter tags={tags || []} />
          </Suspense>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-2">
        {!isSearching && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">按专题开始练习</p>
              <span className="text-xs text-slate-400">共 {collections?.length ?? 0} 个题集</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {collections?.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} questionCount={questionCountByCollection.get(collection.id) ?? 0} />
              ))}
              {(!collections || collections.length === 0) && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  暂无面试题集
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-10">
          <QuestionContributionForm />
        </div>
      </div>
    </div>
  );
}
