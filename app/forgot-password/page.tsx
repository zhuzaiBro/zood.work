'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', '/reset-password');
      const result = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: callback.href });
      if (result.error) {
        setError(result.error.status === 429 ? '请求过于频繁，请稍后再试。' : '重置邮件暂时无法发送，请稍后重试。');
      } else {
        setSent(true);
      }
    } catch {
      setError('连接失败，请检查网络后重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">{sent ? '请查收邮件' : '找回密码'}</h1>
        {sent ? (
          <div role="status" className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>如果 <strong className="break-all text-slate-900">{email.trim()}</strong> 已注册，你会收到密码重置邮件。</p>
            <p>请用发起申请的浏览器打开邮件链接。未收到时，可先检查垃圾邮件。</p>
            <button type="button" onClick={() => setSent(false)} className="font-semibold text-blue-700 hover:underline">重新申请</button>
          </div>
        ) : (
          <form onSubmit={requestReset} className="mt-4 space-y-4">
            <p className="text-sm leading-6 text-slate-600">输入注册时使用的邮箱，我们会发送一封密码重置邮件。</p>
            <label className="block text-sm font-semibold" htmlFor="recovery-email">注册邮箱</label>
            <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="block h-11 w-full rounded-lg border border-slate-300 px-3 text-base outline-blue-500" />
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? '发送中…' : '发送重置邮件'}</button>
          </form>
        )}
        <Link href="/login" className="mt-5 inline-block text-sm text-slate-600 hover:text-blue-700 hover:underline">返回登录</Link>
      </section>
    </div>
  );
}
