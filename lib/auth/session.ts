import { createClient } from '@/lib/supabase/client'

export type SessionUser = {
  id: string
  email?: string
  created_at?: string
  user_metadata?: Record<string, unknown>
}

export async function browserAccessToken() {
  const { data } = await createClient().auth.getSession()
  return data.session?.access_token ?? null
}

export async function browserUser(): Promise<SessionUser | null> {
  const { data, error } = await createClient().auth.getUser()
  if (error || !data.user) return null
  return {
    id: data.user.id,
    email: data.user.email,
    created_at: data.user.created_at,
  }
}

export async function signOut() {
  await createClient().auth.signOut()
}
