import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// 创建课程视频
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
    const {
      chapterId,
      title,
      description,
      videoId,
      videoUrl,
      duration,
      isFree,
      isLocked,
      sortOrder,
    } = body;

    if (!chapterId || !title || !title.trim()) {
      return NextResponse.json({ error: '章节ID和视频标题不能为空' }, { status: 400 });
    }

    if (!videoId || !videoUrl) {
      return NextResponse.json({ error: '视频ID和URL不能为空' }, { status: 400 });
    }

    // 转换 duration 为整数（秒）
    let durationInt: number | null = null;
    if (duration) {
      // 如果 duration 是数字，转换为整数
      if (typeof duration === 'number') {
        durationInt = Math.round(duration);
      } else if (typeof duration === 'string') {
        // 如果是字符串，尝试解析
        const parsed = parseFloat(duration);
        if (!isNaN(parsed)) {
          durationInt = Math.round(parsed);
        }
      }
    }

    // 使用管理员客户端创建课程视频（绕过 RLS）
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('lessons')
      .insert({
        chapter_id: chapterId,
        title: title.trim(),
        description: description?.trim() || null,
        video_id: videoId,
        video_url: videoUrl,
        duration: durationInt,
        is_free: isFree || false,
        is_locked: isLocked !== undefined ? isLocked : !isFree,
        sort_order: sortOrder || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('创建课程视频失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lesson: data });
  } catch (error: any) {
    console.error('创建课程视频异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}
