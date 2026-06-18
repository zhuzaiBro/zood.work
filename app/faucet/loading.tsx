import Skeleton from "@/components/ui/Skeleton";
import Spinner from "@/components/ui/Spinner";

export default function FaucetLoading() {
  return (
    <div className="-mt-20 min-h-screen overflow-hidden bg-[#02050b] pt-32 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.28),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(4,14,28,0.98))]" />
      <main className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[0.82fr_1fr] lg:items-center lg:px-8">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-bold text-sky-200">
            <Spinner size="sm" />
            Web3 Developer Faucet
          </div>
          <div className="space-y-4">
            <Skeleton className="h-16 w-4/5 bg-sky-200/10" />
            <Skeleton className="h-16 w-3/5 bg-sky-200/10" />
            <Skeleton className="h-24 w-full max-w-xl bg-sky-200/10" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-sky-300/15 bg-[#07101f]/80 p-7 shadow-[0_30px_100px_rgba(14,165,233,0.16)]">
          <div className="space-y-5">
            <Skeleton className="h-9 w-44 bg-sky-200/10" />
            <Skeleton className="h-20 w-full rounded-2xl bg-sky-200/10" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-28 rounded-2xl bg-sky-200/10"
                />
              ))}
            </div>
            <Skeleton className="h-14 w-full rounded-2xl bg-sky-200/10" />
          </div>
        </section>
      </main>
    </div>
  );
}
