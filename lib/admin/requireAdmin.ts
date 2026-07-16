import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function requireAdminRequest() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json({ error: '未登录' }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const adminProfile = profile as { is_admin?: boolean | null } | null;

  if (profileError || !adminProfile?.is_admin) {
    return {
      response: NextResponse.json({ error: '无权访问' }, { status: 403 }),
    };
  }

  return { supabase, user };
}
