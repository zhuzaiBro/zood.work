import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserProfile, UserState } from '@/types/user'
import { createClient } from '@/lib/supabase/client'

interface UserStore extends UserState {
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (isLoading: boolean) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  clearUser: () => void
  initialize: () => Promise<void>
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        })
      },

      setProfile: (profile) => {
        set({ profile })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      updateProfile: (updates) => {
        const currentProfile = get().profile
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              ...updates,
              updated_at: new Date().toISOString(),
            },
          })
        }
      },

      clearUser: () => {
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      initialize: async () => {
        const state = get()
        
        // 如果本地没有数据，显示 loading
        if (!state.isAuthenticated) {
          set({ isLoading: true })
        }

        // 设置超时保护，防止无限加载
        const timeoutId = setTimeout(() => {
          console.warn('User initialization timeout - setting isLoading to false')
          set({ isLoading: false })
        }, 1500) // 1.5秒超时

        try {
          const supabase = createClient()

          // 检查环境变量是否正确配置
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('Supabase environment variables not configured')
            set({ isLoading: false })
            clearTimeout(timeoutId)
            return
          }

          // 1. 获取当前用户 Session
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError) {
            console.error('Failed to get user:', userError)
          }
          
          if (userError || !user) {
            // 验证失败或无用户，清除状态
            if (state.isAuthenticated) {
               // 只有在之前认为是登录状态时才执行清理，避免不必要的重渲染
               get().clearUser()
            } else {
              set({ isLoading: false })
            }
            clearTimeout(timeoutId)
            return
          }

          // 2. 更新用户基本信息
          set({ user, isAuthenticated: true })

          // 3. 获取最新的 Profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

          if (profileError) {
            console.error('Failed to get profile:', profileError)
          }

          if (profile) {
            set({ profile, isLoading: false })
          } else {
            // 如果没有 profile，保持 user 但结束 loading
             set({ isLoading: false })
          }

          clearTimeout(timeoutId)

        } catch (error) {
          console.error('User store initialization failed:', error)
          get().clearUser()
          clearTimeout(timeoutId)
        } finally {
           set({ isLoading: false })
        }
      },
    }),
    {
      name: 'user-storage', // localStorage key
      storage: createJSONStorage(() => {
        // 确保仅在客户端访问 localStorage
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // 服务端返回一个空实现，防止报错
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      // 只持久化用户基本信息，不持久化 loading 状态
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Selectors - 用于性能优化
export const useUser = () => useUserStore((state) => state.user)
export const useProfile = () => useUserStore((state) => state.profile)
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated)
export const useIsLoading = () => useUserStore((state) => state.isLoading)
export const useIsAdmin = () => useUserStore((state) => state.profile?.is_admin === true)
