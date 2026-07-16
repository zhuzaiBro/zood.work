import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import {
  INTERVIEW_REFERRAL_COLLECTION_COOKIE,
  INTERVIEW_REFERRAL_URL_COOKIE,
  INTERVIEW_REFERRER_COOKIE,
  isUuid,
} from '@/lib/interview-referral-cookies'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const referrerUserId = request.nextUrl.searchParams.get('ref')
  if (isUuid(referrerUserId)) {
    const sourceCollectionId = request.nextUrl.searchParams.get('refCollection')
    const cookieOptions = {
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax' as const,
      path: '/',
    }

    supabaseResponse.cookies.set(INTERVIEW_REFERRER_COOKIE, referrerUserId!, cookieOptions)
    supabaseResponse.cookies.set(
      INTERVIEW_REFERRAL_URL_COOKIE,
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      cookieOptions,
    )

    if (isUuid(sourceCollectionId)) {
      supabaseResponse.cookies.set(
        INTERVIEW_REFERRAL_COLLECTION_COOKIE,
        sourceCollectionId!,
        cookieOptions,
      )
    }

    supabaseResponse.headers.set('Cache-Control', 'private, no-store')
  }

  const isPublicInterviewRoute =
    request.nextUrl.pathname === '/interview'
    || request.nextUrl.pathname.startsWith('/interview/')

  // Public question collections do not need a server-side Auth round trip.
  // The browser client maintains its own session, while protected routes below
  // still refresh and validate Supabase Auth cookies as before.
  if (isPublicInterviewRoute) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
