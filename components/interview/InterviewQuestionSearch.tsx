'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type SearchQuestion = {
  id: string;
  title: string;
  difficulty: string | null;
  is_vip: boolean | null;
  collection_id: string | null;
  collection_title: string | null;
  excerpt: string;
};

interface InterviewQuestionSearchProps {
  initialQuery?: string;
}

function difficultyClass(difficulty: string | null) {
  if (difficulty === '简单') return 'bg-green-100 text-green-700';
  if (difficulty === '中等') return 'bg-yellow-100 text-yellow-700';
  if (difficulty === '困难') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

export default function InterviewQuestionSearch({ initialQuery = '' }: InterviewQuestionSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery.trim());
  const [results, setResults] = useState<SearchQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery.trim()));
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setInputValue(initialQuery);
    setQuery(initialQuery.trim());
    setHasSearched(Boolean(initialQuery.trim()));
  }, [initialQuery]);

  const syncUrl = useCallback(
    (nextQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextQuery) {
        params.set('q', nextQuery);
      } else {
        params.delete('q');
      }
      router.replace(`/interview?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = inputValue.trim();
      setQuery(trimmed);
      syncUrl(trimmed);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [inputValue, syncUrl]);

  useEffect(() => {
    if (!query) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setHasSearched(true);

    fetch(`/api/interview/questions/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('搜索失败');
        return res.json();
      })
      .then((data: { questions: SearchQuestion[] }) => {
        setResults(data.questions ?? []);
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') return;
        setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query]);

  const clearSearch = () => {
    setInputValue('');
    setQuery('');
    setResults([]);
    setHasSearched(false);
    syncUrl('');
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
          />
        </svg>
        <input
          type="search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="搜索面试题，支持标题与答案模糊匹配"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        {inputValue && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="清除搜索"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {hasSearched && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {loading ? '搜索中…' : `找到 ${results.length} 道相关题目`}
            </h2>
            {query && !loading && (
              <span className="text-xs text-gray-500">关键词：{query}</span>
            )}
          </div>

          {!loading && results.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              没有找到匹配的面试题，试试更短或更通用的关键词
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-gray-50">
              {results.map((question) => (
                <Link
                  key={question.id}
                  href={`/question/${question.id}`}
                  className="block px-4 py-4 transition hover:bg-blue-50/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-blue-600">{question.title}</span>
                    {question.is_vip && (
                      <span className="rounded border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                        VIP
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyClass(question.difficulty)}`}
                    >
                      {question.difficulty || '未知'}
                    </span>
                  </div>
                  {question.collection_title && (
                    <p className="mt-1 text-xs text-gray-500">来自：{question.collection_title}</p>
                  )}
                  {question.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{question.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
