import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const MEMBERSHIP_PLAN_PRICE = 129;

function normalizeRequiredText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizeRequiredText(body.phone);
    const wechat = normalizeRequiredText(body.wechat);
    const note = normalizeRequiredText(body.note) || null;
    const source = normalizeRequiredText(body.source) || null;

    if (!phone) {
      return NextResponse.json({ error: '请填写手机号' }, { status: 400 });
    }

    if (!wechat) {
      return NextResponse.json({ error: '请填写微信号' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminClient = createAdminClient();
    let profileUserId: string | null = null;

    if (user?.id) {
      const { data: profile } = await (adminClient as any)
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      profileUserId = profile?.id ?? null;
    }

    const { data, error } = await (adminClient as any)
      .from('membership_consultation_requests')
      .insert({
        user_id: profileUserId,
        phone,
        wechat,
        note,
        source,
        plan_price: MEMBERSHIP_PLAN_PRICE,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '提交会员咨询失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
