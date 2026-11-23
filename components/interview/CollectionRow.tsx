import { commercePlatformFor } from '@/lib/interview/commercePlatforms';
import CommercePracticeLabel from '@/components/interview/CommercePracticeLabel';
import Link from 'next/link';
import CollectionIcon from './CollectionIcon';
import type { CountedCollection } from '@/lib/interview/directory';

export default function CollectionRow({ collection }: { collection: CountedCollection }) {
  const platform = commercePlatformFor(collection.id);
  return (
    <Link
      href={`/interview/${collection.id}`}
      className="group -mx-2 flex h-full items-center gap-3 rounded-md px-2 py-4 transition-colors hover:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:gap-4"
    >
      <CollectionIcon icon={platform?.icon ?? collection.icon} title={collection.title} />
      <div className="min-w-0 flex-1">
        <h4 className="break-words text-base font-bold leading-6 text-slate-950 group-hover:text-sky-700">{collection.title}</h4>
        {platform && <div className="mt-1 text-slate-500"><CommercePracticeLabel platform={platform} showIcon={false} /></div>}
        {collection.description && (
          <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-slate-600">{collection.description}</p>
        )}
      </div>
      <span className="shrink-0 text-xs tabular-nums text-slate-500">
        {collection.questionCount > 0 ? `${collection.questionCount} 道题` : '暂无题目'}
      </span>
      <svg aria-hidden="true" className="w-3.5 shrink-0 text-slate-400 group-hover:text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}
