import { commercePlatformFor } from '@/lib/interview/commercePlatforms';
import CommercePracticeLabel from '@/components/interview/CommercePracticeLabel';
import { Suspense } from 'react';
import Link from 'next/link';
import type { CountedCollection } from '@/lib/interview/directory';
import { getCollectionPageData, type Question } from '@/lib/interview/getCollectionPageData';
import QuestionDifficulty from './QuestionDifficulty';

const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai',
});

async function QuestionPreview({ collectionId }: { collectionId: string }) {
  let questions: Question[];
  try {
    const data = await getCollectionPageData(collectionId);
    questions = data.questions.slice(0, 3);
  } catch (error) {
    console.error('Load question preview failed:', error);
    return <p className="py-6 text-sm text-slate-600" role="status">题目预览暂时不可用，可进入题集查看。</p>;
  }

  if (!questions.length) return <p className="py-6 text-sm text-slate-600">暂无可预览的题目</p>;

  return (
    <ul className="flex flex-1 flex-col divide-y divide-slate-100">
      {questions.map((question) => (
        <li key={question.id} className="flex flex-1">
          <Link
            href={`/question/${question.id}`}
            className="group -mx-2 flex flex-1 items-center gap-3 rounded-md px-2 py-4 text-slate-900 transition-colors hover:bg-sky-50/60 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:gap-4"
          >
            <span className="min-w-0 flex-1 break-words text-[15px] font-semibold leading-6 sm:text-base">
              {question.title}
              {(question.is_vip || (question.vip_level_required ?? 0) > 0) && (
                <span className="ml-1.5 inline-block rounded bg-amber-100 px-1.5 align-middle text-[10px] font-bold leading-5 text-amber-800">VIP</span>
              )}
            </span>
            <QuestionDifficulty difficulty={question.difficulty} />
            <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function CollectionFeature({ collection }: { collection: CountedCollection }) {
  const platform = commercePlatformFor(collection.id);
  const timestamp = Date.parse(collection.created_at);

  return (
    <article className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
      <Link
        href={`/interview/${collection.id}`}
        aria-label={`进入题集：${collection.title}`}
        className="group relative isolate flex flex-col items-start overflow-hidden bg-[linear-gradient(120deg,#0b1c35,#143658)] px-5 py-5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-14 -right-11 -z-10 h-52 w-52 bg-sky-400/10 [mask:url('/brand/zood-icon-192.png')_center/contain_no-repeat] sm:h-64 sm:w-64"
        />
        <div className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-sky-200">
          <svg aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M12 6v14M3 5.5c3-1.3 6.3-1.2 9 .5 2.7-1.7 6-1.8 9-.5v13c-3-1.3-6.3-1.2-9 .5-2.7-1.7-6-1.8-9-.5z" />
          </svg>
          <span>{collection.questionCount} 道题</span>
          {Number.isFinite(timestamp) && (
            <>
              <span aria-hidden="true">·</span>
              <span><time dateTime={collection.created_at}>{dateFormat.format(timestamp)}</time> 收录</span>
            </>
          )}
        </div>
        {platform && <div className="mt-2 text-sky-100"><CommercePracticeLabel platform={platform} /></div>}
        <h3 className="mt-3 break-words text-[22px] font-black leading-snug tracking-tight sm:text-[28px]">{collection.title}</h3>
        {collection.description && <p className="mt-2 break-words text-sm leading-6 text-slate-200">{collection.description}</p>}
        <div className="mt-auto pt-5">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-200 px-4 text-sm font-bold text-slate-950 transition-colors group-hover:bg-white">
            进入题集
            <svg aria-hidden="true" className="motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 12h15m-6-6 6 6-6 6" />
            </svg>
          </span>
        </div>
      </Link>
      <section aria-labelledby="preview-heading" className="flex min-w-0 flex-col px-5 pb-1 pt-4 sm:px-7 sm:pb-3 sm:pt-6">
        <h3 id="preview-heading" className="border-b border-slate-200 pb-3 text-sm font-bold text-slate-600">题目预览</h3>
        <Suspense fallback={<p className="py-6 text-sm text-slate-500" role="status">正在加载题目…</p>}>
          <QuestionPreview collectionId={collection.id} />
        </Suspense>
      </section>
    </article>
  );
}
