import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi';

export type ResumeExperienceLevel = 'student' | 'junior' | 'mid' | 'senior';

export type ResumeOptimizerInput = {
  resumeText: string;
  targetRole: string;
  jobDescription?: string;
  experienceLevel: ResumeExperienceLevel;
  language?: 'zh' | 'en';
};

export type ResumeOptimizationResult = {
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

type AnalysisResult = {
  strengths: string[];
  gaps: string[];
  riskSignals: string[];
  positioning: string;
};

type StrategyResult = {
  targetNarrative: string;
  rewriteRules: string[];
  keywordPlan: string[];
};

const ResumeAgentState = Annotation.Root({
  input: Annotation<ResumeOptimizerInput>,
  analysis: Annotation<AnalysisResult | undefined>,
  strategy: Annotation<StrategyResult | undefined>,
  result: Annotation<ResumeOptimizationResult | undefined>,
});

function createModel() {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY;

  if (!apiKey) {
    throw new Error('缺少 DASHSCOPE_API_KEY，请先在 .env 中配置通义千问 DashScope Key');
  }

  return new ChatAlibabaTongyi({
    alibabaApiKey: apiKey,
    model: process.env.QWEN_MODEL || 'qwen-plus',
    temperature: 0.35,
    region: 'china',
  });
}

function extractJsonObject<T>(content: unknown): T {
  const text = Array.isArray(content)
    ? content
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'text' in item) {
            return String((item as { text?: unknown }).text ?? '');
          }
          return '';
        })
        .join('\n')
    : String(content ?? '');

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI 返回格式异常，未找到 JSON 内容');
  }

  return JSON.parse(raw.slice(start, end + 1)) as T;
}

function compactInput(input: ResumeOptimizerInput) {
  return {
    ...input,
    resumeText: input.resumeText.slice(0, 12000),
    jobDescription: input.jobDescription?.slice(0, 6000),
    language: input.language ?? 'zh',
  };
}

function sanitizeResumeHtml(html?: string) {
  const source = html?.trim() || '';
  const withoutScripts = source
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  if (!withoutScripts) return '';

  if (/<!doctype html/i.test(withoutScripts) || /<html[\s>]/i.test(withoutScripts)) {
    return withoutScripts;
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>优化后的简历</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f4f7fb;
      color: #142033;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      line-height: 1.65;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 18mm 20mm;
      background: #fff;
    }
    h1 { margin: 0 0 8px; font-size: 30px; color: #0f172a; }
    h2 { margin: 24px 0 10px; font-size: 16px; border-bottom: 2px solid #75c0f7; padding-bottom: 6px; }
    p { margin: 6px 0; }
    ul { margin: 8px 0 0; padding-left: 18px; }
    li { margin: 5px 0; }
    .meta { color: #526173; font-size: 13px; }
    .tag { display: inline-block; margin: 4px 6px 0 0; padding: 3px 8px; border-radius: 999px; background: #e8f5ff; color: #166aa0; font-size: 12px; }
    @media print {
      body { background: #fff; }
      .page { width: auto; min-height: auto; margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    ${withoutScripts}
  </main>
</body>
</html>`;
}

async function analyzeResume(state: typeof ResumeAgentState.State) {
  const model = createModel();
  const input = compactInput(state.input);

  const response = await model.invoke([
    {
      role: 'system',
      content:
        '你是资深技术招聘顾问，擅长 Web3、AI 应用、前后端和全栈工程简历筛选。只输出严格 JSON，不要输出 Markdown。',
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: '分析候选人简历与目标岗位的匹配度',
        output_schema: {
          strengths: ['优势，3-5条'],
          gaps: ['缺口，3-5条'],
          riskSignals: ['招聘方可能担心的风险，2-4条'],
          positioning: '一句话候选人定位',
        },
        input,
      }),
    },
  ]);

  return {
    analysis: extractJsonObject<AnalysisResult>(response.content),
  };
}

async function planRewrite(state: typeof ResumeAgentState.State) {
  const model = createModel();
  const input = compactInput(state.input);

  const response = await model.invoke([
    {
      role: 'system',
      content:
        '你是技术简历优化 Agent 的策略规划节点。你会基于分析结果制定改写策略。只输出严格 JSON。',
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: '制定简历优化策略',
        analysis: state.analysis,
        output_schema: {
          targetNarrative: '简历主叙事',
          rewriteRules: ['改写规则，4-6条'],
          keywordPlan: ['需要加强的关键词，8-14个'],
        },
        input,
      }),
    },
  ]);

  return {
    strategy: extractJsonObject<StrategyResult>(response.content),
  };
}

async function generateResult(state: typeof ResumeAgentState.State) {
  const model = createModel();
  const input = compactInput(state.input);

  const response = await model.invoke([
    {
      role: 'system',
      content:
        '你是简历优化 Agent 的最终输出节点。请给出可直接复制到简历里的改写内容，语言自然、具体、有技术含量。只输出严格 JSON。',
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: '输出最终简历优化结果',
        analysis: state.analysis,
        strategy: state.strategy,
        output_schema: {
          score: '0-100 的匹配分',
          positioning: '一句话定位',
          coreProblems: ['核心问题，3-5条'],
          rewrittenSummary: '优化后的简历个人摘要，120-180字',
          optimizedBullets: [
            '项目/经历 bullet，5-8条，尽量包含动作、技术、业务结果、量化影响',
          ],
          keywords: ['建议补充关键词，8-16个'],
          actionPlan: ['接下来一周修改动作，4-6条'],
          interviewStories: ['可用于面试展开的STAR故事，3条'],
          resumeHtml:
            '完整可打印 HTML 简历。必须是中文、A4 友好、结构清晰，包含内联 CSS，不要包含 script，不要用外部资源。',
        },
        input,
      }),
    },
  ]);

  const result = extractJsonObject<ResumeOptimizationResult>(response.content);

  return {
    result: {
      score: Math.max(0, Math.min(100, Number(result.score) || 0)),
      positioning: result.positioning,
      coreProblems: result.coreProblems ?? [],
      rewrittenSummary: result.rewrittenSummary,
      optimizedBullets: result.optimizedBullets ?? [],
      keywords: result.keywords ?? [],
      actionPlan: result.actionPlan ?? [],
      interviewStories: result.interviewStories ?? [],
      resumeHtml: sanitizeResumeHtml(result.resumeHtml),
    },
  };
}

const resumeOptimizerGraph = new StateGraph(ResumeAgentState)
  .addNode('analyzeResume', analyzeResume)
  .addNode('planRewrite', planRewrite)
  .addNode('generateResult', generateResult)
  .addEdge(START, 'analyzeResume')
  .addEdge('analyzeResume', 'planRewrite')
  .addEdge('planRewrite', 'generateResult')
  .addEdge('generateResult', END)
  .compile();

export async function runResumeOptimizationAgent(input: ResumeOptimizerInput) {
  const response = await resumeOptimizerGraph.invoke({ input });

  if (!response.result) {
    throw new Error('Agent 未生成结果，请稍后重试');
  }

  return response.result;
}
