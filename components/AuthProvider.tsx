'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/userStore'
import type { User } from '@/types/user'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // 使用 store 的 initialize 方法和其他 actions
  const { initialize, setUser, setProfile, clearUser } = useUserStore()

  useEffect(() => {
    console.log('AuthProvider 初始化开始')
    
    // 1. 应用启动时，调用 store 的初始化方法
    // 这会根据当前的 Token 请求最新的 user 和 user_profiles
    initialize().catch((error) => {
      console.error('初始化用户状态失败:', error)
    })

    // 2. 监听认证状态变化
    // 这处理运行时事件，如登录、登出、Token 刷新等
    try {
      const supabase = createClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id)
          
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user as User)
            
            // 登录成功后，获取最新 Profile
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            
            if (profile) {
              setProfile(profile)
            }
          } else if (event === 'SIGNED_OUT') {
            clearUser()
          } else if (event === 'USER_UPDATED' && session?.user) {
            setUser(session.user as User)
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user as User)
          }
        }
      )

      // 清理订阅
      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('设置认证监听失败:', error)
    }
  }, [initialize, setUser, setProfile, clearUser])

  return <>{children}</>
}
