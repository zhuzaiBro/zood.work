"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type AgentMessage = {
  role: "user" | "agent";
  content: string;
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
          content:
            data.reply ||
            data.error ||
            "岗位助手暂时没有拿到结果，可以稍后再试。",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "agent", content: "岗位助手连接失败，请确认后端服务已启动。" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="-mt-20 min-h-screen overflow-hidden bg-[#050b18] text-white">
      <section className="relative px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(117,192,247,0.25),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(44,213,196,0.18),transparent_28%),linear-gradient(135deg,#08152d_0%,#050b18_48%,#061827_100%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(117,192,247,0.28)_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-4 py-2 text-sm font-semibold text-[#75c0f7]">
              <span className="h-2 w-2 rounded-full bg-[#75c0f7] shadow-[0_0_18px_rgba(117,192,247,0.9)]" />
              Web3 / AI Job Agent
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              用 Agent 快速找到更适合你的岗位
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              后端通过 MCP 工具检索同步岗位，前端用对话方式承接。你可以输入技术栈、远程工作偏好、CEX项目或交易所方向，助手会返回更适合你的岗位线索。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {examples.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => submit(undefined, item)}
                  className="rounded-full border border-sky-300/20 bg-white/5 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-[#75c0f7]/70 hover:bg-[#75c0f7]/15"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/jobs"
                className="inline-flex w-fit text-sm font-semibold text-[#75c0f7] hover:text-sky-200"
              >
                返回岗位广场 →
              </Link>
              <Link
                href="/courses"
                className="inline-flex w-fit text-sm font-semibold text-slate-300 hover:text-sky-200"
              >
                去学习 Web3 / AI 课程 →
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-sky-200/15 bg-[#081225]/86 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#75c0f7]">岗位助手</p>
                <p className="text-xs text-slate-400">Agent → MCP → job_listings</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Online
              </span>
            </div>

            <div className="flex h-[520px] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[86%] whitespace-pre-wrap rounded-3xl px-5 py-4 text-sm leading-7 ${
                        message.role === "user"
                          ? "bg-[#75c0f7] text-[#041020]"
                          : "border border-white/10 bg-white/[0.06] text-slate-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="w-fit rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm text-slate-300">
                    正在调用岗位 Agent...
                  </div>
                )}
              </div>

              <form onSubmit={submit} className="flex gap-3 border-t border-white/10 p-4">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="输入岗位关键词，例如：Solidity 远程"
                  className="min-w-0 flex-1 rounded-2xl border border-sky-200/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#75c0f7]/70"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-2xl bg-[#75c0f7] px-5 py-3 text-sm font-bold text-[#041020] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  发送
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
