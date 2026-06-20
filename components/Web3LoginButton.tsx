'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { buildDefaultUserProfile } from '@/lib/user-profiles'

export default function Web3LoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleWeb3Login = async (chainType: 'ethereum' | 'solana' = 'ethereum') => {
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()

      // 检查钱包是否已安装
      if (chainType === 'ethereum') {
        if (typeof window.ethereum === 'undefined') {
          throw new Error('未检测到以太坊钱包。请安装 MetaMask 或其他钱包。')
        }
      } else if (chainType === 'solana') {
        if (typeof window.solana === 'undefined') {
          throw new Error('未检测到 Solana 钱包。请安装 Phantom 或其他钱包。')
        }
        
        // Solana 钱包需要先连接
        try {
          if (!window.solana.isConnected) {
            await window.solana.connect({ onlyIfTrusted: false })
          }
        } catch (err) {
          console.error('Solana wallet connection error:', err)
          throw new Error('无法连接 Solana 钱包，请重试')
        }
      }

      // 使用 Supabase 的官方 Web3 登录 API
      // Supabase 会自动处理：连接钱包、生成消息、请求签名、验证签名
      // 注意：statement 不能包含换行符
      // Solana 钱包对格式更严格，建议使用简单的英文消息
      // 重要：Solana 需要提供 uri 参数来验证消息来源
      const signInParams = chainType === 'ethereum'
        ? {
            chain: 'ethereum' as const,
            uri: window.location.origin,
            statement: `登录到zood的小破站 - 我接受服务条款：${window.location.origin}/terms`,
          }
        : {
            chain: 'solana' as const,
            uri: window.location.origin,
            statement: 'Sign in to My Blog', // Solana 使用简单的英文
          }
      
      const { data, error: signInError } = await supabase.auth.signInWithWeb3(signInParams as any)

      if (signInError) {
        throw signInError
      }

      if (!data?.user) {
        throw new Error('登录失败，请重试')
      }

      // 检查是否需要创建用户资料
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!profile) {
        const profileData = buildDefaultUserProfile(data.user)
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(profileData as never)

        if (insertError) {
          console.error('创建用户资料失败:', insertError)
          // 不抛出错误，用户仍然可以登录
        }
      }

      // 登录成功，跳转到首页
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('Web3 login error:', err)
      setError(err.message || '钱包登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={() => handleWeb3Login('ethereum')}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
      >
        <svg className="w-5 h-5" viewBox="0 0 318.6 318.6" fill="currentColor">
          <path d="M274.1,35.5l-99.5,73.9L193,65.8z M44.4,65.8l18.7,43.6l-99.5-73.9z M238.3,206.8l26.5,51.8l-119.1,32.8l0,0l-119-32.8l26.5-51.8H238.3z M33.9,179.3l26.5-51.8l33.6,65.3L33.9,179.3z M225.1,192.8l33.5-65.3l26.5,51.8L225.1,192.8z"/>
        </svg>
        {isLoading ? '登录中...' : '🦊 Ethereum 钱包登录'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">或</span>
        </div>
      </div>

      <button
        onClick={() => handleWeb3Login('solana')}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
      >
        <svg className="w-5 h-5" viewBox="0 0 397.7 311.7" fill="currentColor">
          <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"/>
          <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
          <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
        </svg>
        {isLoading ? '登录中...' : '👻 Solana 钱包登录'}
      </button>
      
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
        支持 MetaMask、Phantom、Coinbase Wallet 等所有钱包
      </p>
    </div>
  )
}
