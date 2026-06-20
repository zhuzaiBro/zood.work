"use client";

import { useMemo, useState } from "react";

type ExperienceLevel = "student" | "junior" | "mid" | "senior";

type ResumeOptimizationResult = {
  score: number;
  positioning: string;
  coreProblems: string[];
  rewrittenSummary: string;
  optimizedBullets: string[];
  keywords: string[];
  actionPlan: string[];
  interviewStories: string[];
  resumeHtml: string;
};

type UploadedResumeFile = {
  name: string;
  size: number;
  type: string;
  cosKey: string;
  cosUrl: string | null;
};

const experienceOptions: { value: ExperienceLevel; label: string }[] = [
  { value: "student", label: "学生 / 转行准备" },
  { value: "junior", label: "初级工程师" },
  { value: "mid", label: "中级工程师" },
  { value: "senior", label: "高级 / 负责人" },
];

const demoResume = `姓名：Zood
目标：Web3 / AI 全栈开发

技能：
- Next.js、React、TypeScript、Node.js
- Solidity、Ethers、Viem、Wagmi
- LangChain、RAG、通义千问 / DashScope API

项目经历：
1. 做过一个 Web3 学习社区，包含文章、面试题、课程播放、水龙头等功能。
2. 做过一个测试币水龙头，可以连接钱包并领取测试网 Gas。
3. 做过 AI 问答和课程学习相关功能。

工作经历：
- 负责前端页面开发、接口联调、部署和问题排查。
- 和后端一起设计业务表和权限策略。
`;

function ListBlock({
  title,
  items,
  accent = "sky",
}: {
  title: string;
  items: string[];
  accent?: "sky" | "cyan" | "amber" | "emerald";
}) {
  const accentClass = {
    sky: "border-sky-300/20 bg-sky-300/5 text-sky-100",
    cyan: "border-cyan-300/20 bg-cyan-300/5 text-cyan-100",
    amber: "border-amber-300/20 bg-amber-300/5 text-amber-100",
    emerald: "border-emerald-300/20 bg-emerald-300/5 text-emerald-100",
  }[accent];

  return (
    <section className={`rounded-3xl border p-5 ${accentClass}`}>
      <h3 className="text-base font-black text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex gap-3 rounded-2xl border border-white/10 bg-black/15 p-3 text-sm leading-6 text-slate-200"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-sky-100">
              {index + 1}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ResumeOptimizerClient() {
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Web3 / AI 全栈开发工程师");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("mid");
  const [result, setResult] = useState<ResumeOptimizationResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedResumeFile | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = resumeText.trim().length >= 80 && targetRole.trim().length >= 2;

  const copyText = useMemo(() => {
    if (!result) return "";

    return [
      `匹配分：${result.score}`,
      `定位：${result.positioning}`,
      "",
      "优化后摘要：",
      result.rewrittenSummary,
      "",
      "优化后经历：",
      ...result.optimizedBullets.map((item) => `- ${item}`),
      "",
      "关键词：",
      result.keywords.join("、"),
      "",
      "行动计划：",
      ...result.actionPlan.map((item) => `- ${item}`),
    ].join("\n");
  }, [result]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("请至少填写 80 个字符的简历内容，并补充目标岗位。");
      return;
    }

    setIsLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/agents/resume-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          targetRole,
          jobDescription,
          experienceLevel,
          language: "zh",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "简历优化失败");
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "简历优化失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadResume = async (file?: File) => {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setUploadedFile(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/agents/resume-optimizer/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.file) {
          setUploadedFile(data.file);
        }
        throw new Error(data.error || "简历上传失败");
      }

      setUploadedFile(data.file);
      setResumeText(data.resumeText || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "简历上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = async () => {
    if (!copyText) return;

    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleDownloadHtml = () => {
    if (!result?.resumeHtml) return;

    const blob = new Blob([result.resumeHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "optimized-resume.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!result?.resumeHtml) return;

    const printWindow = window.open("", "_blank", "width=960,height=1200");
    if (!printWindow) {
      setError("浏览器拦截了弹窗，请允许弹窗后再导出 PDF。");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(result.resumeHtml);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="rounded-[2rem] border border-sky-300/15 bg-[#07101f]/82 p-5 shadow-[0_24px_80px_rgba(14,165,233,0.12)] backdrop-blur-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#75c0f7]">
              Input
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">投喂你的简历</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              粘贴简历文本和目标岗位，Agent 会从匹配度、叙事、关键词和项目 bullet 四个方向优化。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResumeText(demoResume)}
            className="shrink-0 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-bold text-sky-100 transition-colors hover:bg-sky-300/15"
          >
            填入示例
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-200">目标岗位</span>
            <input
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-sky-300/60"
              placeholder="例如：AI 应用开发工程师 / Web3 前端工程师"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-200">经验阶段</span>
            <select
              value={experienceLevel}
              onChange={(event) => setExperienceLevel(event.target.value as ExperienceLevel)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-sky-300/60"
            >
              {experienceOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-3xl border border-sky-300/15 bg-sky-300/[0.04] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-100">上传简历文件</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  支持 PDF / TXT，上传到腾讯云 COS 后自动抽取文本填入下方。
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-300/10 px-4 py-2.5 text-sm font-black text-sky-100 transition-colors hover:bg-sky-300/15">
                {isUploading ? "上传解析中..." : "选择文件"}
                <input
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    void handleUploadResume(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {uploadedFile && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-300">
                <p className="font-bold text-slate-100">{uploadedFile.name}</p>
                <p className="mt-1 break-all text-slate-500">COS Key：{uploadedFile.cosKey}</p>
                {uploadedFile.cosUrl && (
                  <a
                    href={uploadedFile.cosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex text-sky-200 underline decoration-sky-300/40 underline-offset-4"
                  >
                    查看 COS 文件
                  </a>
                )}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-200">简历内容</span>
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              className="mt-2 min-h-[320px] w-full resize-y rounded-3xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-7 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-sky-300/60"
              placeholder="把你的简历文本粘贴到这里：技能、项目、经历、教育背景都可以..."
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-200">目标 JD（可选）</span>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="mt-2 min-h-28 w-full resize-y rounded-3xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-7 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-sky-300/60"
              placeholder="如果有岗位 JD，粘贴后匹配会更准。"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isLoading || !canSubmit}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-500 px-5 py-4 text-base font-black text-[#03111f] shadow-[0_20px_60px_rgba(56,189,248,0.22)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            {isLoading ? "Agent 正在跑图优化..." : "开始优化简历"}
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-sky-300/15 bg-[#06101f]/88 p-5 shadow-[0_24px_80px_rgba(14,165,233,0.12)] backdrop-blur-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#75c0f7]">
              LangGraph Output
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">优化结果</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              工作流：分析简历 → 规划改写策略 → 调用通义千问生成可复制版本。
            </p>
          </div>

          {result && (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/15"
              >
                {copied ? "已复制" : "复制结果"}
              </button>
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-bold text-sky-100 transition-colors hover:bg-sky-300/15"
              >
                下载 HTML
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="rounded-full bg-[#75c0f7] px-4 py-2 text-xs font-black text-[#03111f] transition-transform hover:-translate-y-0.5"
              >
                导出 PDF
              </button>
            </div>
          )}
        </div>

        {!result && !isLoading && (
          <div className="mt-8 rounded-3xl border border-dashed border-sky-300/20 bg-sky-300/[0.03] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-300/10 text-2xl">
              AI
            </div>
            <h3 className="mt-4 text-xl font-black text-white">等待 Agent 输出</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              你提交后，这里会展示匹配分、个人摘要、项目 bullet、关键词和行动计划。
            </p>
          </div>
        )}

        {isLoading && (
          <div className="mt-8 space-y-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        )}

        {result && (
          <div className="mt-7 space-y-5">
            <div className="rounded-3xl border border-sky-300/20 bg-sky-300/5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-400">匹配分</p>
                  <p className="mt-1 text-5xl font-black text-white">
                    {result.score}
                    <span className="text-xl text-slate-500">/100</span>
                  </p>
                </div>
                <div className="max-w-xl rounded-2xl bg-black/18 p-4 text-sm leading-7 text-slate-200">
                  {result.positioning}
                </div>
              </div>
            </div>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-base font-black text-white">优化后个人摘要</h3>
              <p className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-7 text-slate-200">
                {result.rewrittenSummary}
              </p>
            </section>

            {result.resumeHtml && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-black text-white">HTML 简历预览</h3>
                  <span className="rounded-full bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-100">
                    可打印 A4
                  </span>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white">
                  <iframe
                    title="优化后的 HTML 简历预览"
                    srcDoc={result.resumeHtml}
                    className="h-[720px] w-full bg-white"
                    sandbox=""
                  />
                </div>
              </section>
            )}

            <ListBlock title="核心问题" items={result.coreProblems} accent="amber" />
            <ListBlock title="可直接替换的项目 Bullet" items={result.optimizedBullets} />

            <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-5">
              <h3 className="text-base font-black text-white">关键词补强</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-cyan-200/20 bg-black/18 px-3 py-1.5 text-xs font-bold text-cyan-100"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </section>

            <ListBlock title="一周行动计划" items={result.actionPlan} accent="emerald" />
            <ListBlock title="面试可展开故事" items={result.interviewStories} accent="cyan" />
          </div>
        )}
      </section>
    </div>
  );
}
