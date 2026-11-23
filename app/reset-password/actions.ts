'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasRecentPasswordRecovery } from '@/lib/auth/recovery';

export async function updatePassword(_previous: string, form: FormData): Promise<string> {
  const password = form.get('password');
  if (typeof password !== 'string' || password.length < 6) return '新密码至少需要 6 个字符。';
  if (password !== form.get('confirm')) return '两次输入的密码不一致，请重新确认。';

  const auth = (await createClient()).auth;
  if (!await hasRecentPasswordRecovery(auth)) return '重置链接已失效，请重新申请邮件。';

  const { error } = await auth.updateUser({ password });
  if (error) {
    if (error.code === 'same_password') return '新密码不能与原密码相同。';
    if (error.code === 'weak_password') return '新密码强度不足，请换用更长且包含多种字符的密码。';
    return '密码更新失败，请重新申请邮件后再试。';
  }
  await auth.signOut({ scope: 'local' });
  redirect('/login?reset=success');
}
