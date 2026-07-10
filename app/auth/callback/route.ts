import { createAdminClient, createClient } from '@/lib/supabase/server'
import { claimInterviewReferralReward } from '@/lib/interview-referrals'
import {
  INTERVIEW_REFERRAL_COLLECTION_COOKIE,
  INTERVIEW_REFERRAL_URL_COOKIE,
  INTERVIEW_REFERRER_COOKIE,
} from '@/lib/interview-referral-cookies'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams,  } = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const referrerUserId = request.cookies.get(INTERVIEW_REFERRER_COOKIE)?.value ?? null
        if (referrerUserId) {
          try {
            await claimInterviewReferralReward({
              adminClient: createAdminClient(),
              referrerUserId,
              referredUser: user,
              sourceCollectionId:
                request.cookies.get(INTERVIEW_REFERRAL_COLLECTION_COOKIE)?.value ?? null,
              sourceUrl: request.cookies.get(INTERVIEW_REFERRAL_URL_COOKIE)?.value ?? null,
            })
          } catch (rewardError) {
            console.error('Failed to claim interview referral reward:', rewardError)
          }
        }
      }

      const response = NextResponse.redirect(`${origin}${next}`)
      response.cookies.delete(INTERVIEW_REFERRER_COOKIE)
      response.cookies.delete(INTERVIEW_REFERRAL_COLLECTION_COOKIE)
      response.cookies.delete(INTERVIEW_REFERRAL_URL_COOKIE)
      return response
    }
  }

  // 返回用户到错误页面，并添加错误描述
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
