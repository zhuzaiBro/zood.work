import { cookies } from 'next/headers'
import { SESSION_COOKIE, userFromToken } from '@/lib/auth/session'

export async function serverAccessToken() {
  const jar = await cookies()
  return jar.get(SESSION_COOKIE)?.value ?? null
}

export async function serverUser() {
  return userFromToken(await serverAccessToken())
}
