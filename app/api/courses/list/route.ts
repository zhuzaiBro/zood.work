import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// 获取课程列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 可选，如果不指定则获取所有课程

    console.log('获取课程列表, status:', status);

    // 使用管理员客户端获取课程列表（绕过 RLS）
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (err: any) {
      console.error('创建管理员客户端失败:', err);
      return NextResponse.json({ 
        error: '服务器配置错误: ' + err.message 
      }, { status: 500 });
    }
    
    let query = adminClient
      .from('courses')
      .select('*');
    
    // 如果指定了 status，则过滤
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取课程列表失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('获取到课程数量:', data?.length || 0);

    const courses = (data || []).map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      coverImageUrl: course.cover_image_url,
      price: course.price,
      isFree: course.is_free,
      status: course.status,
      createdAt: course.created_at,
    }));

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error('获取课程列表异常:', error);
    return NextResponse.json({ 
      error: error.message || '服务器错误',
      details: error.stack 
    }, { status: 500 });
  }
}
