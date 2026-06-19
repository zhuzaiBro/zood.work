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
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex flex-nowrap items-center gap-5">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.slug)}
            className={`whitespace-nowrap text-sm transition-colors ${
              activeTag === tag.slug
                ? 'font-semibold text-orange-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}

