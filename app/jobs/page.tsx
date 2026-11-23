import Link from "next/link";
import CompanyLogo from "@/components/jobs/CompanyLogo";
import { jobDate, jobSalary, jobTags, type JobListing } from "@/lib/jobs/display";
import { platformPublic, PlatformError } from "@/lib/platform/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "远程工作岗位广场 - Web3 / AI / CEX 项目招聘",
  description:
    "油条TV 岗位广场聚合 Web3、AI、CEX项目和交易所远程工作机会，配合远程攻略、简历优化 Agent 与面试题库做求职准备。",
  keywords: ["远程工作", "远程攻略", "web3学习", "cex项目", "交易所攻略", "Web3岗位", "AI岗位", "油条TV"],
  alternates: {
    canonical: "/jobs",
  },
};

export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 24;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const keyword = valueOf(params.q).trim();
  const remoteOnly = valueOf(params.remote) === "1";
  const page = Math.min(400, Math.max(1, parseInt(valueOf(params.page), 10) || 1));

  const search = new URLSearchParams();
  if (keyword) search.set("q", keyword);
  if (remoteOnly) search.set("remote", "1");
  if (page > 1) search.set("page", String(page));
  const query = search.toString();

  let rows: JobListing[] = [];
  let total = 0;
  let pageSize = PAGE_SIZE;
  let error: { message: string } | null = null;

  try {
    const result = await platformPublic<{
      jobs: JobListing[];
      count: number;
      pageSize: number;
    }>(query ? `/api/platform/jobs?${query}` : "/api/platform/jobs");
    rows = result.jobs ?? [];
    total = result.count ?? rows.length;
    pageSize = result.pageSize || PAGE_SIZE;
  } catch (loadError) {
    error = {
      message: loadError instanceof PlatformError ? loadError.message : "请求失败",
    };
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const filtered = Boolean(keyword || remoteOnly);

  return (
    <div className="min-h-[calc(100vh-var(--site-header-height))] bg-[#f5f8fc] pb-14 text-slate-900">
      <h1 className="sr-only">岗位广场</h1>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8">
          <form action="/jobs" role="search" className="grid w-full grid-cols-[1fr_auto] items-center gap-2 sm:flex lg:max-w-3xl">
            <label className="col-span-2 flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-slate-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              <input name="q" type="search" aria-label="搜索岗位或公司" defaultValue={keyword} placeholder="搜岗位、公司或关键词"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" />
            </label>
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 whitespace-nowrap px-1 text-sm font-medium text-slate-700 sm:px-3">
              <input name="remote" type="checkbox" value="1" defaultChecked={remoteOnly} className="h-4 w-4 accent-blue-600" />
              只看远程
            </label>
            <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-blue-600">搜索</button>
          </form>
          <Link href="/jobs/agent" className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-blue-700 hover:underline">
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16v12H10l-5 4v-4H4z" strokeLinejoin="round" /></svg> 岗位助手
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8" aria-labelledby="job-results">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id="job-results" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{filtered ? "筛选结果" : "最新岗位"}</h2>
            {!error && <span className="text-sm tabular-nums text-slate-600">{total} 个岗位</span>}
          </div>
          {filtered && <Link href="/jobs" className="text-sm text-blue-700 hover:underline">清除筛选</Link>}
        </div>
        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-white p-6 text-red-700">岗位加载失败，请稍后刷新。</p>
        ) : rows.length ? (
          <ul className="grid gap-3 lg:grid-cols-2 lg:gap-4">
            {rows.map(job => <li className="min-w-0" key={job.id}><JobCard job={job} /></li>)}
          </ul>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            {filtered ? "没有找到匹配的岗位，试试公司名或更短的关键词。" : "当前还没有可展示的岗位。"}
            {(filtered || page > 1) && <Link href="/jobs" className="mt-3 block font-semibold text-blue-700">查看最新岗位</Link>}
          </div>
        )}
        {!error && pageCount > 1 && (
          <nav aria-label="岗位分页" className="mt-7 flex items-center justify-center gap-3">
            <PageLink disabled={page <= 1} page={page - 1} params={params}>上一页</PageLink>
            <span className="text-sm tabular-nums text-slate-600">{page} / {pageCount}</span>
            <PageLink disabled={page >= pageCount} page={page + 1} params={params}>下一页</PageLink>
          </nav>
        )}
      </section>
    </div>
  );
}

function JobCard({ job }: { job: JobListing }) {
  const date = jobDate(job.source_created_at);
  const tags = jobTags(job.tags).slice(0, 3);
  const details = [job.work_type_name, job.location].filter(value => value && value !== job.office_mode_name);
  return (
    <Link href={`/jobs/${job.id}`} className="group flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 text-slate-900 transition hover:border-blue-300 hover:shadow-sm focus-visible:outline-blue-600 sm:p-5">
      <div className="flex items-start gap-3">
        <CompanyLogo logo={job.company_logo} company={job.company_name} />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-bold leading-snug text-slate-950 group-hover:text-blue-700">{job.title || "未命名岗位"}</h3>
          {job.company_name && <p className="mt-1 truncate text-sm text-slate-600">{job.company_name}</p>}
        </div>
        {job.office_mode_name && <span className="shrink-0 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">{job.office_mode_name}</span>}
      </div>
      {job.description && <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-slate-600">{job.description}</p>}
      {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tags.map(tag =>
        <span key={tag} className="max-w-full truncate rounded bg-slate-100 px-2 py-0.5 text-xs leading-5 text-slate-600">{tag}</span>
      )}</div>}
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-3">
          <span className={job.min_salary || job.max_salary ? "text-sm font-semibold text-blue-800" : "text-sm text-slate-600"}>{jobSalary(job)}</span>
          {date && <time dateTime={job.source_created_at!} className="text-xs tabular-nums text-slate-500">{date} 发布</time>}
        </div>
        {details.length > 0 && <p className="mt-1.5 flex items-baseline gap-1.5 text-xs leading-5 text-slate-600"><svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0 self-center" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></svg><span className="break-words">{details.join(" · ")}</span></p>}
      </div>
    </Link>
  );
}

function PageLink({
  children,
  disabled,
  page,
  params,
}: {
  children: React.ReactNode;
  disabled: boolean;
  page: number;
  params: Record<string, string | string[] | undefined>;
}) {
  const href = buildPageHref(params, page);
  if (disabled) {
    return (
      <span className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
    >
      {children}
    </Link>
  );
}

function buildPageHref(
  params: Record<string, string | string[] | undefined>,
  page: number
) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const item = valueOf(value);
    if (item && key !== "page" && key !== "source") {
      next.set(key, item);
    }
  }
  if (page > 1) {
    next.set("page", String(page));
  }
  const query = next.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

function valueOf(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}
