import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type LessonProgressInsert = Database['public']['Tables']['lesson_progress']['Insert'];

function normalizeSeconds(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function calcProgressPercent(currentSeconds: number, durationSeconds: number | null) {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  return Math.min(100, Math.max(0, Number(((currentSeconds / durationSeconds) * 100).toFixed(2))));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ progress: null, progresses: [] });
    }

    const db = supabase as any;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    let query = db
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (lessonId) {
      query = query.eq('lesson_id', lessonId).limit(1);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      progress: lessonId ? data?.[0] ?? null : data?.[0] ?? null,
      progresses: data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const db = supabase as any;
    const body = await request.json();
    const lessonId = typeof body.lessonId === 'string' ? body.lessonId : '';
    const courseId = typeof body.courseId === 'string' ? body.courseId : null;
    const videoId = typeof body.videoId === 'string' ? body.videoId : null;
    const currentSeconds = normalizeSeconds(body.currentSeconds);
    const durationSeconds = body.durationSeconds
      ? normalizeSeconds(body.durationSeconds)
      : null;
    const watchSeconds = normalizeSeconds(body.watchSeconds);
    const segmentName = typeof body.segmentName === 'string' ? body.segmentName : null;
    const progressPercent = calcProgressPercent(currentSeconds, durationSeconds);
    const isCompleted = Boolean(durationSeconds && durationSeconds > 0 && progressPercent >= 95);

    if (!lessonId) {
      return NextResponse.json({ error: '缺少 lessonId' }, { status: 400 });
    }

    const payload: LessonProgressInsert = {
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      video_id: videoId,
      current_seconds: currentSeconds,
      duration_seconds: durationSeconds,
      progress_percent: progressPercent,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      last_watched_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('lesson_progress')
      .upsert(payload, { onConflict: 'user_id,lesson_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (watchSeconds > 0 && videoId) {
      const { error: logError } = await db
        .from('video_access_logs')
        .insert({
          user_id: user.id,
          video_id: videoId,
          segment_name: segmentName,
          watch_seconds: watchSeconds,
        });

      if (logError) {
        console.warn('写入视频访问日志失败:', logError);
      }
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
