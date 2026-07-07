"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useAccount, useBalance, useReadContracts, useSwitchChain } from "wagmi";
import { FAUCET_ABI } from "@/lib/faucet/contract";
import {
  FAUCET_NETWORK_LIST,
  getFaucetNetwork,
  type FaucetNetworkId,
} from "@/lib/faucet/networks";
import Skeleton from "@/components/ui/Skeleton";

type Message = {
  type: "success" | "error";
  text: string;
};

function formatAmount(value?: bigint) {
  if (value === undefined) return "-";
  const formatted = Number(formatEther(value));
  if (!Number.isFinite(formatted)) return formatEther(value);
  return formatted.toLocaleString("zh-CN", {
    maximumFractionDigits: 4,
  });
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function MetricCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-sky-300/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-200/50">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-28 bg-sky-200/10" />
      ) : (
        <p className="mt-2 text-2xl font-black tracking-tight text-white">
          {value}
        </p>
      )}
    </div>
  );
}

export default function Faucet() {
  const { address, isConnected, chain } = useAccount();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [selectedNetworkId, setSelectedNetworkId] =
    useState<FaucetNetworkId>("sepolia");
  const [message, setMessage] = useState<Message | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const selectedNetwork =
    FAUCET_NETWORK_LIST.find((network) => network.id === selectedNetworkId) ??
    FAUCET_NETWORK_LIST[0];

  const contractAddress = selectedNetwork.address;
  const isNetworkDeployed = Boolean(contractAddress);

  const { data: nativeBalance } = useBalance({
    address,
    chainId: selectedNetwork.chainId,
    query: { enabled: Boolean(address && isNetworkDeployed) },
  });

  useEffect(() => {
    if (!chain?.id) return;
    const matched = getFaucetNetwork(chain.id);
    if (matched) {
      setSelectedNetworkId(matched.id);
    }
  }, [chain?.id]);

  const faucetReadContracts = contractAddress
    ? [
        {
          address: contractAddress,
          abi: FAUCET_ABI,
          functionName: "claimAmount",
          chainId: selectedNetwork.chainId,
        },
        {
          address: contractAddress,
          abi: FAUCET_ABI,
          functionName: "weeklyLimit",
          chainId: selectedNetwork.chainId,
        },
        {
          address: contractAddress,
          abi: FAUCET_ABI,
          functionName: "getContractBalance",
          chainId: selectedNetwork.chainId,
        },
        ...(address
          ? [
              {
                address: contractAddress,
                abi: FAUCET_ABI,
                functionName: "remainingWeeklyAllowance",
                args: [address],
                chainId: selectedNetwork.chainId,
              },
            ]
          : []),
      ]
    : [];

  const { data, isLoading, refetch } = useReadContracts({
    contracts: faucetReadContracts as any,
    query: {
      enabled: isNetworkDeployed,
      refetchInterval: 30_000,
    },
  });

  const claimAmount = data?.[0]?.result as bigint | undefined;
  const weeklyLimit = data?.[1]?.result as bigint | undefined;
  const contractBalance = data?.[2]?.result as bigint | undefined;
  const remaining = address ? (data?.[3]?.result as bigint | undefined) : undefined;

  const isWrongChain = isConnected && chain?.id !== selectedNetwork.chainId;
  const canClaim =
    isNetworkDeployed &&
    isConnected &&
    !isWrongChain &&
    remaining !== undefined &&
    remaining > BigInt(0) &&
    contractBalance !== undefined &&
    contractBalance > BigInt(0);

  const handleNetworkChange = async (networkId: FaucetNetworkId) => {
    setSelectedNetworkId(networkId);
    setMessage(null);
    setLastTxHash(null);

    const nextNetwork = FAUCET_NETWORK_LIST.find(
      (network) => network.id === networkId
    );
    if (!nextNetwork || !isConnected || chain?.id === nextNetwork.chainId) {
      return;
    }

    try {
      await switchChainAsync({ chainId: nextNetwork.chainId });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setMessage({
        type: "error",
        text: error.message || `请切换到 ${nextNetwork.name}`,
      });
    }
  };

  const handleClaim = async () => {
    if (!address) return;

    setIsClaiming(true);
    setMessage(null);
    setLastTxHash(null);

    try {
      const res = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          network: selectedNetworkId,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "领取失败");
      }

      await refetch();

      setLastTxHash(responseData.tx_hash);
      setMessage({
        type: "success",
        text: `${responseData.amount} ${selectedNetwork.symbol} 已发送到你的钱包。`,
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setMessage({ type: "error", text: error.message || "领取失败" });
    } finally {
      setIsClaiming(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!isConnected) return;
    if (isWrongChain) {
      await handleNetworkChange(selectedNetworkId);
      return;
    }
    await handleClaim();
  };

  const primaryLabel = !isNetworkDeployed
    ? "该网络暂未开放"
    : !isConnected
      ? "先连接钱包"
      : isSwitchingChain
        ? "切换网络中..."
        : isClaiming
          ? "领取中..."
          : isWrongChain
            ? `切换到 ${selectedNetwork.name}`
            : canClaim
              ? `领取 ${selectedNetwork.symbol} 测试币`
              : "暂不可领取";

  const primaryDisabled =
    !isNetworkDeployed ||
    !isConnected ||
    isClaiming ||
    isSwitchingChain ||
    (!isWrongChain && !canClaim);

  const explorerTxUrl =
    lastTxHash && !lastTxHash.startsWith("pending_")
      ? `${selectedNetwork.explorer}/tx/${lastTxHash}`
      : null;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-sky-300/15 bg-[#07101f]/80 p-5 text-slate-100 shadow-[0_30px_100px_rgba(14,165,233,0.16)] backdrop-blur-xl sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
              Gas 由平台代付
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              测试币水龙头
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              连接钱包，选择测试网，一键领取开发调试用测试币。每个地址每周最多领取{" "}
              <span className="font-semibold text-sky-100">
                {weeklyLimit !== undefined
                  ? `${formatAmount(weeklyLimit)} ${selectedNetwork.symbol}`
                  : "固定额度"}
              </span>
              。
            </p>
          </div>
          <div className="w-full xl:w-auto xl:shrink-0">
            <ConnectButton.Custom>
              {({
                account,
                chain: connectedChain,
                mounted,
                openAccountModal,
                openChainModal,
                openConnectModal,
              }) => {
                const ready = mounted;
                const connected = ready && account && connectedChain;

                if (!connected) {
                  return (
                    <button
                      type="button"
                      onClick={openConnectModal}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-300/10 px-4 py-3 text-sm font-black text-sky-100 shadow-[0_0_24px_rgba(117,192,247,0.14)] transition-all hover:border-sky-200/60 hover:bg-sky-300/15 xl:w-auto"
                    >
                      连接钱包
                    </button>
                  );
                }

                return (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
                    <button
                      type="button"
                      onClick={openChainModal}
                      className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
                        connectedChain.unsupported
                          ? "border-rose-300/40 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15"
                          : "border-sky-300/30 bg-sky-300/10 text-sky-100 hover:border-sky-200/60 hover:bg-sky-300/15"
                      }`}
                    >
                      {connectedChain.hasIcon && connectedChain.iconUrl && (
                        <img
                          src={connectedChain.iconUrl}
                          alt={connectedChain.name ?? "chain"}
                          className="h-5 w-5 rounded-full"
                        />
                      )}
                      <span className="truncate">
                        {connectedChain.unsupported
                          ? "网络不支持"
                          : connectedChain.name}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={openAccountModal}
                      className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-[0_14px_36px_rgba(2,8,23,0.22)] transition-all hover:-translate-y-0.5 hover:bg-sky-50 sm:max-w-[260px]"
                    >
                      {account.displayBalance && (
                        <span className="shrink-0 text-slate-700">
                          {account.displayBalance}
                        </span>
                      )}
                      <span className="truncate">{account.displayName}</span>
                    </button>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-200">选择网络</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {FAUCET_NETWORK_LIST.map((network) => {
              const isSelected = network.id === selectedNetworkId;
              return (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => void handleNetworkChange(network.id)}
                  disabled={isSwitchingChain || isClaiming}
                  className={`group rounded-2xl border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "border-sky-300/70 bg-sky-300/15 shadow-[0_0_34px_rgba(125,211,252,0.18)]"
                      : "border-white/10 bg-white/[0.03] hover:border-sky-300/40 hover:bg-sky-300/10"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span className="block text-sm font-bold text-white">
                    {network.name}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400 group-hover:text-sky-200">
                    {network.symbol} · Chain {network.chainId}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="单次发放"
            loading={isLoading}
            value={`${formatAmount(claimAmount)} ${selectedNetwork.symbol}`}
          />
          <MetricCard
            label="本周剩余"
            loading={isConnected && isLoading}
            value={
              isConnected
                ? `${formatAmount(remaining)} ${selectedNetwork.symbol}`
                : "连接后显示"
            }
          />
          <MetricCard
            label="水龙头余额"
            loading={isLoading}
            value={`${formatAmount(contractBalance)} ${selectedNetwork.symbol}`}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">领取地址</span>
              <span className="font-mono text-slate-100">
                {address ? shortAddress(address) : "未连接"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">钱包余额</span>
              <span className="font-mono text-slate-100">
                {address && nativeBalance !== undefined
                  ? `${formatAmount(nativeBalance.value)} ${selectedNetwork.symbol}`
                  : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">当前网络</span>
              <span
                className={
                  isWrongChain ? "text-amber-200" : "text-slate-100"
                }
              >
                {isConnected ? chain?.name || "未知网络" : selectedNetwork.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">合约</span>
              {contractAddress ? (
                <a
                  href={`${selectedNetwork.explorer}/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sky-200 transition-colors hover:text-white"
                >
                  {shortAddress(contractAddress)}
                </a>
              ) : (
                <span className="text-slate-500">未部署</span>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                : "border-rose-300/25 bg-rose-300/10 text-rose-100"
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{message.text}</span>
              {explorerTxUrl && (
                <a
                  href={explorerTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white underline decoration-sky-300/50 underline-offset-4"
                >
                  查看交易
                </a>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handlePrimaryAction()}
          disabled={primaryDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-300 to-blue-500 px-5 py-4 text-base font-black text-[#03111f] shadow-[0_18px_50px_rgba(56,189,248,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(56,189,248,0.34)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {primaryLabel}
        </button>

        <p className="text-center text-xs leading-5 text-slate-500">
          适合合约调试、钱包登录、链上交互练习。测试币没有真实价值，请按需领取。
        </p>
      </div>
    </section>
  );
}
