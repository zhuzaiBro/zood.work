import ResumeOptimizerClient from "@/components/resume/ResumeOptimizerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "简历优化 Agent - Web3 / AI 远程工作求职助手",
  description:
    "基于 LangChain.js、LangGraph.js 与通义千问的简历优化 Agent，帮助 Web3、AI、CEX项目和远程工作求职者优化简历表达。",
  keywords: ["agent学习路线", "远程工作", "远程攻略", "web3学习", "cex项目", "简历优化 Agent", "油条TV"],
  alternates: {
    canonical: "/resume-agent",
  },
};

export default function ResumeAgentPage() {
  return (
    <div className="-mt-20 min-h-screen overflow-hidden bg-[#02050b] pt-32 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.28),transparent_30%),radial-gradient(circle_at_80%_12%,rgba(117,192,247,0.22),transparent_28%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(4,14,28,0.98))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(circle,rgba(117,192,247,0.55)_1px,transparent_1px)] [background-size:22px_22px]" />

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="mb-10 max-w-4xl">
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-6xl">
            AI 简历优化
            <span className="block bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
              Agent 工作台
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            面向 Web3、AI 应用开发、CEX 项目、交易所业务和远程工作求职者。把简历和目标岗位交给 Agent，
            它会拆解匹配度、规划改写策略，并产出能直接复制的摘要、项目 bullet 和关键词清单。
          </p>
        </section>

        <ResumeOptimizerClient />
      </main>
    </div>
  );
}
