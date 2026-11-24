import ResumeOptimizerClient from "@/components/resume/ResumeOptimizerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "简历优化 Agent - Web3 / AI 远程工作求职助手",
  description:
    "粘贴或上传简历，试排三种投递版式。根据目标岗位优化经历后，可导出 HTML 或打印为 PDF。",
  keywords: ["agent学习路线", "远程工作", "远程攻略", "web3学习", "cex项目", "简历优化 Agent", "油条TV"],
  alternates: {
    canonical: "/resume-agent",
  },
};

export default function ResumeAgentPage() {
  return (
    <div className="min-h-[calc(100vh-var(--site-header-height))] bg-[#f5f8fc] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <h1 className="sr-only">简历优化</h1>
        <ResumeOptimizerClient />
      </div>
    </div>
  )
}
