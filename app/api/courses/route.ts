import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// 获取课程列表
export async function GET(request: NextRequest) {
  try {
    // const supabase = await createClient();
    // const { data: { user } } = await supabase.auth.getUser();

    // if (!user) {
      // return NextResponse.json({ error: '未授权' }, { status: 401 });
    // }
    console.log('获取课程列表');
    // 使用管理员客户端获取所有课程（绕过 RLS）
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('courses')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取课程列表失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ courses: data || [] });
  } catch (error: any) {
    console.error('获取课程列表异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}

// 创建课程
export async function POST(request: NextRequest) {
  try {
    console.log('创建课程');

    const body = await request.json();
    const { title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: '课程标题不能为空' }, { status: 400 });
    }

    // 使用管理员客户端创建课程（绕过 RLS）
    const adminClient = createAdminClient();

    const { count, error: countError } = await adminClient
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('查询课程数量失败:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const { data, error } = await adminClient
      .from('courses')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        sort_order: count ?? 0,
        // created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('创建课程失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ course: data });
  } catch (error: any) {
    console.error('创建课程异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}
