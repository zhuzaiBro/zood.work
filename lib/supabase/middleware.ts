import { NextResponse, type NextRequest } from 'next/server'
import {
  INTERVIEW_REFERRAL_COLLECTION_COOKIE,
  INTERVIEW_REFERRAL_URL_COOKIE,
  INTERVIEW_REFERRER_COOKIE,
  isUuid,
} from '@/lib/interview-referral-cookies'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })
  const referrerUserId = request.nextUrl.searchParams.get('ref')
  if (!isUuid(referrerUserId)) return response

  const cookieOptions = { maxAge: 7 * 24 * 60 * 60, sameSite: 'lax' as const, path: '/' }
  response.cookies.set(INTERVIEW_REFERRER_COOKIE, referrerUserId!, cookieOptions)
  response.cookies.set(
    INTERVIEW_REFERRAL_URL_COOKIE,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    cookieOptions,
  )
  const sourceCollectionId = request.nextUrl.searchParams.get('refCollection')
  if (isUuid(sourceCollectionId)) {
    response.cookies.set(INTERVIEW_REFERRAL_COLLECTION_COOKIE, sourceCollectionId!, cookieOptions)
  }
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
