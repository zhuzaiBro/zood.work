import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runResumeOptimizationAgent } from '@/lib/agents/resumeOptimizationAgent';

export const runtime = 'nodejs';

const resumeOptimizerSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(80, '简历内容太短，至少需要 80 个字符')
    .max(20000, '简历内容太长，请先精简到 20000 字符以内'),
  targetRole: z
    .string()
    .trim()
    .min(2, '请填写目标岗位')
    .max(120, '目标岗位太长'),
  jobDescription: z.string().trim().max(10000, 'JD 太长，请先精简').optional(),
  experienceLevel: z.enum(['student', 'junior', 'mid', 'senior']).default('mid'),
  language: z.enum(['zh', 'en']).default('zh'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resumeOptimizerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || '参数错误',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const result = await runResumeOptimizationAgent(parsed.data);

    return NextResponse.json({
      result,
      meta: {
        framework: 'LangChain.js + LangGraph.js + 通义千问',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '简历优化失败';
    const status = message.includes('DASHSCOPE_API_KEY') ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
