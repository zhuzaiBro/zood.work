import JobAgentClient from "@/components/jobs/JobAgentClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "岗位 Agent - 远程工作与 Web3 / AI 岗位检索",
  description:
    "油条TV 岗位 Agent 帮你对话检索 Web3、AI、CEX项目、交易所和远程工作机会，配合远程攻略做求职准备。",
  keywords: ["远程工作", "远程攻略", "agent学习路线", "web3学习", "cex项目", "交易所攻略", "岗位 Agent"],
  alternates: {
    canonical: "/jobs/agent",
  },
};

export default function JobAgentPage() {
  return <JobAgentClient />;
}
