'use client'

import { useState } from 'react'

export default function Faucet() {
  const [walletAddress, setWalletAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '领取失败')
      }

      setMessage({
        type: 'success',
        text: `领取成功！交易哈希: ${data.tx_hash}`,
      })
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || '请求失败',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Sepolia 测试币水龙头</h2>
      <p className="text-sm text-gray-500 mb-6">
        输入您的以太坊钱包地址，领取 0.1 Sepolia ETH。每个钱包/IP 仅限领取一次。
      </p>

      <form onSubmit={handleClaim} className="space-y-4">
        <div>
          <label htmlFor="wallet" className="block text-sm font-medium mb-2 text-gray-700">
            钱包地址
          </label>
          <input
            id="wallet"
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            pattern="^0x[a-fA-F0-9]{40}$"
            disabled={isLoading}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm break-all ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-600 border border-green-200' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isLoading ? '处理中...' : '领取测试币'}
        </button>
      </form>
    </div>
  )
}

