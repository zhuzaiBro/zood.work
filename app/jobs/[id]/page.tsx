import Link from "next/link";
import { notFound } from "next/navigation";
import { platformPublic, PlatformError } from "@/lib/platform/client";
import CompanyLogo from "@/components/jobs/CompanyLogo";
import { jobDate, jobTags, jobSalary, type JobListing } from "@/lib/jobs/display";
import JobContactPanel from "@/components/jobs/JobContactPanel";
import type { Metadata } from "next";

export const revalidate = 60;

type Params = Promise<{ id: string }>;

type JobDetail = JobListing & {
  requirements: string | null;
  benefits: string | null;
  extra_content: string | null;
  company_website?: string | null;
  has_contact?: boolean;
};

async function loadJob(id: string) {
  try {
    const { job } = await platformPublic<{ job: JobDetail | null }>(
      `/api/platform/jobs/${encodeURIComponent(id)}`,
    );
    return job ?? null;
  } catch (error) {
    if (error instanceof PlatformError && error.status === 404) return null;
    console.error("Load job detail failed:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const data = await loadJob(id);

  const title = data?.title
    ? `${data.title} - ${data.company_name || "岗位详情"}`
    : "岗位详情";
  const description = data?.description
    ? `${data.description.slice(0, 110)}${data.description.length > 110 ? "..." : ""}`
    : "油条TV 岗位详情，覆盖 Web3、AI、CEX项目、交易所岗位和远程工作机会。";

  return {
    title,
    description,
    keywords: ["远程工作", "远程攻略", "web3学习", "cex项目", "交易所攻略", data?.company_name, data?.office_mode_name, data?.location].filter(Boolean) as string[],
    alternates: {
      canonical: `/jobs/${id}`,
    },
  };
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const job = await loadJob(id);

  if (!job) {
    notFound();
  }

  const detail = job;
  const website = companyWebsite(detail.company_website);
  const tags = jobTags(detail.tags);
  const sections = [
    { title: "岗位描述", content: detail.description },
    { title: "岗位要求", content: detail.requirements },
    { title: "你会负责", content: detail.extra_content },
    { title: "福利与亮点", content: detail.benefits },
  ].filter((section) => section.content && section.content.trim());

  return (
    <div className="min-h-[calc(100vh-var(--site-header-height))] bg-[#f5f8fc] pb-12 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <Link
            href="/jobs"
            className="inline-flex items-center rounded-md py-1 text-sm font-semibold text-blue-700 hover:underline"
          >
            ← 返回岗位广场
          </Link>

          <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
              <div className="flex items-start gap-4">
                <CompanyLogo logo={detail.company_logo} company={detail.company_name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {detail.work_type_name && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {detail.work_type_name}
                      </span>
                    )}
                    {detail.office_mode_name && (
                      <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
                        {detail.office_mode_name}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 break-words text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                    {detail.title || "未命名岗位"}
                  </h1>
                  <p className="mt-1.5 text-base text-slate-600">
                    {detail.company_name || "公司未注明"}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <InfoCard label="地点" value={detail.location || "未标注"} />
                <InfoCard
                  label="薪资"
                  value={jobSalary(detail)}
                />
                <InfoCard
                  label={detail.source_created_at ? "发布时间" : "同步时间"}
                  value={jobDate(detail.source_created_at || detail.last_synced_at) || "未注明"}
                />
              </div>

              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
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
                      <h2 className="text-lg font-bold text-slate-950">
                        {section.title}
                      </h2>
                      <div className="mt-3 whitespace-pre-line break-words text-[15px] leading-8 text-slate-700">
                        {section.content}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="rounded-lg bg-slate-50 p-5 text-slate-600">
                    招聘方暂未提供详细说明。
                  </div>
                )}
              </div>
            </article>

            <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold text-slate-950">准备投递</h2>
                <div className="mt-5 grid gap-3">
                  {website && <a href={website} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700">访问公司官网 ↗</a>}
                  {detail.has_contact !== false && <JobContactPanel jobId={detail.id} />}
                  {!website && detail.has_contact === false && <p className="text-sm text-slate-600">招聘方暂未公开投递方式。</p>}
                  <Link
                    href="/resume-agent"
                    className="inline-flex justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    简历优化 Agent
                  </Link>
                  <Link
                    href="/interview"
                    className="inline-flex justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    刷面试题库
                  </Link>
                </div>
              </div>
            </aside>
          </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function companyWebsite(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    if (/(^|\.)dejob\.(ai|top)$/i.test(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}
