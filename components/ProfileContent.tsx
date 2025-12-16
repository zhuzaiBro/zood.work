'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ProfileContentProps {
  user: {
    id: string
    email?: string
  }
  profile: {
    display_name?: string | null
    username?: string | null
    avatar_url?: string | null
    bio?: string | null
    vip_level?: number | null
  } | null
}

export default function ProfileContent({ user, profile }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState('favorites')
  const [copiedId, setCopiedId] = useState(false)

  const displayName = profile?.display_name || profile?.username || '用户'
  const vipLevel = profile?.vip_level || 0
  const userAvatar = profile?.avatar_url

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const tabs = [
    { id: 'favorites', label: '题目收藏' },
    { id: 'answers', label: '回答收藏' },
    { id: 'records', label: '刷题记录' },
    { id: 'my-answers', label: '我的回答' },
    { id: 'created', label: '创建题目' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 左侧个人信息卡片 */}
      <div className="lg:col-span-3 space-y-6">
        {/* 个人信息卡 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">个人信息</h2>
            <div className="flex gap-2">
              <Link
                href="/profile/edit"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="编辑资料"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </Link>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" title="设置">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 头像 */}
          <div className="flex flex-col items-center mb-6">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-4 border-gray-100 mb-4">
                <span className="text-white text-3xl">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <h3 className="text-xl font-bold text-gray-900 mb-2">{displayName}</h3>

            {/* VIP 等级 */}
            <div className={`px-4 py-1 rounded-full text-sm font-bold ${
              vipLevel > 0 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {vipLevel > 0 ? `VIP ${vipLevel}` : 'LV 0'}
            </div>
          </div>

          {/* 社交链接 */}
          <div className="flex justify-center gap-3 mb-6">
            <a
              href={`https://github.com/${profile?.username || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              title="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors" title="网站">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>
          </div>

          {/* 个人简介 */}
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500">
              {profile?.bio || '暂无个人简介'}
            </p>
          </div>

          {/* 用户 ID */}
          <div className="text-center text-xs text-gray-400 mb-6 flex items-center justify-center gap-2">
            <span>ID: {user.id.substring(0, 18)}...</span>
            <button
              onClick={handleCopyId}
              className="text-blue-500 hover:text-blue-600"
              title={copiedId ? '已复制!' : '复制ID'}
            >
              {copiedId ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* VIP 开通卡片 */}
        {vipLevel === 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg p-6 text-white">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold mb-2">未开通永久会员</h3>
              <p className="text-sm text-gray-300">畅刷 9000+ 高频面试题</p>
            </div>
            <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              立即开通
            </button>
          </div>
        )}
      </div>

      {/* 右侧主内容区 */}
      <div className="lg:col-span-9 space-y-6">
        {/* 会员等级卡片 */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <svg viewBox="0 0 100 100" fill="white">
              <polygon points="50,10 61,35 90,35 67,53 77,78 50,60 23,78 33,53 10,35 39,35" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs opacity-80 mb-1">当前等级</div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">{vipLevel > 0 ? `VIP ${vipLevel}` : 'LV 0'}</span>
                  <span className="text-sm opacity-80">排名 -</span>
                  <span className="text-sm opacity-80">经验 {vipLevel * 100}</span>
                </div>
              </div>
              <div className="text-right">
                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                  经验值明细
                </button>
              </div>
            </div>
            
            <div className="flex gap-4 text-xs">
              <span className="opacity-80">还需 {100 - (vipLevel * 100 % 100)} 经验升级</span>
              <span className="opacity-80">可申请进入专属群</span>
            </div>
          </div>
        </div>

        {/* 活跃度日历 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                2025 年共发布题解 <span className="text-blue-600">0</span> 次，累计天数：<span className="text-blue-600">0</span> 天
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>不活跃</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-3 h-3 bg-orange-400 rounded-sm" style={{ opacity: i * 0.25 }} />
                ))}
              </div>
              <span>活跃</span>
            </div>
          </div>

          {/* 简化的日历热力图 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'].map((month) => (
              <div key={month} className="flex-shrink-0">
                <div className="text-xs text-gray-400 mb-2">{month}</div>
                <div className="grid grid-rows-7 gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-gray-100 rounded-sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab 切换和内容区域 */}
        <div className="bg-white rounded-2xl shadow-sm">
          {/* Tab 导航 */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 筛选区域 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4 items-center flex-wrap">
              <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                <option>搜索题目</option>
              </select>
              <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                <option>标记</option>
              </select>
              <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                <option>会员专属</option>
              </select>
              <input 
                type="text" 
                placeholder="可选 10 个标签，支持搜索" 
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-12 text-center">
            <div className="text-6xl mb-4 opacity-20">📝</div>
            <p className="text-gray-400 text-sm">暂无收藏列表，快去收藏吧~</p>
          </div>

          {/* 分页 */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">总共 0 条</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 cursor-not-allowed" disabled>
                &lt;
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">1</span>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 cursor-not-allowed" disabled>
                &gt;
              </button>
              <select className="ml-2 px-3 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500">
                <option>20 条/页</option>
                <option>50 条/页</option>
                <option>100 条/页</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

