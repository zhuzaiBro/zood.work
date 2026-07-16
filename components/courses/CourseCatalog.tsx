'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export type CourseCatalogItem = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price: number;
  is_free: boolean;
  status: string;
  created_at: string;
  lessonCount: number;
  totalDuration: number;
};

type CourseCatalogProps = {
  courses: CourseCatalogItem[];
};

type CourseFilter = 'all' | 'free' | 'paid' | 'ready';

const filters: Array<{ value: CourseFilter; label: string }> = [
  { value: 'all', label: '全部课程' },
  { value: 'ready', label: '立即可学' },
  { value: 'free', label: '免费课程' },
  { value: 'paid', label: '付费课程' },
];

function formatLearningTime(seconds: number) {
  if (seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.max(1, Math.round((seconds % 3600) / 60));
  if (hours > 0) return `${hours} 小时 ${minutes} 分`;
  return `${minutes} 分钟`;
}

export default function CourseCatalog({ courses }: CourseCatalogProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CourseFilter>('all');
  const normalizedQuery = query.trim().toLowerCase();

  const visibleCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesQuery =
        !normalizedQuery ||
        `${course.title} ${course.description ?? ''}`.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'free' && course.is_free) ||
        (filter === 'paid' && !course.is_free) ||
        (filter === 'ready' && course.lessonCount > 0);
      return matchesQuery && matchesFilter;
    });
  }, [courses, filter, normalizedQuery]);

  const readyCount = courses.filter((course) => course.lessonCount > 0).length;
  const lessonCount = courses.reduce((sum, course) => sum + course.lessonCount, 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f1f6fb_34%,#f7f9fc_100%)] pb-16">
      <section className="border-b border-slate-200/70 bg-white/65">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-sky-600">ZOOD LEARNING</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">选择一条学习路线</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                从基础入门到交易所项目实战，按自己的节奏持续学习。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="min-w-28 border-l-2 border-sky-400 pl-3">
                <p className="text-2xl font-black text-slate-950">{readyCount}</p>
                <p className="text-xs text-slate-500">门课程可立即学习</p>
              </div>
              <div className="min-w-28 border-l-2 border-emerald-400 pl-3">
                <p className="text-2xl font-black text-slate-950">{lessonCount}</p>
                <p className="text-xs text-slate-500">节系统课时</p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <svg aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m2.35-5.15a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索课程名称或学习方向"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100/80 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="课程筛选">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={`h-9 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition ${
                    filter === item.value
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">找到 {visibleCourses.length} 门课程</p>
          {(query || filter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
              className="text-sm font-semibold text-sky-700 hover:text-sky-900"
            >
              清除筛选
            </button>
          )}
        </div>

        {visibleCourses.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => {
              const learningTime = formatLearningTime(course.totalDuration);
              const available = course.lessonCount > 0;
              return (
                <article key={course.id} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_16px_34px_rgba(15,23,42,0.09)]">
                  <Link href={`/learn?courseId=${course.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      {course.cover_image_url ? (
                        <Image src={course.cover_image_url} alt={course.title} fill unoptimized sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#e0f2fe,#dbeafe_52%,#ecfeff)] text-sky-700">
                          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-bold shadow-sm ${course.is_free ? 'bg-emerald-500 text-white' : 'bg-white text-slate-950'}`}>
                        {course.is_free ? '免费学习' : `¥${course.price}`}
                      </span>
                      {!available && (
                        <span className="absolute right-3 top-3 rounded-md bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">即将开课</span>
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="line-clamp-2 min-h-14 text-xl font-black leading-7 text-slate-950 transition group-hover:text-sky-700">{course.title}</h2>
                      <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">{course.description || '系统整理课程内容，跟着课时逐步完成学习。'}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1.5">{course.lessonCount} 节课</span>
                        {learningTime && <span className="rounded-md bg-slate-100 px-2.5 py-1.5">约 {learningTime}</span>}
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-xs text-slate-400">{new Date(course.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })}</span>
                        <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${available ? 'text-sky-700' : 'text-slate-500'}`}>
                          {available ? '开始学习' : '查看课程'}
                          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-bold text-slate-900">没有找到匹配的课程</p>
            <p className="mt-2 text-sm text-slate-500">换个关键词，或者清除当前筛选条件。</p>
          </div>
        )}
      </section>
    </div>
  );
}
