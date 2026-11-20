import { serverUser } from '@/lib/auth/server'
import { platformServer } from '@/lib/platform/server'
import {
  INTERVIEW_REFERRAL_COLLECTION_COOKIE,
  INTERVIEW_REFERRAL_URL_COOKIE,
  INTERVIEW_REFERRER_COOKIE,
} from '@/lib/interview-referral-cookies'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const next = searchParams.get('next') ?? '/'
  if (searchParams.get('code')) {
    return NextResponse.redirect(`${origin}/login?redirect=${encodeURIComponent(next)}&error=oauth_unavailable`)
  }

  const user = await serverUser()
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
