import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// 获取章节列表
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: '缺少 courseId 参数' }, { status: 400 });
    }

    // 使用管理员客户端获取章节（绕过 RLS）
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('获取章节列表失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chapters: data || [] });
  } catch (error: any) {
    console.error('获取章节列表异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}

// 创建章节
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查管理员权限
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !(profile as any).is_admin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, title, description, sortOrder } = body;

    if (!courseId || !title || !title.trim()) {
      return NextResponse.json({ error: '课程ID和章节标题不能为空' }, { status: 400 });
    }

    // 使用管理员客户端创建章节（绕过 RLS）
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('chapters')
      .insert({
        course_id: courseId,
        title: title.trim(),
        description: description?.trim() || null,
        sort_order: sortOrder || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('创建章节失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chapter: data });
  } catch (error: any) {
    console.error('创建章节异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}

// 更新章节
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查管理员权限
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !(profile as any).is_admin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, sortOrder } = body;

    if (!id || !title || !title.trim()) {
      return NextResponse.json({ error: '章节ID和标题不能为空' }, { status: 400 });
    }

    // 使用管理员客户端更新章节（绕过 RLS）
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('chapters')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        sort_order: sortOrder,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新章节失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chapter: data });
  } catch (error: any) {
    console.error('更新章节异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}

// 删除章节
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查管理员权限
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !(profile as any).is_admin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少章节ID' }, { status: 400 });
    }

    // 使用管理员客户端删除章节（绕过 RLS）
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('chapters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除章节失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除章节异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}
