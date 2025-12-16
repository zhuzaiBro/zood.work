'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    if (!currentTag && tags.length > 0) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tag', tags[0].slug);
      router.replace(`/interview?${params.toString()}`);
    }
  }, [currentTag, tags, router, searchParams]);

  const handleTagClick = (tagSlug: string) => {
    // 如果点击的是当前选中的标签，不做操作（不允许取消选中）
    if (activeTag === tagSlug) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('tag', tagSlug);
    router.push(`/interview?${params.toString()}`);
  };

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex flex-wrap gap-3 min-w-max">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTag === tag.slug
                ? 'bg-orange-100 text-orange-600'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}

