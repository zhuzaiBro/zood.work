// 用户相关类型定义

export interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  vip_level: number
  vip_expires_at?: string | null
  is_admin: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface User {
  id: string
  email?: string
  user_metadata?: {
    [key: string]: any
  }
  app_metadata?: {
    [key: string]: any
  }
  created_at?: string
}

export interface UserState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}
