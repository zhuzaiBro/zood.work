'use client';

import { useActionState } from 'react';
import { updatePassword } from './actions';

export default function ResetPasswordForm() {
  const [error, submit, pending] = useActionState(updatePassword, '');
  return (
    <form action={submit} className="mt-5 space-y-4">
      <label className="block text-sm font-semibold">新密码
        <input name="password" type="password" autoComplete="new-password" required minLength={6} className="mt-2 block h-11 w-full rounded-lg border border-slate-300 px-3 text-base font-normal outline-blue-500" />
      </label>
      <label className="block text-sm font-semibold">确认新密码
        <input name="confirm" type="password" autoComplete="new-password" required minLength={6} className="mt-2 block h-11 w-full rounded-lg border border-slate-300 px-3 text-base font-normal outline-blue-500" />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{pending ? '保存中…' : '保存新密码'}</button>
    </form>
  );
}
