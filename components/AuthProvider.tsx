'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/userStore'
import type { User } from '@/types/user'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // 使用 store 的 initialize 方法和其他 actions
  const { initialize, setUser, setProfile, clearUser } = useUserStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}
