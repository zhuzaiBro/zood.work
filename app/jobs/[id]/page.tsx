import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobContactPanel from "@/components/jobs/JobContactPanel";

export const revalidate = 60;

type Params = Promise<{ id: string }>;

type JobDetail = {
  id: string;
  title: string | null;
  company_name: string | null;
  company_logo: string | null;
  company_website: string | null;
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
  requirements: string | null;
  benefits: string | null;
  extra_content: string | null;
  tags: unknown;
};

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("job_listings")
    .select("title, company_name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: data?.title
      ? `${data.title} - ${data.company_name || "岗位详情"}`
      : "岗位详情",
  };
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: job, error } = await (supabase as any)
    .from("job_listings")
    .select(
      `
      id,
      title,
      company_name,
      company_logo,
      company_website,
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
      requirements,
      benefits,
      extra_content,
      tags
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Load job detail failed:", error);
  }
  if (!job) {
    notFound();
  }

  const detail = job as JobDetail;
  const sourceName = detail.source_name || detail.source_slug || "Job Source";
  const tags = normalizeTags(detail.tags);
  const sections = [
    { title: "岗位描述", content: detail.description },
    { title: "岗位要求", content: detail.requirements },
    { title: "你会负责", content: detail.extra_content },
    { title: "福利与亮点", content: detail.benefits },
  ].filter((section) => section.content && section.content.trim());

  return (
    <main className="-mt-20 min-h-screen bg-[#050b18] text-white">
      <section className="relative overflow-hidden px-4 pb-12 pt-32 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(117,192,247,0.24),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(45,212,191,0.16),transparent_28%),linear-gradient(135deg,#08152d_0%,#050b18_52%,#061827_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(117,192,247,0.26)_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/jobs"
            className="inline-flex items-center rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-bold text-[#75c0f7] transition hover:bg-sky-300/15"
          >
            ← 返回岗位广场
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <article className="rounded-[34px] border border-sky-200/15 bg-[#081225]/88 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <CompanyLogo logo={detail.company_logo} company={detail.company_name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#75c0f7]/12 px-3 py-1 text-xs font-bold text-[#75c0f7]">
                      {sourceName}
                    </span>
                    {detail.work_type_name && (
                      <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-bold text-slate-200">
                        {detail.work_type_name}
                      </span>
                    )}
                    {detail.office_mode_name && (
                      <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
                        {detail.office_mode_name}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                    {detail.title || "未命名岗位"}
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-slate-300">
                    {detail.company_name || "Unknown Company"}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <InfoCard label="地点" value={detail.location || "未标注"} />
                <InfoCard
                  label="薪资"
                  value={formatSalary(detail.min_salary, detail.max_salary)}
                />
                <InfoCard
                  label="同步时间"
                  value={formatDate(detail.last_synced_at)}
                />
              </div>

              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-10 space-y-8">
                {sections.length > 0 ? (
                  sections.map((section) => (
                    <section key={section.title}>
                      <h2 className="text-2xl font-black text-white">
                        {section.title}
                      </h2>
                      <div className="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-300">
                        {section.content}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">
                    暂无岗位详情，可以通过右侧联系方式面板解锁投递入口。
                  </div>
                )}
              </div>
            </article>

            <aside className="space-y-5">
              <div className="sticky top-28 rounded-[30px] border border-sky-200/15 bg-white/[0.06] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                <h2 className="text-lg font-black text-white">准备投递</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  看完岗位后，可以先用简历优化 Agent 对齐 JD，再去面试题库补短板。
                </p>
                <div className="mt-5 grid gap-3">
                  <JobContactPanel jobId={detail.id} />
                  <Link
                    href="/resume-agent"
                    className="inline-flex justify-center rounded-2xl border border-[#75c0f7]/30 px-5 py-3 text-sm font-bold text-[#75c0f7] transition hover:bg-[#75c0f7]/10"
                  >
                    简历优化 Agent
                  </Link>
                  <Link
                    href="/interview"
                    className="inline-flex justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06]"
                  >
                    刷面试题库
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-slate-100">{value}</p>
    </div>
  );
}

function CompanyLogo({ logo, company }: { logo: string | null; company: string | null }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={company || "Company"}
        className="h-20 w-20 rounded-3xl border border-white/10 bg-white object-contain p-3"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#75c0f7]/25 bg-[#75c0f7]/10 text-3xl font-black text-[#75c0f7]">
      {(company || "J").slice(0, 1).toUpperCase()}
    </div>
  );
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

function formatDate(value: string | null) {
  if (!value) return "刚刚";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "刚刚";
  return parsed.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}
