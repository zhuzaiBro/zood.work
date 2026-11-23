"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type AgentMessage = {
  role: "user" | "agent";
  content: string;
  jobs?: { id: string; title: string; company?: string }[];
};

const examples = ["前端 远程", "Solidity 合约", "AI Agent 全栈", "产品经理 Web3"];

export default function JobAgentClient() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      role: "agent",
      content:
        "我是岗位助手，可以帮你检索社区同步的 Web3 / AI 岗位。试试输入：前端 远程、Solidity、AI Agent。",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event?: FormEvent<HTMLFormElement>, value?: string) => {
    event?.preventDefault();
    const message = (value || input).trim();
    if (!message || isLoading) return;

    setInput("");
    setIsLoading(true);
    setMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const response = await fetch("/api/job-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, limit: 5 }),
      });
      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          jobs: data.jobs,
          content:
            data.reply ||
            data.error ||
            "岗位助手暂时没有拿到结果，可以稍后再试。",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "agent", content: "岗位助手暂时无法连接，请稍后再试。" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--site-header-height))] bg-[#f5f8fc] text-slate-900">
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.65fr_1.35fr] lg:px-8 lg:py-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">岗位助手</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">输入岗位、公司或远程偏好，查询岗位广场里的招聘信息。</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {examples.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => submit(undefined, item)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-blue-300 hover:text-blue-700"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/jobs"
                className="inline-flex w-fit text-sm font-semibold text-blue-700 hover:underline"
              >
                返回岗位广场 →
              </Link>
              <Link
                href="/courses"
                className="inline-flex w-fit text-sm font-semibold text-slate-600 hover:text-blue-700"
              >
                去学习 Web3 / AI 课程 →
              </Link>
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-1 sm:p-2">
            <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">对话记录</h2>
            <div className="flex h-[min(520px,70vh)] flex-col">
              <div aria-live="polite" className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[86%] whitespace-pre-wrap rounded-xl px-5 py-4 text-sm leading-7 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {message.content}
                      {message.jobs?.map(job => <Link key={job.id} href={`/jobs/${job.id}`} className="mt-2 block font-medium text-blue-700 hover:underline">{job.title}{job.company ? ` · ${job.company}` : ""}</Link>)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
                    正在查询岗位…
                  </div>
                )}
              </div>

              <form onSubmit={submit} className="flex gap-3 border-t border-slate-200 p-4">
                <input
                  aria-label="输入岗位关键词"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="输入岗位或公司，例如 Solidity 远程"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  发送
                </button>
              </form>
            </div>
          </div>
        </div>
    </div>
  );
}
