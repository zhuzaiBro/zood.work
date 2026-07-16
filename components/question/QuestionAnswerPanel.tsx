'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';

type QuestionAnswerPanelProps = {
  children: ReactNode;
  canHide?: boolean;
};

export default function QuestionAnswerPanel({ children, canHide = true }: QuestionAnswerPanelProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
        <span className="mr-auto text-sm font-black text-slate-950">参考答案</span>
        {canHide && (
          <button
            type="button"
            onClick={() => setHidden((value) => !value)}
            aria-pressed={hidden}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${hidden ? 'bg-sky-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {hidden ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zm9.5 2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A9.8 9.8 0 0112 5c4.5 0 8.3 2.9 9.5 7a10 10 0 01-2.1 3.5M6.6 6.6A10.5 10.5 0 002.5 12c1.3 4.1 5.1 7 9.5 7 1 0 2-.2 2.9-.5" />}
            </svg>
            {hidden ? '显示答案' : '先自己想'}
          </button>
        )}
        <Link href="/mock-interview" className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
          模拟面试
        </Link>
      </div>

      {hidden ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-sky-200 bg-sky-50/60 px-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="mt-4 font-black text-slate-950">先组织一下你的答案</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">建议先说结论，再补充原理、边界条件和实际项目经验。</p>
          <button type="button" onClick={() => setHidden(false)} className="mt-5 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">查看参考答案</button>
        </div>
      ) : children}
    </>
  );
}
