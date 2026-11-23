'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type QuestionType = '单项选择题' | '多项选择题' | '判断题' | '实操题'

type Question = {
  id: number
  type: QuestionType
  stem: string
  options: string[]
  answer: number[]
  points: number
  knowledge: string
  explanation: string
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    type: '单项选择题',
    stem: '永续合约相比交割合约，最核心的产品差异是什么？',
    options: ['不需要保证金', '没有固定到期交割日', '只能做多不能做空', '成交不需要撮合引擎'],
    answer: [1],
    points: 8,
    knowledge: '合约基础',
    explanation:
      '永续合约没有固定到期日，因此需要资金费率、标记价格、风控阶梯等机制，帮助价格长期锚定现货指数并控制风险。',
  },
  {
    id: 2,
    type: '单项选择题',
    stem: '强平价格计算中，通常优先使用 Mark Price 的主要原因是什么？',
    options: ['手续费更低', '更能降低插针和操纵导致的误强平', '可以让爆仓永远不会发生', '可以替代指数价格'],
    answer: [1],
    points: 8,
    knowledge: '标记价格',
    explanation:
      '最新成交价容易被瞬时成交、薄盘口或异常插针影响。Mark Price 更适合做保证金率、未实现盈亏和强平判断的风险基准。',
  },
  {
    id: 3,
    type: '单项选择题',
    stem: '当账户保证金率接近维持保证金率时，系统最应该先做什么？',
    options: ['直接触发 ADL', '取消全部盈利用户订单', '限制新增风险并撤销增加风险的挂单', '提高全市场资金费率'],
    answer: [2],
    points: 8,
    knowledge: '强平流程',
    explanation:
      '稳健流程会先阻止风险继续扩大，撤销会增加仓位风险的挂单，并重新计算账户风险，再进入分批清算或保险基金流程。',
  },
  {
    id: 4,
    type: '多项选择题',
    stem: '资金费率机制通常需要哪些输入或约束？',
    options: ['永续合约价格与指数价格的偏离', '资金费率上限和下限', '支付周期', '用户昵称长度'],
    answer: [0, 1, 2],
    points: 12,
    knowledge: '资金费率',
    explanation:
      '资金费率关注合约价格相对指数价格的溢价/折价，并受周期、上下限、利率项等约束影响，和用户资料字段无关。',
  },
  {
    id: 5,
    type: '多项选择题',
    stem: '设计 Reduce Only 订单时，哪些场景需要纳入校验？',
    options: ['当前仓位数量', '已有未成交减仓挂单', '成交回报与撤单回报的并发顺序', '用户头像是否为空'],
    answer: [0, 1, 2],
    points: 12,
    knowledge: '订单风控',
    explanation:
      'Reduce Only 的关键是不能扩大风险。系统需要把仓位、未成交减仓订单、成交/撤单事件顺序都纳入可减数量计算。',
  },
  {
    id: 6,
    type: '判断题',
    stem: '同一个交易对的订单簿使用单线程串行处理，常见目标是保证价格优先、时间优先的确定性。',
    options: ['正确', '错误'],
    answer: [0],
    points: 10,
    knowledge: '撮合引擎',
    explanation:
      '正确。同一本订单簿的核心是确定性和可重放。扩展通常通过交易对分片、异步行情、异步清算等方式实现。',
  },
  {
    id: 7,
    type: '判断题',
    stem: '保险基金的作用是吸收穿仓亏损，所以它越大，平台就完全不需要 ADL 机制。',
    options: ['正确', '错误'],
    answer: [1],
    points: 10,
    knowledge: '保险基金',
    explanation:
      '错误。保险基金可以吸收部分穿仓损失，但极端行情下仍可能不足，因此很多平台会保留 ADL 作为最后风险转移机制。',
  },
  {
    id: 8,
    type: '实操题',
    stem: '请写出一个“用户下单 -> 撮合成交 -> 更新仓位 -> 风控校验”的核心链路，并标出至少两个可能产生并发风险的位置。',
    options: ['我已完成链路梳理，并上传/提交答案'],
    answer: [0],
    points: 32,
    knowledge: '系统设计',
    explanation:
      '参考答案应覆盖订单冻结、撮合成交、成交回报、仓位更新、保证金重算、强平检查，并指出 Reduce Only 并发、撤单/成交乱序、行情与风险快照不一致等风险点。',
  },
]

const optionLabels = ['A', 'B', 'C', 'D']
const TOTAL_SECONDS = 30 * 60

function isSameAnswer(a: number[] | undefined, b: number[]) {
  if (!a || a.length !== b.length) return false
  const left = [...a].sort((x, y) => x - y)
  const right = [...b].sort((x, y) => x - y)
  return left.every((value, index) => value === right[index])
}

function formatTime(seconds: number) {
  const minute = Math.floor(seconds / 60)
  const second = seconds % 60
  return `00:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-5 w-1 rounded-full bg-[#75c0f7]" />
      <h2 className="text-lg font-black text-slate-950">{children}</h2>
    </div>
  )
}

export default function LearningTestPage() {
  const [answers, setAnswers] = useState<Record<number, number[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [remaining, setRemaining] = useState(TOTAL_SECONDS)
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    if (submitted) return
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [submitted])

  const groupedQuestions = useMemo(() => {
    return QUESTIONS.reduce<Record<QuestionType, Question[]>>(
      (acc, question) => {
        acc[question.type].push(question)
        return acc
      },
      {
        单项选择题: [],
        多项选择题: [],
        判断题: [],
        实操题: [],
      },
    )
  }, [])

  const stats = useMemo(() => {
    const answered = QUESTIONS.filter((question) => answers[question.id]?.length).length
    const correct = QUESTIONS.filter((question) => isSameAnswer(answers[question.id], question.answer))
    const score = correct.reduce((sum, question) => sum + question.points, 0)
    const total = QUESTIONS.reduce((sum, question) => sum + question.points, 0)
    return { answered, correct: correct.length, score, total }
  }, [answers])

  const progress = Math.round((stats.answered / QUESTIONS.length) * 100)

  const toggleAnswer = (question: Question, optionIndex: number) => {
    if (submitted) return
    setAnswers((prev) => {
      const current = prev[question.id] ?? []
      if (question.type === '多项选择题') {
        const next = current.includes(optionIndex)
          ? current.filter((item) => item !== optionIndex)
          : [...current, optionIndex]
        return { ...prev, [question.id]: next }
      }
      return { ...prev, [question.id]: [optionIndex] }
    })
  }

  const scrollToQuestion = (questionId: number) => {
    questionRefs.current[questionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const resetTest = () => {
    setAnswers({})
    setSubmitted(false)
    setRemaining(TOTAL_SECONDS)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="-mt-20 min-h-screen bg-[#02050b] text-white">
      <section className="relative overflow-hidden border-b border-[#75c0f7]/15 bg-[radial-gradient(circle_at_20%_8%,rgba(117,192,247,0.26),transparent_30%),radial-gradient(circle_at_82%_2%,rgba(44,213,196,0.16),transparent_28%),linear-gradient(135deg,#08152d_0%,#050b18_48%,#061827_100%)] px-4 pb-10 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/interview"
              className="mb-6 inline-flex h-10 items-center rounded-full border border-[#75c0f7]/20 bg-white/[0.03] px-4 text-sm font-semibold text-[#9fb2d1] transition hover:border-[#75c0f7]/50 hover:bg-[#75c0f7]/10 hover:text-[#f5f8ff]"
            >
              返回题库
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black tracking-normal text-[#f5f8ff] sm:text-3xl">永续合约学习测试</h1>
              <span className="rounded-full border border-[#75c0f7]/45 bg-[#75c0f7]/10 px-3 py-1 text-xs font-bold text-[#82dfff]">
                专修考试
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9fb2d1]">
              试卷说明：本试卷共 4 类答题，8 个小题，满分 {stats.total} 分，考试时间 30 分钟。建议先独立完成，再查看解析。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[#75c0f7]/20 bg-[#07101f]/82 p-3 shadow-[0_18px_45px_rgba(14,165,233,0.12)] backdrop-blur">
            {[
              { label: '已完成', value: `${stats.answered}/${QUESTIONS.length}` },
              { label: '正确数', value: submitted ? stats.correct : '-' },
              { label: '得分', value: submitted ? stats.score : '-' },
            ].map((item) => (
              <div key={item.label} className="min-w-24 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs font-semibold text-[#8093b2]">{item.label}</p>
                <p className="mt-1 text-xl font-black text-[#f5f8ff]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <div className="rounded-[28px] border border-[#75c0f7]/10 bg-[#f8fbff] px-5 py-7 text-slate-950 shadow-[0_26px_80px_rgba(0,0,0,0.28)] sm:px-8 lg:px-12">
          {(['单项选择题', '多项选择题', '判断题', '实操题'] as QuestionType[]).map((type) => (
            <section key={type} className="border-b border-slate-200/80 py-8 first:pt-0 last:border-b-0 last:pb-0">
              <SectionTitle>{type}</SectionTitle>
              <div className="space-y-10">
                {groupedQuestions[type].map((question, localIndex) => {
                  const selected = answers[question.id] ?? []
                  const isCorrect = isSameAnswer(selected, question.answer)

                  return (
                    <div
                      key={question.id}
                      ref={(node) => {
                        questionRefs.current[question.id] = node
                      }}
                      className="scroll-mt-28"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-bold leading-8 text-slate-950">
                            {localIndex + 1}、{question.stem}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {question.knowledge} · {question.points} 分
                          </p>
                        </div>
                        {submitted && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isCorrect ? '回答正确' : '需要复盘'}
                          </span>
                        )}
                      </div>

                      {question.type === '实操题' ? (
                        <button
                          type="button"
                          onClick={() => toggleAnswer(question, 0)}
                          className={`mt-5 flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition ${
                            selected.length
                              ? 'border-[#75c0f7] bg-[#e8f7ff] text-[#0f6e9d]'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-[#75c0f7] hover:bg-[#f0fbff]'
                          }`}
                        >
                          <span className="text-sm font-black">
                            {selected.length ? '已标记完成' : '点击标记实操答案已完成'}
                          </span>
                          <span className="mt-2 text-xs leading-6">
                            支持后续扩展为 .doc .docx .pdf .zip 文件上传，这里先保留考试页交互状态。
                          </span>
                        </button>
                      ) : (
                        <div className="mt-5 space-y-3">
                          {question.options.map((option, optionIndex) => {
                            const active = selected.includes(optionIndex)
                            const correct = question.answer.includes(optionIndex)
                            const showRight = submitted && correct
                            const showWrong = submitted && active && !correct

                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => toggleAnswer(question, optionIndex)}
                                className={`flex w-full items-start gap-4 rounded-xl border px-4 py-4 text-left transition ${
                                  showRight
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                                    : showWrong
                                      ? 'border-rose-300 bg-rose-50 text-rose-950'
                                      : active
                                        ? 'border-[#75c0f7] bg-[#e8f7ff] text-slate-950'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#75c0f7] hover:bg-[#f0fbff]'
                                }`}
                              >
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                                    showRight
                                      ? 'bg-emerald-500 text-white'
                                      : showWrong
                                        ? 'bg-rose-500 text-white'
                                        : active
                                          ? 'bg-[#0ea5e9] text-white'
                                          : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {optionLabels[optionIndex]}
                                </span>
                                <span className="pt-0.5 text-sm font-semibold leading-6 sm:text-base">{option}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {submitted && (
                        <div className="mt-5 rounded-2xl border border-[#75c0f7]/25 bg-[#effaff] px-5 py-4">
                          <p className="text-sm font-black text-[#0369a1]">
                            参考答案：{question.answer.map((item) => optionLabels[item]).join('、')}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetTest}
              className="h-12 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-500 transition hover:border-[#75c0f7] hover:text-[#0369a1]"
            >
              重新作答
            </button>
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={stats.answered === 0}
              className="h-12 rounded-full bg-[#75c0f7] px-8 text-sm font-black text-[#03111f] shadow-[0_12px_28px_rgba(14,165,233,0.26)] transition hover:bg-[#93ddff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              提交试卷
            </button>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-[#75c0f7]/20 bg-[#07101f]/90 p-5 shadow-[0_18px_45px_rgba(14,165,233,0.12)] backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="h-5 w-1 rounded-full bg-[#75c0f7]" />
              <h2 className="text-lg font-black text-[#f5f8ff]">答题卡</h2>
              <span className="ml-auto h-3 w-3 rounded-sm bg-[#75c0f7]" />
              <span className="text-xs text-[#9fb2d1]">已做</span>
            </div>

            <div className="mt-6 space-y-5">
              {(['单项选择题', '多项选择题', '判断题', '实操题'] as QuestionType[]).map((type) => (
                <div key={type}>
                  <p className="text-sm font-bold text-[#f5f8ff]">【{type}】</p>
                  <div className="mt-3 grid grid-cols-6 gap-2">
                    {groupedQuestions[type].map((question, index) => {
                      const done = Boolean(answers[question.id]?.length)
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => scrollToQuestion(question.id)}
                          className={`h-7 rounded text-xs font-bold transition ${
                            done
                              ? 'bg-[#75c0f7] text-[#03111f]'
                              : 'border border-[#2a4160] text-[#9fb2d1] hover:border-[#75c0f7] hover:text-[#82dfff]'
                          }`}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#75c0f7]/20 bg-[#07101f]/90 p-5 shadow-[0_18px_45px_rgba(14,165,233,0.12)] backdrop-blur">
            <p className="text-sm font-bold text-[#9fb2d1]">考试倒计时</p>
            <p className="mt-2 font-mono text-3xl font-black text-[#82dfff]">{formatTime(remaining)}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#75c0f7]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 flex justify-between text-sm font-bold text-[#9fb2d1]">
              <span>已完成 {stats.answered} 题</span>
              <span>共 {QUESTIONS.length} 题</span>
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}
