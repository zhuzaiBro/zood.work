'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';

type SidebarQuestion = {
  id: string;
  title: string;
};

type QuestionSidebarProps = {
  questions: SidebarQuestion[];
  activeQuestionId: string;
  collectionTitle?: string | null;
};

export default function QuestionSidebar({ questions, activeQuestionId, collectionTitle }: QuestionSidebarProps) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredQuestions = useMemo(
    () => questions.filter((question) => question.title.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery, questions],
  );
  const activeIndex = questions.findIndex((question) => question.id === activeQuestionId);

  useEffect(() => {
    const activeItem = listRef.current?.querySelector<HTMLElement>(`[data-question-id="${activeQuestionId}"]`);
    activeItem?.scrollIntoView({ block: 'center' });
  }, [activeQuestionId]);

  const renderQuestionList = (scrollRef?: RefObject<HTMLDivElement | null>) => (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
      <nav className="space-y-1" aria-label="题目目录">
        {filteredQuestions.map((question) => {
          const originalIndex = questions.findIndex((item) => item.id === question.id);
          const isActive = question.id === activeQuestionId;
          return (
            <Link
              key={question.id}
              href={`/question/${question.id}`}
              data-question-id={question.id}
              aria-current={isActive ? 'page' : undefined}
              className={`grid grid-cols-[28px_minmax(0,1fr)] gap-2 rounded-md px-3 py-2.5 text-sm leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isActive
                  ? 'bg-sky-50 font-semibold text-sky-800 ring-1 ring-sky-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <span className={`font-mono text-xs ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>{String(originalIndex + 1).padStart(2, '0')}</span>
              <span>{question.title}</span>
            </Link>
          );
        })}
        {filteredQuestions.length === 0 && (
          <div className="px-3 py-10 text-center text-xs text-slate-400">没有匹配的题目</div>
        )}
      </nav>
    </div>
  );

  return (
    <aside className="w-full flex-shrink-0 lg:w-80">
      <details className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 marker:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">{collectionTitle || '题目目录'}</p>
            <p className="mt-0.5 text-xs text-slate-400">当前 {activeIndex + 1} / {questions.length} 题</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
            展开目录
            <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </span>
        </summary>
        <div className="border-t border-slate-200 p-3">
          <div className="relative">
            <svg aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m2.35-5.15a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" /></svg>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索本题集" className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto border-t border-slate-100">{renderQuestionList()}</div>
      </details>

      <div className="hidden max-h-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:flex lg:max-h-[calc(100vh-var(--site-header-height)-3rem)]">
        <div className="border-b border-slate-200 p-4">
          <p className="truncate text-sm font-black text-slate-950">{collectionTitle || '题目目录'}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>{questions.length} 道题</span>
            {activeIndex >= 0 && <span>当前 {activeIndex + 1} / {questions.length}</span>}
          </div>
          <div className="relative mt-3">
            <svg aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m2.35-5.15a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索本题集"
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        {renderQuestionList(listRef)}
      </div>
    </aside>
  );
}
