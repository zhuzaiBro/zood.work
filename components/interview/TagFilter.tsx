'use client';

import { Database } from '@/types/database.types';
import { useRouter, useSearchParams } from 'next/navigation';

type Tag = Database['public']['Tables']['interview_tags']['Row'];

interface TagFilterProps {
  tags: Tag[];
}

export default function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get('tag');
  
  // 默认选中第一个标签
  const activeTag = currentTag || tags[0]?.slug;

  const handleTagClick = (tagSlug: string) => {
    // 如果点击的是当前选中的标签，不做操作（不允许取消选中）
    if (activeTag === tagSlug) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('tag', tagSlug);
    router.push(`/interview?${params.toString()}`, { scroll: false });
  };

  if (!tags.length) return null;

  return (
    <div role="group" aria-label="技术方向" className="flex max-w-full flex-wrap gap-1">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className={`min-h-9 rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:px-3 sm:text-sm ${
            activeTag === tag.slug ? 'bg-sky-100 font-bold text-sky-800' : 'text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
          aria-pressed={activeTag === tag.slug}
          onClick={() => handleTagClick(tag.slug)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
