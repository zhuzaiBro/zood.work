'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export type CollectionQuestionItem = {
  id: string;
  title: string;
  difficulty: string | null;
  isVip: boolean;
  tags: Array<{ id: string; name: string }>;
};

type QuestionCollectionBrowserProps = {
  questions: CollectionQuestionItem[];
};

function difficultyClass(difficulty: string | null) {
  if (difficulty === '简单') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (difficulty === '中等') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (difficulty === '困难') return 'bg-rose-50 text-rose-700 ring-rose-100';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

export default function QuestionCollectionBrowser({ questions }: QuestionCollectionBrowserProps) {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('全部难度');
  const [access, setAccess] = useState('全部题目');
  const normalizedQuery = query.trim().toLowerCase();

  const visibleQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesQuery =
        !normalizedQuery ||
        `${question.title} ${question.tags.map((tag) => tag.name).join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesDifficulty = difficulty === '全部难度' || question.difficulty === difficulty;
      const matchesAccess =
        access === '全部题目' ||
        (access === '免费题目' && !question.isVip) ||
        (access === '会员题目' && question.isVip);
      return matchesQuery && matchesDifficulty && matchesAccess;
    });
  }, [access, difficulty, normalizedQuery, questions]);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">题目列表</h2>
            <p className="mt-1 text-xs text-slate-500">按标题、难度和会员权限快速定位</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_140px_140px] xl:w-[680px]">
            <div className="relative">
              <svg aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m2.35-5.15a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
              </svg>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索题目或标签" className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
            </div>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-400">
              <option>全部难度</option><option>简单</option><option>中等</option><option>困难</option>
            </select>
            <select value={access} onChange={(event) => setAccess(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-400">
              <option>全部题目</option><option>免费题目</option><option>会员题目</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {visibleQuestions.map((question) => {
          const originalIndex = questions.findIndex((item) => item.id === question.id);
          return (
            <Link key={question.id} href={`/question/${question.id}`} className="group grid gap-3 px-4 py-4 transition hover:bg-sky-50/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
              <span className="hidden font-mono text-xs font-bold text-slate-400 sm:block">{String(originalIndex + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold leading-6 text-slate-900 transition group-hover:text-sky-700">{question.title}</h3>
                  {question.isVip && <span className="mt-0.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-700">VIP</span>}
                </div>
                {question.tags.length > 0 && <p className="mt-1 truncate text-xs text-slate-400">{question.tags.map((tag) => tag.name).join(' · ')}</p>}
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${difficultyClass(question.difficulty)}`}>{question.difficulty || '未知'}</span>
                <svg className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          );
        })}
        {visibleQuestions.length === 0 && (
          <div className="px-6 py-16 text-center"><p className="font-bold text-slate-900">没有匹配的题目</p><p className="mt-2 text-sm text-slate-500">试试更短的关键词或调整筛选条件。</p></div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:px-5">
        <span>显示 {visibleQuestions.length} / {questions.length} 道题目</span>
        {(query || difficulty !== '全部难度' || access !== '全部题目') && (
          <button type="button" onClick={() => { setQuery(''); setDifficulty('全部难度'); setAccess('全部题目'); }} className="font-semibold text-sky-700 hover:text-sky-900">清除筛选</button>
        )}
      </div>
    </section>
  );
}
