import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const VALID_STATUSES = ['pending', 'contacted', 'paid', 'closed'] as const;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: '未登录' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile || !(profile as { is_admin?: boolean }).is_admin) {
    return { error: NextResponse.json({ error: '无权访问' }, { status: 403 }) };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const adminClient = createAdminClient();
    const { data, error } = await (adminClient as any)
      .from('membership_consultation_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载会员咨询失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const body = await request.json();
    const id = Number(body.id);
    const status = typeof body.status === 'string' ? body.status : '';
    const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() : null;

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: '无效的咨询 ID' }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: '无效的处理状态' }, { status: 400 });
    }

    const updates: Record<string, string | null> = {
      status,
      admin_note: adminNote,
    };

    if (status === 'contacted') {
      updates.contacted_at = new Date().toISOString();
    }

    if (status === 'paid') {
      updates.paid_at = new Date().toISOString();
    }

    const adminClient = createAdminClient();
    const { data, error } = await (adminClient as any)
      .from('membership_consultation_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新会员咨询失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
