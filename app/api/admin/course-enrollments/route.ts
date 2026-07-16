import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type UserProfile = Pick<
  Database['public']['Tables']['user_profiles']['Row'],
  'id' | 'username' | 'display_name' | 'avatar_url' | 'vip_level' | 'is_admin' | 'created_at'
>;
type CourseEnrollment = Database['public']['Tables']['course_enrollments']['Row'];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: '未登录' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single<Pick<UserProfile, 'is_admin'>>();

  if (profileError || !profile?.is_admin) {
    return { error: NextResponse.json({ error: '无权访问' }, { status: 403 }) };
  }

  return { user };
}

function serializeEnrollment(enrollment: CourseEnrollment | null) {
  if (!enrollment) return null;

  return {
    id: enrollment.id,
    courseId: enrollment.course_id,
    userId: enrollment.user_id,
    source: enrollment.source,
    status: enrollment.status,
    grantedBy: enrollment.granted_by,
    grantedAt: enrollment.granted_at,
    revokedBy: enrollment.revoked_by,
    revokedAt: enrollment.revoked_at,
    expiresAt: enrollment.expires_at,
    note: enrollment.note,
    createdAt: enrollment.created_at,
    updatedAt: enrollment.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: '缺少课程ID' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const [profilesResult, enrollmentsResult] = await Promise.all([
      adminClient
        .from('user_profiles')
        .select('id, username, display_name, avatar_url, vip_level, is_admin, created_at')
        .order('created_at', { ascending: false }),
      adminClient
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false }),
    ]);

    const { data: profiles, error: profilesError } = profilesResult;

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const { data: enrollments, error: enrollmentError } = enrollmentsResult;

    if (enrollmentError) {
      return NextResponse.json({ error: enrollmentError.message }, { status: 500 });
    }

    const enrollmentsByUserId = new Map<string, CourseEnrollment>();
    for (const enrollment of enrollments ?? []) {
      enrollmentsByUserId.set(enrollment.user_id, enrollment);
    }

    const users = (profiles ?? [])
      .map((profile: UserProfile) => {
        const enrollment = enrollmentsByUserId.get(profile.id) ?? null;
        return {
          id: profile.id,
          email: null,
          phone: null,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          provider: null,
          providers: [],
          isAdmin: Boolean(profile.is_admin),
          vipLevel: profile.vip_level,
          hasProfile: true,
          createdAt: profile.created_at,
          lastSignInAt: null,
          enrollment: serializeEnrollment(enrollment),
        };
      })
      .sort((a, b) => {
        const aActive = a.enrollment?.status === 'active' ? 1 : 0;
        const bActive = b.enrollment?.status === 'active' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;

        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      });

    return NextResponse.json({
      course,
      users,
      summary: {
        userCount: users.length,
        activeCount: users.filter((item) => item.enrollment?.status === 'active').length,
        revokedCount: users.filter((item) => item.enrollment?.status === 'revoked').length,
      },
      source: 'supabase-database',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const body = await request.json();
    const courseId = String(body.courseId ?? '').trim();
    const userId = String(body.userId ?? '').trim();
    const note = typeof body.note === 'string' ? body.note.trim() : null;

    if (!courseId || !userId) {
      return NextResponse.json({ error: '缺少课程ID或用户ID' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (targetProfileError) {
      return NextResponse.json({ error: targetProfileError.message }, { status: 500 });
    }

    if (!targetProfile) {
      return NextResponse.json(
        { error: '该用户还没有站内资料，请让用户先登录一次后再开通' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await adminClient
      .from('course_enrollments')
      .upsert(
        {
          course_id: courseId,
          user_id: userId,
          source: 'manual',
          status: 'active',
          granted_by: auth.user.id,
          granted_at: now,
          revoked_by: null,
          revoked_at: null,
          note,
        },
        { onConflict: 'course_id,user_id' },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ enrollment: serializeEnrollment(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const body = await request.json();
    const courseId = String(body.courseId ?? '').trim();
    const userId = String(body.userId ?? '').trim();
    const status = String(body.status ?? '').trim();

    if (!courseId || !userId) {
      return NextResponse.json({ error: '缺少课程ID或用户ID' }, { status: 400 });
    }

    if (!['active', 'revoked'].includes(status)) {
      return NextResponse.json({ error: '无效的授权状态' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updates: Database['public']['Tables']['course_enrollments']['Update'] =
      status === 'active'
        ? {
          status,
          granted_by: auth.user.id,
          granted_at: now,
          revoked_by: null,
          revoked_at: null,
        }
        : {
          status,
          revoked_by: auth.user.id,
          revoked_at: now,
        };

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('course_enrollments')
      .update(updates)
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ enrollment: serializeEnrollment(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
