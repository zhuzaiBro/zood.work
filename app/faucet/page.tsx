import Faucet from "@/components/Faucet";
import Web3Provider from "@/components/Web3Provider";

export default function FaucetPage() {
  return (
    <div className="-mt-20 min-h-screen overflow-hidden bg-[#02050b] pt-32 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.28),transparent_30%),radial-gradient(circle_at_78%_10%,rgba(14,165,233,0.20),transparent_28%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(4,14,28,0.98))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle,rgba(125,211,252,0.55)_1px,transparent_1px)] [background-size:22px_22px]" />

      <main className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[0.82fr_1fr] lg:items-center lg:px-8">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-bold text-sky-200 shadow-[0_0_30px_rgba(125,211,252,0.12)]">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Web3 Developer Faucet
          </div>

          <div>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              一键领取
              <span className="block bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                测试网 Gas
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              给社区同学做合约练习、钱包登录、DApp 调试用。连接钱包后选择测试网，平台 Relayer
              会帮你发起交易，不需要你自己先准备 Gas。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["3 条链", "Sepolia / Base / BSC"],
              ["免 Gas", "平台代付交易"],
              ["一键领", "少表单少打扰"],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="text-2xl font-black text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <Web3Provider>
          <Faucet />
        </Web3Provider>
      </main>
    </div>
  );
}
