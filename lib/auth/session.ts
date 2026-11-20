import { platformRequest } from '@/lib/platform/http'

export const SESSION_STORAGE_KEY = 'zood.session'
export const SESSION_COOKIE = 'zood_session'

export type SessionUser = {
  id: string
  email?: string
  created_at?: string
  user_metadata?: Record<string, unknown>
}

type SessionResponse = {
  token: string
  user: SessionUser
}

export function readBrowserToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SESSION_STORAGE_KEY)
}

export function writeBrowserToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(SESSION_STORAGE_KEY, token)
  else window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function userFromToken(token: string | null): SessionUser | null {
  if (!token) return null
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    if (!json.sub) return null
    return { id: json.sub, email: json.email }
  } catch {
    return null
  }
}

export async function rememberSession(token: string) {
  writeBrowserToken(token)
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

export async function signInWithPassword(email: string, password: string) {
  const result = await platformRequest<SessionResponse>('/api/platform/auth/login', {
    method: 'POST',
    body: { email, password },
    cache: 'no-store',
  })
  await rememberSession(result.token)
  return result.user
}

export async function signUp(email: string, password: string) {
  const result = await platformRequest<SessionResponse>('/api/platform/auth/register', {
    method: 'POST',
    body: { email, password },
    cache: 'no-store',
  })
  await rememberSession(result.token)
  return result.user
}

export async function signOut() {
  writeBrowserToken(null)
  await fetch('/api/auth/session', { method: 'DELETE' })
}

export async function browserUser() {
  return userFromToken(readBrowserToken())
}
