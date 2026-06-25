import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

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
      coursewareName,
      coursewareUrl,
      contentHtml,
      contentMarkdown,
      videoId,
      videoUrl,
      duration,
      isFree,
      isLocked,
      sortOrder,
    } = body;

    if (!chapterId || !title || !title.trim()) {
      return NextResponse.json({ error: '章节ID和课时标题不能为空' }, { status: 400 });
    }

    const normalizedMarkdown = normalizeOptionalText(contentMarkdown);
    const normalizedHtml = normalizeOptionalText(contentHtml);
    const hasDocument = Boolean(normalizedMarkdown || normalizedHtml);
    const hasVideo = Boolean(videoId && videoUrl);

    if (!hasVideo && !hasDocument) {
      return NextResponse.json(
        { error: '请绑定视频，或填写课时讲义以创建纯文档课时' },
        { status: 400 },
      );
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
        description: normalizeOptionalText(description),
        courseware_name: normalizeOptionalText(coursewareName),
        courseware_url: normalizeOptionalText(coursewareUrl),
        content_html: normalizedHtml,
        content_markdown: normalizedMarkdown,
        video_id: hasVideo ? videoId : null,
        video_url: hasVideo ? videoUrl : null,
        duration: hasVideo ? durationInt : null,
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

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
      id,
      title,
      description,
      coursewareName,
      coursewareUrl,
      contentHtml,
      contentMarkdown,
      videoId,
      videoUrl,
      duration,
      isFree,
      isLocked,
      sortOrder,
    } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少课时 ID' }, { status: 400 });
    }

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: '课时标题不能为空' }, { status: 400 });
    }

    const normalizedMarkdown = normalizeOptionalText(contentMarkdown);
    const normalizedHtml = normalizeOptionalText(contentHtml);
    const hasDocument = Boolean(normalizedMarkdown || normalizedHtml);
    const hasVideoFields = 'videoId' in body || 'videoUrl' in body;
    const hasVideo = hasVideoFields
      ? Boolean(videoId && videoUrl)
      : undefined;

    if (hasVideoFields && !hasVideo && !hasDocument) {
      return NextResponse.json(
        { error: '请绑定视频，或保留课时讲义作为纯文档课时' },
        { status: 400 },
      );
    }

    let durationInt: number | null | undefined = undefined;
    if ('duration' in body) {
      durationInt = null;
      if (duration) {
        if (typeof duration === 'number') {
          durationInt = Math.round(duration);
        } else if (typeof duration === 'string') {
          const parsed = parseFloat(duration);
          if (!isNaN(parsed)) {
            durationInt = Math.round(parsed);
          }
        }
      }
    }

    const updatePayload: Record<string, unknown> = {
      title: String(title).trim(),
      description: normalizeOptionalText(description),
      courseware_name: normalizeOptionalText(coursewareName),
      courseware_url: normalizeOptionalText(coursewareUrl),
      content_html: normalizedHtml,
      content_markdown: normalizedMarkdown,
      is_free: Boolean(isFree),
      is_locked: typeof isLocked === 'boolean' ? isLocked : !Boolean(isFree),
      sort_order: typeof sortOrder === 'number' ? sortOrder : 0,
    };

    if (hasVideoFields) {
      updatePayload.video_id = hasVideo ? videoId : null;
      updatePayload.video_url = hasVideo ? videoUrl : null;
      updatePayload.duration = hasVideo ? durationInt ?? null : null;
    } else if ('duration' in body) {
      updatePayload.duration = durationInt ?? null;
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('lessons')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新课程视频失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lesson: data });
  } catch (error: any) {
    console.error('更新课程视频异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}
