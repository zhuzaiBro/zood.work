import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// 获取课程详情（包括章节和视频）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    console.log('获取课程详情, courseId:', courseId);

    if (!courseId) {
      return NextResponse.json({ error: '缺少课程ID' }, { status: 400 });
    }

    // 使用管理员客户端获取课程数据（绕过 RLS）
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (err: any) {
      console.error('创建管理员客户端失败:', err);
      return NextResponse.json({ 
        error: '服务器配置错误: ' + err.message 
      }, { status: 500 });
    }

    // 1. 获取课程信息
    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser();
    const viewerLoggedIn = Boolean(viewer);

    let isAdminViewer = false;
    let hasCourseAccess = Boolean(course.is_free);
    let accessSource: 'free' | 'admin' | 'enrollment' | 'none' = course.is_free
      ? 'free'
      : 'none';

    if (viewer) {
      const { data: viewerProfile } = await adminClient
        .from('user_profiles')
        .select('is_admin')
        .eq('id', viewer.id)
        .maybeSingle();

      isAdminViewer = Boolean(viewerProfile?.is_admin);

      if (!hasCourseAccess && !isAdminViewer) {
        const { data: enrollment, error: enrollmentError } = await adminClient
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', viewer.id)
          .eq('status', 'active')
          .maybeSingle();

        if (enrollmentError) {
          console.error('查询课程开通状态失败:', enrollmentError);
        }

        hasCourseAccess = Boolean(enrollment);
        if (hasCourseAccess) {
          accessSource = 'enrollment';
        }
      }
    }

    if (isAdminViewer) {
      hasCourseAccess = true;
      accessSource = 'admin';
    }

    // 2. 获取章节列表
    const { data: chapters, error: chaptersError } = await adminClient
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (chaptersError) {
      console.error('获取章节失败:', chaptersError);
      return NextResponse.json({ error: '获取章节失败' }, { status: 500 });
    }

    // 3. 获取所有章节的视频
    const chapterIds = chapters?.map(ch => ch.id) || [];
    let lessons: any[] = [];

    if (chapterIds.length > 0) {
      const { data: lessonsData, error: lessonsError } = await adminClient
        .from('lessons')
        .select('*')
        .in('chapter_id', chapterIds)
        .order('sort_order', { ascending: true });

      if (lessonsError) {
        console.error('获取视频失败:', lessonsError);
      } else {
        lessons = lessonsData || [];
      }
    }

    // 4. 组织数据结构
    const chaptersWithLessons = (chapters || []).map((chapter: any) => {
      const chapterLessons = lessons
        .filter((lesson: any) => lesson.chapter_id === chapter.id)
        .map((lesson: any) => {
          const isLessonFree = Boolean(lesson.is_free);
          const hasVideo = Boolean(lesson.video_id?.trim());
          const canWatchVideo =
            hasVideo && viewerLoggedIn && (hasCourseAccess || isLessonFree);
          const videoAccessReason = !hasVideo
            ? null
            : !viewerLoggedIn
              ? 'login'
              : canWatchVideo
                ? null
                : 'purchase';

          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            coursewareName: lesson.courseware_name,
            coursewareUrl: lesson.courseware_url,
            contentHtml: lesson.content_html,
            contentMarkdown: lesson.content_markdown,
            duration: lesson.duration ? formatDuration(lesson.duration) : undefined,
            durationSeconds: lesson.duration,
            isFree: isLessonFree,
            hasVideo,
            isLocked: hasVideo && !canWatchVideo,
            accessReason: videoAccessReason,
            videoUrl: canWatchVideo ? lesson.video_url : null,
            videoId: canWatchVideo ? lesson.video_id : null,
            sortOrder: lesson.sort_order,
          };
        });

      return {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        sortOrder: chapter.sort_order,
        lessons: chapterLessons,
      };
    });

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        coverImageUrl: course.cover_image_url,
        price: Number(course.price) || 0,
        isFree: course.is_free,
        hasAccess: hasCourseAccess,
        accessSource,
        status: course.status,
        createdAt: course.created_at,
      },
      chapters: chaptersWithLessons,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('获取课程详情异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}

const VALID_STATUSES = ['draft', 'published', 'archived'] as const;

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const { courseId } = await params;

    if (!courseId) {
      return NextResponse.json({ error: '缺少课程ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, price, isFree, title, description, coverImageUrl } = body;

    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      if (!title || !String(title).trim()) {
        return NextResponse.json({ error: '课程标题不能为空' }, { status: 400 });
      }
      updates.title = String(title).trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (coverImageUrl !== undefined) {
      updates.cover_image_url =
        typeof coverImageUrl === 'string' && coverImageUrl.trim()
          ? coverImageUrl.trim()
          : null;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: '无效的课程状态' }, { status: 400 });
      }
      updates.status = status;
    }

    if (isFree !== undefined) {
      updates.is_free = Boolean(isFree);
      if (isFree) {
        updates.price = 0;
      }
    }

    if (price !== undefined && !updates.is_free) {
      const priceNum = Number(price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        return NextResponse.json({ error: '价格不能为负数' }, { status: 400 });
      }
      updates.price = priceNum;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('更新课程失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    return NextResponse.json({
      course: {
        id: data.id,
        title: data.title,
        description: data.description,
        coverImageUrl: data.cover_image_url,
        price: Number(data.price) || 0,
        isFree: data.is_free,
        status: data.status,
        createdAt: data.created_at,
      },
    });
  } catch (error: unknown) {
    console.error('更新课程异常:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 格式化时长（秒转 MM:SS 或 HH:MM:SS）
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
