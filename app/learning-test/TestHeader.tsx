import Link from 'next/link'

export default function TestHeader({ total, progress = '…', correct = '–', score = '–' }: {
  total?: number
  progress?: string
  correct?: number | string
  score?: number | string
}) {
  return (
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
            试卷说明：本试卷共 4 类答题，8 个小题，满分 {total ?? '…'} 分，考试时间 30 分钟。建议先独立完成，再查看解析。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[#75c0f7]/20 bg-[#07101f]/82 p-3 shadow-[0_18px_45px_rgba(14,165,233,0.12)] backdrop-blur">
          {[
            { label: '已完成', value: progress },
            { label: '正确数', value: correct },
            { label: '得分', value: score },
          ].map((item) => (
            <div key={item.label} className="min-w-24 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-semibold text-[#8093b2]">{item.label}</p>
              <p className="mt-1 text-xl font-black text-[#f5f8ff]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
