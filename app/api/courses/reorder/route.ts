import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: '未授权' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile || !(profile as { is_admin?: boolean }).is_admin) {
    return { error: NextResponse.json({ error: '权限不足' }, { status: 403 }) };
  }

  return { user };
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const body = await request.json();
    const { orderedCourseIds } = body as { orderedCourseIds?: string[] };

    if (!Array.isArray(orderedCourseIds) || orderedCourseIds.length === 0) {
      return NextResponse.json({ error: '缺少课程排序列表' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: existingCourses, error: fetchError } = await adminClient
      .from('courses')
      .select('id');

    if (fetchError) {
      console.error('查询课程失败:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingIds = new Set((existingCourses || []).map((item) => item.id));
    const uniqueIds = [...new Set(orderedCourseIds)];

    if (uniqueIds.length !== existingIds.size) {
      return NextResponse.json({ error: '课程列表不完整' }, { status: 400 });
    }

    for (const id of uniqueIds) {
      if (!existingIds.has(id)) {
        return NextResponse.json({ error: '包含无效的课程 ID' }, { status: 400 });
      }
    }

    const updates = uniqueIds.map((id, index) =>
      adminClient.from('courses').update({ sort_order: index }).eq('id', id),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      console.error('更新课程排序失败:', failed.error);
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('课程排序异常:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
