'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/store/userStore'
import MembershipConsultationModal from '@/components/MembershipConsultationModal'
import { getEffectiveVipLevel } from '@/lib/membership'

export default function FloatingContact() {
  const [showQR, setShowQR] = useState(false)
  const [showVIP, setShowVIP] = useState(false)
  const [consultationOpen, setConsultationOpen] = useState(false)
  const profile = useProfile()
  const activeVipLevel = getEffectiveVipLevel(profile)

  // 监听点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.floating-contact')) {
        setShowQR(false)
        setShowVIP(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-4 floating-contact sm:right-8">
      {/* 展开的菜单 */}
      <div
        className="flex origin-bottom-right flex-col gap-2 rounded-full border border-sky-300/20 bg-[#07101f]/80 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.36),0_0_28px_rgba(125,211,252,0.12)] backdrop-blur-md"
      >
        {/* VIP 会员弹窗 */}
        <div 
          className={`absolute bottom-0 right-16 w-80 rounded-2xl border border-sky-300/20 bg-[#07101f]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 origin-bottom-right ${
            showVIP ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none hidden'
          }`}
        >
          <div className="space-y-4">
            {/* VIP 标题 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5f82ff,#8fe7ff)]">
                  <span className="text-[#04101f] text-sm font-bold">VIP</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">尊享永久会员</h3>
                  <p className="text-[#8da2c4] text-xs">解锁高质量题解与学习资料</p>
                </div>
              </div>
            </div>

            {/* 当前用户 VIP 状态 */}
            <div className="rounded-xl border border-sky-300/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8da2c4]">当前等级</span>
                <span className={`font-bold ${activeVipLevel > 0 ? 'text-sky-200' : 'text-[#60708f]'}`}>
                  {activeVipLevel > 0 ? `VIP${activeVipLevel}` : '普通用户'}
                </span>
              </div>
            </div>

            {/* 价格 */}
            <div className="text-center py-4">
              <div className="flex items-baseline justify-center gap-2">
                <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-0.5 text-xs text-sky-100">限时优惠</span>
              </div>
              <div className="flex items-baseline justify-center gap-2 mt-2">
                <span className="text-white text-xs">¥</span>
                <span className="text-white text-4xl font-bold">129</span>
                <span className="text-[#60708f] text-sm line-through">¥399</span>
              </div>
              <p className="text-[#8da2c4] text-xs mt-1">/永久</p>
            </div>

            {/* 权益说明 */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-[#cbd8f2]">
                <span className="text-sky-300">✓</span>
                <span>解锁全部企业高频面试题及高质量题解</span>
              </div>
              <div className="flex items-start gap-2 text-[#cbd8f2]">
                <span className="text-sky-300">✓</span>
                <span>参与模拟面试，获取百套模拟面试视频</span>
              </div>
              <div className="flex items-start gap-2 text-[#cbd8f2]">
                <span className="text-sky-300">✓</span>
                <span>加入永久会员交流群，专属答疑</span>
              </div>
            </div>

            {/* 获取兑换码按钮 */}
            <button
              onClick={() => {
                setShowVIP(false)
                setConsultationOpen(true)
              }}
              className="w-full rounded-xl bg-[linear-gradient(135deg,#5f82ff,#8fe7ff)] px-6 py-3 font-bold text-[#04101f] shadow-[0_16px_34px_rgba(86,145,255,0.28)] transition-all hover:-translate-y-0.5"
            >
              立即开通 / 提交咨询
            </button>

            <button
              type="button"
              onClick={() => {
                setShowVIP(false)
                setShowQR(true)
              }}
              className="w-full rounded-xl border border-sky-300/20 px-6 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-white/5"
            >
              或直接扫码添加老师微信
            </button>
            
            <p className="text-[#60708f] text-xs text-center">
              提交手机号和微信号后，我会主动联系你
            </p>
          </div>
        </div>

        {/* 微信二维码弹窗 */}
        <div 
          className={`absolute bottom-0 right-16 w-72 rounded-2xl border border-sky-300/20 bg-[#07101f]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 origin-bottom-right ${
            showQR ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none hidden'
          }`}
        >
          <div className="text-center space-y-4">
            <div>
              <p className="font-bold text-white text-base">扫码添加老师微信</p>
              <p className="text-xs text-[#8da2c4] mt-1">获取兑换码 · 干货不错过</p>
            </div>
            
            {/* 二维码 */}
            <div className="bg-white w-56 h-56 mx-auto rounded-xl flex items-center justify-center overflow-hidden relative border border-sky-300/20">
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
            <div className="pt-3 border-t border-sky-300/10">
              <p className="text-xs text-[#8da2c4] mb-2">关注我们</p>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                <a 
                  href="https://space.bilibili.com/454191674?spm_id_from=333.1007.0.0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:text-white transition-colors"
                >
                  B站
                </a>
                <a 
                  target='_blank' 
                  rel="noopener noreferrer" 
                  href='https://www.douyin.com/user/MS4wLjABAAAAQsFM-9LhBVJK68I1BqhJNnAXOlvD380DoYX3VpV-fITk3H2uQbc03vyQcKasPp_E'
                  className="text-sky-300 hover:text-white transition-colors"
                >
                  抖音
                </a>
                <a 
                  target='_blank' 
                  rel="noopener noreferrer" 
                  href='https://www.xiaohongshu.com/user/profile/5d2e64f30000000012002116'
                  className="text-sky-300 hover:text-white transition-colors"
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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/10 text-sky-100 shadow-[0_0_22px_rgba(125,211,252,0.12)] transition-all hover:scale-110 hover:bg-sky-300/18 hover:text-white"
          title="开通VIP会员"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>

        {/* 微信按钮 */}
        <button
          onClick={() => {
            setShowQR(!showQR)
            setShowVIP(false)
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/10 text-sky-100 shadow-[0_0_22px_rgba(125,211,252,0.12)] transition-all hover:scale-110 hover:bg-sky-300/18 hover:text-white"
          title="关注公众号"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.686 10.482c1.116 0 2.022-.856 2.022-1.912 0-1.057-.906-1.913-2.022-1.913-1.117 0-2.023.856-2.023 1.913 0 1.056.906 1.912 2.023 1.912zm6.833 0c1.117 0 2.023-.856 2.023-1.912 0-1.057-.906-1.913-2.023-1.913-1.116 0-2.022.856-2.022 1.913 0 1.056.906 1.912 2.022 1.912zM12.106 0C5.394 0 0 4.376 0 9.73c0 2.957 1.694 5.616 4.338 7.42v3.703c0 .254.14.485.364.597.106.053.22.08.335.08.14 0 .28-.04.402-.12l3.643-2.364c.976.282 2.007.435 3.06.435 6.676 0 12.068-4.376 12.068-9.73S18.782 0 12.106 0z"/>
          </svg>
        </button>

        {/* GitHub 按钮 */}
        <a
          href="https://github.com/zhuzaiBro" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/10 text-sky-100 shadow-[0_0_22px_rgba(125,211,252,0.12)] transition-all hover:scale-110 hover:bg-sky-300/18 hover:text-white"
          title="GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </a>
      </div>

      <MembershipConsultationModal
        open={consultationOpen}
        onClose={() => setConsultationOpen(false)}
        source="floating_contact"
      />

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
