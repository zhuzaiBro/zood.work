import { NextRequest, NextResponse } from 'next/server';
import { platformPublic } from '@/lib/platform/client';
import type { JobListing } from '@/lib/jobs/display';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (!message || message.length > 200) return NextResponse.json({ error: '请输入 1 到 200 字的岗位关键词。' }, { status: 400 });
  const limit = Math.min(10, Math.max(1, Number(payload.limit) || 5));
  const remote = /远程|\bremote\b/i.test(message);
  const keyword = message.replace(/远程|\bremote\b/gi, '').trim();
  const params = new URLSearchParams();
  if (remote) params.set('remote', '1');
  if (keyword) params.set('q', keyword);
  try {
    const result = await platformPublic<{ jobs: JobListing[]; count: number }>(`/api/platform/jobs?${params}`);
    const jobs = result.jobs.slice(0, limit).map(job => ({ id: job.id, title: job.title, company: job.company_name }));
    return NextResponse.json({
      intent: 'search_jobs', jobs,
      reply: jobs.length ? `找到 ${result.count} 个相关岗位。` : '没有找到匹配的岗位。可以试试更短的岗位名或公司名。',
    });
  } catch {
    return NextResponse.json({ error: '岗位暂时无法加载，请稍后重试。' }, { status: 502 });
  }
}
