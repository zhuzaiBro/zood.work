import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams,  } = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 返回用户到错误页面，并添加错误描述
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

