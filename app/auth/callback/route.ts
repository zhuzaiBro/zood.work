import { createClient } from '@/lib/supabase/server'
import { recoveryCookie, recoverySession } from '@/lib/auth/recovery'
import { platformServer } from '@/lib/platform/server'
import {
  INTERVIEW_REFERRAL_COLLECTION_COOKIE,
  INTERVIEW_REFERRAL_URL_COOKIE,
  INTERVIEW_REFERRER_COOKIE,
} from '@/lib/interview-referral-cookies'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const code = searchParams.get('code')
  const target = searchParams.get('next') || '/'
  const next = target.startsWith('/') && !target.startsWith('//') && !target.includes('\\') ? target : '/'
  const tokenHash = searchParams.get('type') === 'recovery' ? searchParams.get('token_hash') : null
  const recovery = next === '/reset-password' || searchParams.get('type') === 'recovery'
  const recoveryRedirect = (path: string) => {
    const response = new NextResponse(null, { status: 303, headers: { Location: path } })
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  }

  if (code || tokenHash) {
    const supabase = await createClient()
    const { data, error } = tokenHash
      ? await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
      : await supabase.auth.exchangeCodeForSession(code!)
    if (!error) {
      const isRecoverySession = Boolean(tokenHash || ('redirectType' in data && data.redirectType === 'PASSWORD_RECOVERY'))
      if (recovery || isRecoverySession) {
        const marker = isRecoverySession && recoverySession(data.session)
        const response = recoveryRedirect('/reset-password')
        const jar = await cookies()
        jar.set(recoveryCookie, marker || '', {
          path: '/reset-password', httpOnly: true, secure: request.nextUrl.protocol === 'https:',
          sameSite: 'lax', maxAge: marker ? 900 : 0,
        })
        return response
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const referrerUserId = request.cookies.get(INTERVIEW_REFERRER_COOKIE)?.value ?? null

      if (user && referrerUserId) {
        try {
          await platformServer('/api/platform/me/referrals/claim', {
            method: 'POST',
            body: {
              referrerUserId,
              sourceCollectionId: request.cookies.get(INTERVIEW_REFERRAL_COLLECTION_COOKIE)?.value ?? null,
              sourceUrl: request.cookies.get(INTERVIEW_REFERRAL_URL_COOKIE)?.value ?? null,
            },
          })
        } catch (rewardError) {
          console.error('Failed to claim interview referral reward:', rewardError)
        }
      }

      const response = NextResponse.redirect(`${origin}${next}`)
      response.cookies.delete(INTERVIEW_REFERRER_COOKIE)
      response.cookies.delete(INTERVIEW_REFERRAL_COLLECTION_COOKIE)
      response.cookies.delete(INTERVIEW_REFERRAL_URL_COOKIE)
      return response
    }
  }

  if (recovery) {
    const response = recoveryRedirect('/reset-password')
    const jar = await cookies()
    jar.set(recoveryCookie, '', { path: '/reset-password', maxAge: 0 })
    return response
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
