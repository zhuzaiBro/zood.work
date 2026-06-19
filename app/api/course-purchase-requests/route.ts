import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

function normalizeRequiredText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const courseId = normalizeRequiredText(body.courseId);
    const phone = normalizeRequiredText(body.phone);
    const wechat = normalizeRequiredText(body.wechat);
    const note = normalizeRequiredText(body.note) || null;

    if (!courseId) {
      return NextResponse.json({ error: '缺少课程 ID' }, { status: 400 });
    }

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

    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('id, title, price, is_free')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    if ((course as { is_free?: boolean }).is_free) {
      return NextResponse.json({ error: '免费课程无需购买' }, { status: 400 });
    }

    const { data, error } = await (adminClient as any)
      .from('course_purchase_requests')
      .insert({
        course_id: courseId,
        course_title: (course as { title?: string }).title ?? null,
        course_price: Number((course as { price?: number }).price ?? 0),
        user_id: profileUserId,
        phone,
        wechat,
        note,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '提交购买意向失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
