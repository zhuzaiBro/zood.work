'use client'

import { useUserStore, useUser, useProfile, useIsAuthenticated, useIsLoading } from '@/store/userStore'
import { createClient } from '@/lib/supabase/client'
import { platformBrowser } from '@/lib/platform/client'
import { useRouter } from 'next/navigation'

/**
 * 认证相关的自定义 Hook
 */
export function useAuth() {
  const user = useUser()
  const profile = useProfile()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useIsLoading()
  const { setUser, setProfile, clearUser, updateProfile } = useUserStore()
  const router = useRouter()

  /**
   * 登出
   */
  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearUser()
    router.push('/login')
    router.refresh()
  }

  /**
   * 刷新用户资料
   */
  const refreshProfile = async () => {
    if (!user) return null

    const { profile: nextProfile } = await platformBrowser<{ profile: any }>('/api/platform/me/profile')

    if (nextProfile) {
      setProfile(nextProfile)
    }

    return nextProfile
  }

  /**
   * 更新用户资料
   */
  const updateUserProfile = async (updates: any) => {
    if (!user) return { error: new Error('未登录') }

    const body: Record<string, unknown> = {}
    for (const key of ['username', 'display_name', 'avatar_url', 'bio'] as const) {
      if (updates && Object.prototype.hasOwnProperty.call(updates, key)) {
        body[key] = updates[key]
      }
    }

    try {
      const { profile: nextProfile } = await platformBrowser<{ profile: any }>('/api/platform/me/profile', {
        method: 'PATCH',
        body,
      })
      if (nextProfile) {
        updateProfile(nextProfile)
      }
      return { data: nextProfile, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * 检查是否有权限（示例）
   */
  const hasPermission = (permission: string): boolean => {
    // 这里可以根据用户的角色或权限来判断
    // 示例实现
    return isAuthenticated
  }

  return {
    // 状态
    user,
    profile,
    isAuthenticated,
    isLoading,
    
    // 方法
    signOut,
    refreshProfile,
    updateUserProfile,
    hasPermission,
  }
}

