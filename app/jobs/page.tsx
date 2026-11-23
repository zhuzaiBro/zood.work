import Link from "next/link";
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

type JobListing = {
  id: string;
  title: string | null;
  company_name: string | null;
  company_logo: string | null;
  location: string | null;
  office_mode_name: string | null;
  work_type_name: string | null;
  min_salary: number | null;
  max_salary: number | null;
  source_created_at: string | null;
  last_synced_at: string;
  description: string | null;
  tags: unknown;
};

const PAGE_SIZE = 24;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const keyword = valueOf(params.q);
  const remoteOnly = valueOf(params.remote) === "1";
  const page = Math.max(1, Number(valueOf(params.page) || "1") || 1);

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

  return (
    <main className="-mt-20 min-h-screen bg-[#050b18] text-white">
      <section className="relative overflow-hidden px-4 pb-14 pt-[calc(var(--site-header-height)+1.5rem)] sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(117,192,247,0.28),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(45,212,191,0.18),transparent_28%),linear-gradient(135deg,#08152d_0%,#050b18_48%,#061827_100%)]" />

        <div className="relative mx-auto max-w-7xl">
          <h1 className="sr-only">岗位广场</h1>
          <div className="rounded-2xl border border-sky-200/15 bg-white/[0.06] p-4 sm:p-5">
            <form className="grid gap-3 md:grid-cols-[1fr_130px_auto]">
              <input
                name="q"
                aria-label="搜索岗位"
                defaultValue={keyword}
                placeholder="搜索 Solidity、React、AI Agent、Remote..."
                className="rounded-2xl border border-sky-200/15 bg-[#071225]/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#75c0f7]/70"
              />
              <label className="flex items-center justify-center gap-2 rounded-2xl border border-sky-200/15 bg-[#071225]/90 px-4 py-3 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  name="remote"
                  value="1"
                  defaultChecked={remoteOnly}
                  className="h-4 w-4 accent-[#75c0f7]"
                />
                远程
              </label>
              <button className="rounded-2xl bg-[#75c0f7] px-5 py-3 text-sm font-black text-[#041020] transition hover:bg-sky-200">
                搜索
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="rounded-full bg-white/[0.08] px-3 py-1">
                已同步 {total} 个岗位
              </span>
              <Link
                href="/jobs/agent"
                className="rounded-full border border-[#75c0f7]/30 px-3 py-1 font-semibold text-[#75c0f7] transition hover:bg-[#75c0f7]/10"
              >
                用岗位 Agent 对话检索
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-10 rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-100">
              岗位加载失败：{error.message}
            </div>
          ) : rows.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-[32px] border border-sky-200/15 bg-white/[0.06] p-12 text-center text-slate-300">
              暂时没有匹配岗位，换一个关键词试试。
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <PageLink disabled={page <= 1} page={page - 1} params={params}>
                上一页
              </PageLink>
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
                {page} / {pageCount}
              </span>
              <PageLink disabled={page >= pageCount} page={page + 1} params={params}>
                下一页
              </PageLink>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function JobCard({ job }: { job: JobListing }) {
  const tags = normalizeTags(job.tags).slice(0, 4);
  const salary = formatSalary(job.min_salary, job.max_salary);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex min-h-[310px] flex-col rounded-[28px] border border-sky-200/12 bg-[#081225]/88 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#75c0f7]/45 hover:bg-[#0b172c]"
    >
      <div className="flex items-start gap-4">
        <CompanyLogo logo={job.company_logo} company={job.company_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {job.office_mode_name && (
              <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-200">
                {job.office_mode_name}
              </span>
            )}
          </div>
          <h2 className="mt-3 line-clamp-2 text-xl font-black leading-snug text-white transition group-hover:text-[#75c0f7]">
            {job.title || "未命名岗位"}
          </h2>
          <p className="mt-2 truncate text-sm font-semibold text-slate-300">
            {job.company_name || "Unknown Company"}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 flex-1 text-sm leading-7 text-slate-400">
        {job.description || "暂无岗位描述，点击查看岗位详情。"}
      </p>

      <div className="mt-5 space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">地点</span>
          <span className="truncate font-semibold">{job.location || "未标注"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">薪资</span>
          <span className="font-semibold text-[#9ee7ff]">{salary}</span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function CompanyLogo({ logo, company }: { logo: string | null; company: string | null }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={company || "Company"}
        className="h-14 w-14 rounded-2xl border border-white/10 bg-white object-contain p-2"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#75c0f7]/25 bg-[#75c0f7]/10 text-xl font-black text-[#75c0f7]">
      {(company || "J").slice(0, 1).toUpperCase()}
    </div>
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
      <span className="cursor-not-allowed rounded-full border border-white/10 px-4 py-2 text-sm text-slate-600">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full border border-[#75c0f7]/30 px-4 py-2 text-sm font-bold text-[#75c0f7] transition hover:bg-[#75c0f7]/10"
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

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "tagName" in item) {
        return String((item as { tagName?: unknown }).tagName ?? "");
      }
      return "";
    })
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSalary(min: number | null, max: number | null) {
  const format = (value: number) =>
    new Intl.NumberFormat("en-US", {
      notation: value >= 10000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value);

  if (min && max) return `$${format(min)} - $${format(max)}`;
  if (min) return `$${format(min)}+`;
  if (max) return `最高 $${format(max)}`;
  return "未公开";
}
