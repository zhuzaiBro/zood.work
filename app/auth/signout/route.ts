import { SESSION_COOKIE } from '@/lib/auth/session'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const response = NextResponse.redirect(`${siteUrl}/`)
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
