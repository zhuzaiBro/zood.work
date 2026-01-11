import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// 获取课程详情（包括章节和视频）
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Next.js 15+ params 是 Promise，需要 await
    const resolvedParams = params instanceof Promise ? await params : params;
    const { courseId } = resolvedParams;
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
        .map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration ? formatDuration(lesson.duration) : undefined,
          durationSeconds: lesson.duration,
          isFree: lesson.is_free,
          isLocked: lesson.is_locked,
          videoUrl: lesson.video_url,
          videoId: lesson.video_id,
          sortOrder: lesson.sort_order,
        }));

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
        price: course.price,
        isFree: course.is_free,
        status: course.status,
        createdAt: course.created_at,
      },
      chapters: chaptersWithLessons,
    });
  } catch (error: any) {
    console.error('获取课程详情异常:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
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
