'use client'

import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatEther } from 'viem'
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { FAUCET_ABI, FAUCET_ADDRESS, SEPOLIA_CHAIN_ID } from '@/lib/faucet/contract'

function formatEth(value?: bigint) {
  if (value === undefined) return '-'
  return formatEther(value)
}

export default function Faucet() {
  const { address, isConnected, chain } = useAccount()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'claimAmount',
      },
      {
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'weeklyLimit',
      },
      {
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'getContractBalance',
      },
      ...(address
        ? [
            {
              address: FAUCET_ADDRESS,
              abi: FAUCET_ABI,
              functionName: 'remainingWeeklyAllowance' as const,
              args: [address] as const,
            },
          ]
        : []),
    ],
    query: {
      refetchInterval: 30_000,
    },
  })

  const claimAmount = data?.[0]?.result
  const weeklyLimit = data?.[1]?.result
  const contractBalance = data?.[2]?.result
  const remaining = address ? data?.[3]?.result : undefined

  const {
    writeContract,
    data: txHash,
    isPending: isSubmitting,
    error: submitError,
    reset: resetWrite,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const isWrongChain = isConnected && chain?.id !== SEPOLIA_CHAIN_ID
  const canClaim =
    isConnected &&
    !isWrongChain &&
    remaining !== undefined &&
    remaining > 0n &&
    contractBalance !== undefined &&
    contractBalance > 0n

  const handleClaim = () => {
    setMessage(null)
    resetWrite()

    writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: 'claim',
    })
  }

  useEffect(() => {
    if (!txHash || !isSuccess) return

    void refetch()
    setMessage({
      type: 'success',
      text: `领取成功！交易哈希: ${txHash}，已领取 ${formatEth(claimAmount)} Sepolia ETH`,
    })
  }, [txHash, isSuccess, refetch, claimAmount])

  useEffect(() => {
    if (!submitError) return

    let text = submitError.message || '领取失败'
    if (text.includes('User rejected') || text.includes('User denied')) {
      text = '已取消交易'
    } else if (text.includes('WeeklyLimitExceeded')) {
      text = '本周领取额度已用完，请 7 天后再试'
    } else if (text.includes('InsufficientBalance')) {
      text = '水龙头余额不足，请稍后再试'
    }

    setMessage({ type: 'error', text })
  }, [submitError])

  const isClaiming = isSubmitting || isConfirming

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Sepolia 测试币水龙头</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            连接钱包后直接调用链上合约领取。每个地址每 7 天最多领取{' '}
            {weeklyLimit !== undefined ? formatEth(weeklyLimit) : '0.1'} ETH。
          </p>
        </div>
        <ConnectButton />
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4 text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">合约地址</span>
            <a
              href={`https://sepolia.etherscan.io/address/${FAUCET_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-right"
            >
              {FAUCET_ADDRESS.slice(0, 6)}…{FAUCET_ADDRESS.slice(-4)}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">网络</span>
            <span className="text-gray-900 dark:text-gray-100">Sepolia ({SEPOLIA_CHAIN_ID})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">单次领取</span>
            <span className="text-gray-900 dark:text-gray-100">
              {isLoading ? '加载中…' : `${formatEth(claimAmount)} ETH`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">本周剩余额度</span>
            <span className="text-gray-900 dark:text-gray-100">
              {isConnected ? `${formatEth(remaining)} ETH` : '连接钱包后显示'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">水龙头余额</span>
            <span className="text-gray-900 dark:text-gray-100">
              {isLoading ? '加载中…' : `${formatEth(contractBalance)} ETH`}
            </span>
          </div>
          {address && (
            <div className="flex justify-between gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">已连接钱包</span>
              <span className="text-gray-900 dark:text-gray-100 break-all text-right">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {isWrongChain && (
          <div className="p-3 rounded-lg text-sm bg-amber-50 text-amber-700 border border-amber-200">
            当前网络不正确，请点击右上角连接按钮切换到 Sepolia 测试网。
          </div>
        )}

        {message && (
          <div
            className={`p-3 rounded-lg text-sm break-all ${
              message.type === 'success'
                ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {txHash && isConfirming && (
          <div className="p-3 rounded-lg text-sm bg-blue-50 text-blue-600 border border-blue-200 break-all">
            交易已提交，等待确认… {txHash}
          </div>
        )}

        <button
          type="button"
          onClick={handleClaim}
          disabled={!canClaim || isClaiming}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {!isConnected
            ? '请先连接钱包'
            : isClaiming
              ? '领取中…'
              : canClaim
                ? '领取测试 ETH'
                : '暂不可领取'}
        </button>
      </div>
    </div>
  )
}
