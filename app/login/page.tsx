import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/LoginForm'

export const metadata = {
  title: '登录 - zood的小破站',
  description: '登录到你的账户',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { redirect: redirectTarget } = await searchParams
  const safeRedirectTarget =
    redirectTarget && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
      ? redirectTarget
      : '/'

  // 如果已登录，重定向到首页
  if (user) {
    redirect(safeRedirectTarget)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">登录</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
