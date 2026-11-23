import { Suspense } from 'react';
import { platformPublic } from '@/lib/platform/client';
import TagFilter from '@/components/interview/TagFilter';
import RoleFilter from '@/components/interview/RoleFilter';
import CollectionCard from '@/components/interview/CollectionCard';
import { interviewIndexRequest } from '@/lib/interview-jobs';
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

function readQuestionCount(questionCounts: unknown, collectionId: string) {
  if (!questionCounts) return 0;

  if (Array.isArray(questionCounts)) {
    const row = questionCounts.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const record = item as Record<string, unknown>;
      return record.collection_id === collectionId || record.id === collectionId;
    }) as Record<string, unknown> | undefined;
    const count = row?.count ?? row?.question_count ?? row?.total;
    return typeof count === 'number' ? count : Number(count) || 0;
  }

  if (typeof questionCounts === 'object') {
    const value = (questionCounts as Record<string, unknown>)[collectionId];
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object') {
      const count = (value as Record<string, unknown>).count;
      return typeof count === 'number' ? count : Number(count) || 0;
    }
  }

  return 0;
}

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; role?: string }>;
}) {
  const params = await searchParams;
  const index = interviewIndexRequest(params.role, params.tag);
  const searchQuery = params.q?.trim() ?? '';
  const isSearching = searchQuery.length > 0;

  let tags: Tag[] = [];
  let collections: Collection[] = [];
  let questionCounts: unknown = null;
  let loadError = '';

  if (index.path) try {
    const result = await platformPublic<{
      tags: Tag[] | null;
      collections: Collection[] | null;
      questionCounts: unknown;
    }>(index.path);
    tags = result.tags ?? [];
    collections = result.collections ?? [];
    questionCounts = result.questionCounts;
  } catch (error) {
    console.error('Load interview index failed:', error);
    loadError = '题库暂时没有加载出来';
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
            <RoleFilter activeSlug={index.activeSlug} />
          </Suspense>
          {index.technical && (
            <Suspense fallback={null}>
              <TagFilter tags={tags || []} />
            </Suspense>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pt-2">
        {!isSearching && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {index.unknownJob ? '岗位' : index.technical ? '程序员 · 按技术方向练习' : index.activeName}
              </p>
              <span className="text-xs text-slate-400">共 {index.unknownJob ? 0 : collections.length} 个题集</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {!index.unknownJob && collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} questionCount={readQuestionCount(questionCounts, collection.id)} />
              ))}
              {!index.unknownJob && loadError && (
                <div className="col-span-full py-12 text-center text-rose-600">
                  {loadError}
                </div>
              )}
              {index.technical && !loadError && collections.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  暂无面试题集
                </div>
              )}
              {!index.technical && (index.unknownJob || (!loadError && collections.length === 0)) && (
                <div className="col-span-full rounded-lg border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
                  {index.unknownJob ? '没有这个岗位' : `「${index.activeName}」还没有面试题`}
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
