'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';

type SearchQuestion = {
  id: string;
  title: string;
  difficulty: string | null;
  is_vip: boolean | null;
  collection_title: string | null;
  excerpt: string;
};

export default function InterviewQuestionSearch({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<number | undefined>(undefined);
  const lastRequest = useRef<string | null>(null);
  const composing = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuery !== lastRequest.current) setValue(initialQuery);
    lastRequest.current = null;
  }, [initialQuery]);

  const role = searchParams.get('role');
  const tag = searchParams.get('tag');
  useEffect(() => () => window.clearTimeout(timer.current), [role, tag]);

  const search = (text: string) => {
    window.clearTimeout(timer.current);
    const query = text.trim();
    if (query === (searchParams.get('q') ?? '') && lastRequest.current === null) return;
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set('q', query);
    else params.delete('q');
    lastRequest.current = query;
    router.replace(params.size ? `/interview?${params}` : '/interview', { scroll: false });
  };

  const schedule = (text: string) => {
    window.clearTimeout(timer.current);
    if (!composing.current) timer.current = window.setTimeout(() => search(text), 300);
  };

  return (
    <form role="search" className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 text-slate-400 shadow-sm transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100" onSubmit={(event) => {
      event.preventDefault();
      if (!composing.current) search(value);
    }}>
      <SearchOutlined aria-hidden="true" />
      <input
        ref={input}
        type="search"
        aria-label="搜索全部面试题"
        placeholder="搜题目或答案"
        className="h-full min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-500 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        value={value}
        onCompositionStart={() => { composing.current = true; window.clearTimeout(timer.current); }}
        onCompositionEnd={(event) => { composing.current = false; schedule(event.currentTarget.value); }}
        onChange={(event) => { setValue(event.target.value); schedule(event.target.value); }}
      />
      {value && (
        <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-500" aria-label="清除搜索" onClick={() => {
          setValue('');
          search('');
          input.current?.focus();
        }}><CloseOutlined /></button>
      )}
    </form>
  );
}

export function InterviewSearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<SearchQuestion[]>([]);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/interview/questions/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('搜索失败');
        return res.json();
      })
      .then((data: { questions: SearchQuestion[] }) => {
        if (controller.signal.aborted) return;
        setResults(data.questions ?? []);
        setStatus('done');
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [query]);

  return (
    <section aria-labelledby="result-heading" aria-busy={status === 'loading'}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 id="result-heading" className="text-xl font-black text-slate-950">搜索结果</h2>
        <span role="status" className="text-sm text-slate-500">{status === 'loading' ? '搜索中…' : status === 'done' ? `${results.length} 道题目` : ''}</span>
      </div>
      {status === 'error' && <p className="break-words px-5 py-12 text-center text-sm text-slate-600" role="alert">搜索暂时不可用，请稍后再试。</p>}
      {status === 'done' && !results.length && <p className="break-words px-5 py-12 text-center text-sm text-slate-600">没有找到与「{query}」相关的题目，试试更短的关键词。</p>}
      {results.map((question) => (
        <Link key={question.id} href={`/question/${question.id}`} className="group block border-b border-slate-100 px-4 py-4 transition-colors last:border-b-0 hover:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:px-5">
          <h3 className="break-words text-base font-bold text-slate-950 group-hover:text-sky-700">{question.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {question.is_vip && <strong className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">VIP</strong>}
            <span>{question.difficulty || '难度未知'}</span>
            {question.collection_title && <span>{question.collection_title}</span>}
          </div>
          {question.excerpt && <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-600">{question.excerpt}</p>}
        </Link>
      ))}
    </section>
  );
}
