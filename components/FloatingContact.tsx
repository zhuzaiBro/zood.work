'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/store/userStore'

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [showVIP, setShowVIP] = useState(false)
  const profile = useProfile()

  // 监听点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.floating-contact')) {
        setIsOpen(false)
        setShowQR(false)
        setShowVIP(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-4 floating-contact">
      {/* 展开的菜单 */}
      <div
        className="flex flex-col gap-3 p-1 bg-white rounded-2xl shadow-2xl origin-bottom-right ${
         opacity-100 scale-100 translate-y-0"
      >
        {/* VIP 会员弹窗 */}
        <div 
          className={`absolute bottom-0 right-16 bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right w-80 ${
            showVIP ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none hidden'
          }`}
        >
          <div className="space-y-4">
            {/* VIP 标题 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">VIP</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">尊享永久会员</h3>
                  <p className="text-gray-400 text-xs">解锁所有面试题解，一次性买断</p>
                </div>
              </div>
            </div>

            {/* 当前用户 VIP 状态 */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">当前等级</span>
                <span className={`font-bold ${(profile?.vip_level || 0) > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {(profile?.vip_level || 0) > 0 ? `VIP${profile?.vip_level}` : '普通用户'}
                </span>
              </div>
            </div>

            {/* 价格 */}
            <div className="text-center py-4">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-white text-xs bg-blue-500 px-2 py-0.5 rounded">限时优惠</span>
              </div>
              <div className="flex items-baseline justify-center gap-2 mt-2">
                <span className="text-white text-xs">¥</span>
                <span className="text-white text-4xl font-bold">129</span>
                <span className="text-gray-400 text-sm line-through">¥399</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">/永久</p>
            </div>

            {/* 权益说明 */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>解锁全部企业高频面试题及高质量题解</span>
              </div>
              <div className="flex items-start gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>参与模拟面试，获取百套模拟面试视频</span>
              </div>
              <div className="flex items-start gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>加入永久会员交流群，专属答疑</span>
              </div>
            </div>

            {/* 获取兑换码按钮 */}
            <button
              onClick={() => {
                setShowVIP(false)
                setShowQR(true)
              }}
              className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              立即开通 / 获取兑换码
            </button>
            
            <p className="text-gray-500 text-xs text-center">
              点击按钮联系客服获取兑换码
            </p>
          </div>
        </div>

        {/* 微信二维码弹窗 */}
        <div 
          className={`absolute bottom-0 right-16 bg-white p-6 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right w-72 ${
            showQR ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none hidden'
          }`}
        >
          <div className="text-center space-y-4">
            <div>
              <p className="font-bold text-gray-800 text-base">扫码添加老师微信</p>
              <p className="text-xs text-gray-500 mt-1">获取兑换码 · 干货不错过</p>
            </div>
            
            {/* 二维码 */}
            <div className="bg-gray-50 w-56 h-56 mx-auto rounded-xl flex items-center justify-center overflow-hidden relative border-2 border-gray-100">
              <div className="absolute inset-0 p-3">
                <div className="w-full h-full border-4 border-black relative rounded-lg overflow-hidden">
                  <img src="/wechat_qr.png" alt="微信二维码" className="w-full h-full object-contain" />
                  {/* 中心 Logo */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                    <img src="/zood.jpg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>

            {/* 社交平台链接 */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">关注我们</p>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                <a 
                  href="https://space.bilibili.com/454191674?spm_id_from=333.1007.0.0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  B站
                </a>
                <a 
                  target='_blank' 
                  rel="noopener noreferrer" 
                  href='https://www.douyin.com/user/MS4wLjABAAAAQsFM-9LhBVJK68I1BqhJNnAXOlvD380DoYX3VpV-fITk3H2uQbc03vyQcKasPp_E'
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  抖音
                </a>
                <a 
                  target='_blank' 
                  rel="noopener noreferrer" 
                  href='https://www.xiaohongshu.com/user/profile/5d2e64f30000000012002116'
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  小红书
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* VIP 按钮 */}
        <button
          onClick={() => {
            setShowVIP(!showVIP)
            setShowQR(false)
          }}
          className="w-[26px] h-[26px] bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center text-white hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-110"
          title="开通VIP会员"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>

        {/* 微信按钮 */}
        <button
          onClick={() => {
            setShowQR(!showQR)
            setShowVIP(false)
          }}
          className="w-[26px] h-[26px] bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
          title="关注公众号"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.686 10.482c1.116 0 2.022-.856 2.022-1.912 0-1.057-.906-1.913-2.022-1.913-1.117 0-2.023.856-2.023 1.913 0 1.056.906 1.912 2.023 1.912zm6.833 0c1.117 0 2.023-.856 2.023-1.912 0-1.057-.906-1.913-2.023-1.913-1.116 0-2.022.856-2.022 1.913 0 1.056.906 1.912 2.022 1.912zM12.106 0C5.394 0 0 4.376 0 9.73c0 2.957 1.694 5.616 4.338 7.42v3.703c0 .254.14.485.364.597.106.053.22.08.335.08.14 0 .28-.04.402-.12l3.643-2.364c.976.282 2.007.435 3.06.435 6.676 0 12.068-4.376 12.068-9.73S18.782 0 12.106 0z"/>
          </svg>
        </button>

        {/* GitHub 按钮 */}
        <a
          href="https://github.com/zhuzaiBro" 
          target="_blank"
          rel="noopener noreferrer"
          className="w-[26px] h-[26px] bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="GitHub"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </a>
      </div>

      {/* 主按钮 */}
      {/* <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 ${
          isOpen ? 'bg-blue-600 rotate-45' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button> */}
    </div>
  )
}
