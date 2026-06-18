'use client'

import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider, Contract, formatEther, JsonRpcProvider } from 'ethers'
import {
  FAUCET_ABI,
  FAUCET_ADDRESS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_ID_HEX,
  SEPOLIA_NETWORK,
} from '@/lib/faucet/contract'

type FaucetInfo = {
  claimAmount: string
  weeklyLimit: string
  remaining: string
  contractBalance: string
}

export default function Faucet() {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [info, setInfo] = useState<FaucetInfo | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const getReadProvider = () => {
    if (typeof window.ethereum !== 'undefined') {
      return new BrowserProvider(window.ethereum)
    }
    return new JsonRpcProvider(SEPOLIA_NETWORK.rpcUrls[0])
  }

  const getProvider = () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('未检测到以太坊钱包，请安装 MetaMask 等钱包后重试')
    }
    return new BrowserProvider(window.ethereum)
  }

  const ensureSepolia = async () => {
    if (typeof window.ethereum === 'undefined') return

    const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string
    if (chainId.toLowerCase() === SEPOLIA_CHAIN_ID_HEX.toLowerCase()) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      })
    } catch (err: unknown) {
      const error = err as { code?: number }
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_NETWORK],
        })
        return
      }
      throw new Error('请切换到 Sepolia 测试网')
    }
  }

  const loadFaucetInfo = useCallback(async (userAddress: string | null) => {
    const provider = getReadProvider()
    const contract = new Contract(FAUCET_ADDRESS, FAUCET_ABI, provider)

    const [claimAmount, weeklyLimit, contractBalance, remaining] = await Promise.all([
      contract.claimAmount() as Promise<bigint>,
      contract.weeklyLimit() as Promise<bigint>,
      contract.getContractBalance() as Promise<bigint>,
      userAddress
        ? (contract.remainingWeeklyAllowance(userAddress) as Promise<bigint>)
        : Promise.resolve(null),
    ])

    setInfo({
      claimAmount: formatEther(claimAmount),
      weeklyLimit: formatEther(weeklyLimit),
      contractBalance: formatEther(contractBalance),
      remaining: remaining !== null ? formatEther(remaining) : '-',
    })
  }, [])

  const connectWallet = async (): Promise<string | null> => {
    setIsConnecting(true)
    setMessage(null)

    try {
      await ensureSepolia()
      const provider = getProvider()
      const accounts = (await provider.send('eth_requestAccounts', [])) as string[]
      const connected = accounts[0]
      setAddress(connected)
      await loadFaucetInfo(connected)
      return connected
    } catch (err: unknown) {
      const error = err as { message?: string }
      setMessage({ type: 'error', text: error.message || '连接钱包失败' })
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const handleClaim = async () => {
    setIsClaiming(true)
    setMessage(null)

    try {
      const claimAddress = address ?? (await connectWallet())
      if (!claimAddress) return

      await ensureSepolia()
      const provider = getProvider()
      const signer = await provider.getSigner()
      const contract = new Contract(FAUCET_ADDRESS, FAUCET_ABI, signer)

      const tx = await contract.claim()
      setMessage({ type: 'success', text: `交易已提交，等待确认… ${tx.hash}` })

      await tx.wait()
      await loadFaucetInfo(claimAddress)

      setMessage({
        type: 'success',
        text: `领取成功！交易哈希: ${tx.hash}，已领取 ${info?.claimAmount ?? ''} Sepolia ETH`,
      })
    } catch (err: unknown) {
      const error = err as { message?: string; data?: string }
      let text = error.message || '领取失败'

      if (text.includes('WeeklyLimitExceeded')) {
        text = '本周领取额度已用完，请 7 天后再试'
      } else if (text.includes('InsufficientBalance')) {
        text = '水龙头余额不足，请稍后再试'
      } else if (text.includes('ACTION_REJECTED') || text.includes('user rejected')) {
        text = '已取消交易'
      }

      setMessage({ type: 'error', text })
    } finally {
      setIsClaiming(false)
    }
  }

  useEffect(() => {
    loadFaucetInfo(null).catch(() => {})

    if (typeof window.ethereum === 'undefined') return

    const handleAccountsChanged = (accounts: string[]) => {
      const next = accounts[0] ?? null
      setAddress(next)
      if (next) {
        loadFaucetInfo(next).catch(() => setInfo(null))
      } else {
        setInfo(null)
      }
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    window.ethereum.on?.('accountsChanged', handleAccountsChanged)
    window.ethereum.on?.('chainChanged', handleChainChanged)

    getProvider()
      .send('eth_accounts', [])
      .then(async (accounts: string[]) => {
        if (accounts[0]) {
          setAddress(accounts[0])
          await loadFaucetInfo(accounts[0])
        }
      })
      .catch(() => {})

    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [loadFaucetInfo])

  const isBusy = isConnecting || isClaiming
  const canClaim = info && Number(info.remaining) > 0 && Number(info.contractBalance) > 0

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Sepolia 测试币水龙头</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        连接钱包后直接调用链上合约领取。每个地址每 7 天最多领取 {info?.weeklyLimit ?? '0.1'} ETH。
      </p>

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
            <span className="text-gray-900 dark:text-gray-100">{info?.claimAmount ?? '-'} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">本周剩余额度</span>
            <span className="text-gray-900 dark:text-gray-100">{info?.remaining ?? '-'} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">水龙头余额</span>
            <span className="text-gray-900 dark:text-gray-100">{info?.contractBalance ?? '-'} ETH</span>
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

        {!address ? (
          <button
            type="button"
            onClick={connectWallet}
            disabled={isBusy}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isConnecting ? '连接中…' : '连接钱包'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClaim}
            disabled={isBusy || !canClaim}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isClaiming ? '领取中…' : canClaim ? '领取测试 ETH' : '暂不可领取'}
          </button>
        )}
      </div>
    </div>
  )
}
