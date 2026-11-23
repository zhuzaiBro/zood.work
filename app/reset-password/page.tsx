import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasRecentPasswordRecovery } from '@/lib/auth/recovery';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = { title: '设置新密码', robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: {
  searchParams: Promise<{ expired?: string }>
}) {
  const { expired } = await searchParams;
  const valid = !expired && await hasRecentPasswordRecovery((await createClient()).auth);
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">{valid ? '设置新密码' : '请重新申请重置链接'}</h1>
        {valid ? <ResetPasswordForm /> : <p className="mt-4 text-sm leading-6 text-slate-600">请在发起申请的浏览器中打开最新的重置邮件。链接过期或已经使用时，需要重新申请。</p>}
        <Link href="/forgot-password" className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:underline">重新申请邮件</Link>
      </section>
    </div>
  );
}
