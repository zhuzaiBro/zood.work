import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "岗位广场 - Web3 / AI 远程岗位",
  description: "浏览社区同步的 Web3、AI、区块链和远程开发岗位。",
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
  source_slug?: string | null;
  source_name?: string | null;
  source_created_at: string | null;
  last_synced_at: string;
  description: string | null;
  tags: unknown;
};

type JobSource = {
  slug: string;
  name: string;
};

const PAGE_SIZE = 24;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const keyword = valueOf(params.q);
  const source = valueOf(params.source);
  const remoteOnly = valueOf(params.remote) === "1";
  const page = Math.max(1, Number(valueOf(params.page) || "1") || 1);

  const supabase = await createClient();
  const db = supabase as any;

  const sourcesPromise = db
    .from("job_sources")
    .select("slug, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  let query = db
    .from("job_listings")
    .select(
      `
      id,
      title,
      company_name,
      company_logo,
      location,
      office_mode_name,
      work_type_name,
      min_salary,
      max_salary,
      source_slug,
      source_name,
      source_created_at,
      last_synced_at,
      description,
      tags
    `,
      { count: "exact" }
    )
    .order("source_created_at", { ascending: false, nullsFirst: false })
    .order("last_synced_at", { ascending: false });

  if (keyword) {
    const safeKeyword = keyword.replace(/[%_]/g, "\\$&");
    query = query.or(
      `title.ilike.%${safeKeyword}%,company_name.ilike.%${safeKeyword}%,description.ilike.%${safeKeyword}%`
    );
  }

  if (source && source !== "all") {
    query = query.eq("source_slug", source);
  }

  if (remoteOnly) {
    query = query.or(
      "office_mode_name.ilike.%remote%,location.ilike.%remote%,location.ilike.%Anywhere%"
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const [{ data: jobs, count, error }, { data: sources }] = await Promise.all([
    query.range(from, to),
    sourcesPromise,
  ]);

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sourceOptions = (sources ?? []) as JobSource[];
  const rows = (jobs ?? []) as JobListing[];

  return (
    <main className="-mt-20 min-h-screen bg-[#050b18] text-white">
      <section className="relative overflow-hidden px-4 pb-14 pt-32 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(117,192,247,0.28),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(45,212,191,0.18),transparent_28%),linear-gradient(135deg,#08152d_0%,#050b18_48%,#061827_100%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(117,192,247,0.26)_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-4 py-2 text-sm font-semibold text-[#75c0f7]">
                <span className="h-2 w-2 rounded-full bg-[#75c0f7] shadow-[0_0_18px_rgba(117,192,247,0.9)]" />
                Web3 / AI Job Board
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
                找到下一份能让你升级的技术岗位
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                聚合 DeJob、Cake.me、Web3.career 等来源，统一清洗成适合社区浏览的岗位库。先看岗位，再用简历 Agent 和面试题库做定向准备。
              </p>
            </div>

            <div className="rounded-[32px] border border-sky-200/15 bg-white/[0.06] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <form className="grid gap-3 md:grid-cols-[1fr_170px_130px_auto]">
                <input
                  name="q"
                  defaultValue={keyword}
                  placeholder="搜索 Solidity、React、AI Agent、Remote..."
                  className="rounded-2xl border border-sky-200/15 bg-[#071225]/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#75c0f7]/70"
                />
                <select
                  name="source"
                  defaultValue={source || "all"}
                  className="rounded-2xl border border-sky-200/15 bg-[#071225]/90 px-4 py-3 text-sm text-white outline-none transition focus:border-[#75c0f7]/70"
                >
                  <option value="all">全部来源</option>
                  {sourceOptions.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
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
          </div>

          {error ? (
            <div className="mt-10 rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-100">
              岗位加载失败：{error.message}
            </div>
          ) : rows.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
  const sourceName = job.source_name || job.source_slug || "Job Source";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex min-h-[310px] flex-col rounded-[28px] border border-sky-200/12 bg-[#081225]/88 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#75c0f7]/45 hover:bg-[#0b172c]"
    >
      <div className="flex items-start gap-4">
        <CompanyLogo logo={job.company_logo} company={job.company_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#75c0f7]/12 px-2.5 py-1 text-xs font-bold text-[#75c0f7]">
              {sourceName}
            </span>
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
        {job.description || "暂无岗位描述，点击查看来源详情。"}
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
    if (item && key !== "page") {
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
