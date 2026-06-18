'use client'

import { useProfile, useIsAuthenticated, useIsAdmin } from '@/store/userStore'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/hooks/useAuth'

export default function UserAvatar({ isHero = false }: { isHero?: boolean }) {
  const profile = useProfile()
  const isAuthenticated = useIsAuthenticated()
  const isAdmin = useIsAdmin()
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<any>(null)
  const router = useRouter()
  const { signOut } = useAuth()


  // 既然 Supabase 客户端可能锁死，我们在点击时再尝试获取，或者直接绕过它
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Sign out clicked - forcing logout')
    
    await signOut()
  }
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-sky-300/30 bg-sky-300/10 px-5 py-2.5 text-sm font-semibold text-sky-100 shadow-[0_0_28px_rgba(125,211,252,0.18)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-sky-200/60 hover:bg-sky-200/18 hover:text-white"
      >
        登录
      </Link>
    )
  }

  const displayProfile = profile || {
    avatar_url: null,
    display_name: 'User',
    username: 'User'
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 头像触发区 */}
      <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity py-2">
        {displayProfile.avatar_url ? (
          <img
            src={displayProfile.avatar_url}
            alt={displayProfile.display_name || displayProfile.username}
            className="bg-white w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {(displayProfile.display_name || displayProfile.username).charAt(0).toUpperCase()}
          </div>
        )}
        <span className={`text-sm font-medium hidden sm:inline text-blue-500`}>
          {displayProfile.display_name || displayProfile.username}
        </span>
      </Link>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full pt-1 w-48 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 text-sm overflow-hidden ring-1 ring-black/5">
            {/* 用户信息摘要 */}
            <Link 
              href="/profile" 
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              个人中心
            </Link>

            <Link 
              href="/interview" 
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              面试记录
            </Link>

            <Link 
              href="/posts/create" 
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              写文章
            </Link>

            {/* 管理员专属入口 */}
            {isAdmin && (
              <Link 
                href="/admin/questions" 
                className="flex items-center gap-2 px-4 py-2.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                面试题管理
                <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </Link>
            )}

            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
