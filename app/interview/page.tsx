import { Suspense } from 'react';
import { platformPublic } from '@/lib/platform/client';
import TagFilter from '@/components/interview/TagFilter';
import RoleFilter from '@/components/interview/RoleFilter';
import CollectionRow from '@/components/interview/CollectionRow';
import { interviewIndexRequest } from '@/lib/interview-jobs';
import InterviewQuestionSearch, { InterviewSearchResults } from '@/components/interview/InterviewQuestionSearch';
import QuestionContributionForm from '@/components/interview/QuestionContributionForm';
import CollectionFeature from '@/components/interview/CollectionFeature';
import { buildInterviewDirectory, type DirectoryCollection } from '@/lib/interview/directory';
import type { Database } from '@/types/database.types';
import type { Metadata } from 'next';

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
  searchParams: Promise<{ tag?: string; q?: string; role?: string }>;
}) {
  const params = await searchParams;
  const index = interviewIndexRequest(params.role, params.tag);
  const searchQuery = params.q?.trim() ?? '';
  const isSearching = searchQuery.length > 0;

  let tags: Tag[] = [];
  let collections: DirectoryCollection[] = [];
  let questionCounts: unknown = null;
  let loadError = '';

  if (index.path && !isSearching) {
    try {
      const result = await platformPublic<{
        tags: Tag[] | null;
        collections: DirectoryCollection[] | null;
        questionCounts: unknown;
      }>(index.path);
      tags = result.tags ?? [];
      collections = result.collections ?? [];
      questionCounts = result.questionCounts;
    } catch (error) {
      console.error('Load interview index failed:', error);
      loadError = '题库暂时没有加载出来';
    }
  }

  const { featured, remaining, totalQuestions } = buildInterviewDirectory(collections, questionCounts);

  const singleRoleCollection = Boolean(featured) && collections.length === 1 && !index.technical;

  return (
    <div className="min-h-[calc(100vh-var(--site-header-height))] bg-[#f5f8fc] pb-16 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:px-6 md:gap-x-3 md:gap-y-1 md:pb-0 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(180px,248px)_auto] xl:py-0">
          <div className="col-span-full col-start-1 row-start-2 flex min-w-0 md:col-span-1 md:row-start-1 xl:col-start-2">
            <Suspense fallback={<div className="h-11 flex-1 rounded-lg border border-slate-200" />}>
              <InterviewQuestionSearch initialQuery={searchQuery} />
            </Suspense>
          </div>
          <div className="col-start-2 row-start-1 justify-self-end xl:col-start-3">
            <QuestionContributionForm />
          </div>
          <Suspense fallback={null}>
            <RoleFilter activeSlug={index.activeSlug} />
          </Suspense>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {isSearching ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <h1 className="sr-only">题目搜索结果</h1>
            <InterviewSearchResults key={searchQuery} query={searchQuery} />
          </div>
        ) : (
          <section aria-labelledby="collection-heading">
            <div className={singleRoleCollection ? 'sr-only' : 'mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3'}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 id="collection-heading" className="text-xl font-black text-slate-950 sm:text-2xl">
                  {index.unknownJob ? '岗位题集' : `${index.activeName}题集`}
                </h1>
                {!loadError && collections.length > 0 && (
                  <span className="text-sm tabular-nums text-slate-500">{collections.length} 个题集 · {totalQuestions} 道题</span>
                )}
              </div>
              {index.technical && (
                <Suspense fallback={null}>
                  <TagFilter tags={tags} />
                </Suspense>
              )}
            </div>

            {featured && <CollectionFeature key={featured.id} collection={featured} />}
            {remaining.length > 0 && (
              <div className={featured ? 'mt-7' : undefined}>
                {featured && <h3 className="mb-3 text-base font-bold text-slate-800">更多题集</h3>}
                <ul aria-label="题集目录" className="grid gap-x-8 rounded-xl border border-slate-200 bg-white px-4 sm:px-5 md:grid-cols-2">
                  {remaining.map((collection) => (
                    <li key={collection.id} className="min-w-0 border-b border-slate-100 last:border-b-0 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                      <CollectionRow collection={collection} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {loadError && <p className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-rose-700" role="alert">{loadError}</p>}
            {!loadError && collections.length === 0 && (
              <p className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-600">
                {index.unknownJob ? '没有这个岗位' : index.technical ? '暂无面试题集' : `「${index.activeName}」还没有面试题`}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
