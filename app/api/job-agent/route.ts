import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const endpoint =
    process.env.JOB_SYNC_AGENT_URL ||
    `${process.env.JOB_SYNC_BASE_URL || "http://localhost:8080"}/agent/jobs`;
  const token = process.env.JOB_SYNC_AGENT_TOKEN || process.env.AGENT_AUTH_TOKEN;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await response.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || "岗位助手返回了非 JSON 响应" };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Job agent proxy error:", error);
    return NextResponse.json(
      { error: "岗位助手暂时不可用，请确认 job-sync worker 已启动" },
      { status: 502 }
    );
  }
}
