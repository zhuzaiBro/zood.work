import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types/database.types';

type Collection = Database['public']['Tables']['interview_collections']['Row'];

interface CollectionCardProps {
  collection: Collection;
  questionCount?: number;
}

export default function CollectionCard({ collection, questionCount = 0 }: CollectionCardProps) {
  return (
    <Link 
      href={`/interview/${collection.id}`}
      className="group block min-h-40 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sky-50 ring-1 ring-sky-100">
          {collection.icon ? (
            collection.icon.startsWith('http') || collection.icon.startsWith('/') ? (
              <Image 
                src={collection.icon} 
                alt={collection.title} 
                width={48} 
                height={48} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">{collection.icon}</span>
            )
          ) : (
            <div className="w-full h-full bg-blue-100" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 line-clamp-1 text-base font-black text-slate-950 transition group-hover:text-sky-700">
            {collection.title}
          </h3>
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
            {collection.description}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
        <span className="font-semibold text-slate-500">{questionCount} 道题目</span>
        <span className="inline-flex items-center gap-1 font-bold text-sky-700">
          进入题集
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </span>
      </div>
    </Link>
  );
}
