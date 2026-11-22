import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserProfile, UserState } from '@/types/user'
import { createClient } from '@/lib/supabase/client'
import { platformBrowser, PlatformError } from '@/lib/platform/client'
import { buildDefaultUserProfile } from '@/lib/user-profiles'

interface UserStore extends UserState {
  // Session check finished. Distinct from isLoading, which is released on a
  // timer so the learn page can paint before profile returns.
  authResolved: boolean
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
      authResolved: false,

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
          authResolved: true,
        })
      },

      initialize: async () => {
        const state = get()
        
        // 如果本地没有数据，显示 loading
        if (!state.isAuthenticated) {
          set({ isLoading: true })
        }

        // 超时只放开 isLoading，学习页可以继续画。authResolved 仍要等本次
        // 会话检查结束，顶栏才不会在等待期间先画出登录按钮。
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

          // 本地缓存的 profile 若与当前登录用户不一致，先清掉
          const cachedProfile = get().profile
          if (cachedProfile && cachedProfile.id !== user.id) {
            set({ profile: null })
          }

          // 3. 获取最新的 Profile
          let profile: UserProfile | null = null
          try {
            const result = await platformBrowser<{ profile: UserProfile | null }>('/api/platform/me/profile')
            profile = result.profile ?? null
          } catch (profileError) {
            if (!(profileError instanceof PlatformError) || profileError.status !== 404) {
              console.error('Failed to get profile:', profileError)
            }
          }

          if (profile) {
            set({ profile, isLoading: false })
          } else {
            const fallbackProfile = buildDefaultUserProfile(user)
            try {
              const result = await platformBrowser<{ profile: UserProfile | null }>('/api/platform/me/profile', {
                method: 'PUT',
                body: {
                  username: fallbackProfile.username,
                  display_name: fallbackProfile.display_name,
                  avatar_url: fallbackProfile.avatar_url,
                  bio: fallbackProfile.bio,
                },
              })
              set({ profile: result.profile ?? null, isLoading: false })
            } catch (insertProfileError) {
              console.error('Failed to create missing profile:', insertProfileError)
              set({ profile: null, isLoading: false })
            }
          }

          clearTimeout(timeoutId)

        } catch (error) {
          console.error('User store initialization failed:', error)
          get().clearUser()
          clearTimeout(timeoutId)
        } finally {
           set({ isLoading: false, authResolved: true })
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
export const useAuthResolved = () => useUserStore((state) => state.authResolved)
export const useIsAdmin = () => useUserStore((state) => Boolean(state.profile?.is_admin))
