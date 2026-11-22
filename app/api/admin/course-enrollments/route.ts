import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin/requireAdmin';
import { platformServer, PlatformError } from '@/lib/platform/server';

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  vip_level?: number | null;
};

type EnrollmentRow = {
  id: number;
  course_id: string;
  user_id: string;
  source: string;
  status: string;
  granted_by?: string | null;
  granted_at: string;
  revoked_by?: string | null;
  revoked_at?: string | null;
  expires_at?: string | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
};

function serializeEnrollment(enrollment: EnrollmentRow | null) {
  if (!enrollment) return null;

  return {
    id: enrollment.id,
    courseId: enrollment.course_id,
    userId: enrollment.user_id,
    source: enrollment.source,
    status: enrollment.status,
    grantedBy: enrollment.granted_by ?? null,
    grantedAt: enrollment.granted_at,
    revokedBy: enrollment.revoked_by ?? null,
    revokedAt: enrollment.revoked_at ?? null,
    expiresAt: enrollment.expires_at ?? null,
    note: enrollment.note ?? null,
    createdAt: enrollment.created_at,
    updatedAt: enrollment.updated_at,
  };
}

function platformFailure(error: unknown) {
  if (error instanceof PlatformError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : '服务器错误';
  return NextResponse.json({ error: message }, { status: 500 });
}

async function loadAccess(courseId: string) {
  return platformServer<{ profiles: ProfileRow[] | null; enrollments: EnrollmentRow[] | null }>(
    `/api/platform/admin/courses/${courseId}/access`,
  );
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRequest();
    if ('response' in auth) return auth.response;

    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: '缺少课程ID' }, { status: 400 });
    }

    let detail: { course?: { id: string; title: string } | null };
    try {
      detail = await platformServer<{ course?: { id: string; title: string } | null }>(
        `/api/platform/courses/${courseId}`,
      );
    } catch (error) {
      if (error instanceof PlatformError && error.status === 404) {
        return NextResponse.json({ error: '课程不存在' }, { status: 404 });
      }
      throw error;
    }

    if (!detail.course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const access = await loadAccess(courseId);
    const enrollmentsByUserId = new Map<string, EnrollmentRow>();
    for (const enrollment of access.enrollments ?? []) {
      enrollmentsByUserId.set(enrollment.user_id, enrollment);
    }

    const users = (access.profiles ?? [])
      .map((profile) => {
        const enrollment = enrollmentsByUserId.get(profile.id) ?? null;
        return {
          id: profile.id,
          email: null,
          phone: null,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          provider: null,
          providers: [] as string[],
          isAdmin: Boolean(profile.is_admin),
          vipLevel: profile.vip_level ?? null,
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
      course: { id: detail.course.id, title: detail.course.title },
      users,
      summary: {
        userCount: users.length,
        activeCount: users.filter((item) => item.enrollment?.status === 'active').length,
        revokedCount: users.filter((item) => item.enrollment?.status === 'revoked').length,
      },
      source: 'platform-api',
    });
  } catch (error) {
    return platformFailure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRequest();
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const courseId = String(body.courseId ?? '').trim();
    const userId = String(body.userId ?? '').trim();

    if (!courseId || !userId) {
      return NextResponse.json({ error: '缺少课程ID或用户ID' }, { status: 400 });
    }

    try {
      await platformServer(`/api/platform/courses/${courseId}`);
    } catch (error) {
      if (error instanceof PlatformError && error.status === 404) {
        return NextResponse.json({ error: '课程不存在' }, { status: 404 });
      }
      throw error;
    }

    const before = await loadAccess(courseId);
    if (!(before.profiles ?? []).some((profile) => profile.id === userId)) {
      return NextResponse.json(
        { error: '该用户还没有站内资料，请让用户先登录一次后再开通' },
        { status: 400 },
      );
    }

    // Access grant accepts { userId }. The platform API does not store an enrollment note.
    await platformServer(`/api/platform/admin/courses/${courseId}/access`, {
      method: 'POST',
      body: { userId },
    });

    const access = await loadAccess(courseId);
    const enrollment = (access.enrollments ?? []).find((item) => item.user_id === userId) ?? null;
    return NextResponse.json({ enrollment: serializeEnrollment(enrollment) });
  } catch (error) {
    return platformFailure(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminRequest();
    if ('response' in auth) return auth.response;

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

    if (status === 'active') {
      await platformServer(`/api/platform/admin/courses/${courseId}/access`, {
        method: 'POST',
        body: { userId },
      });
    } else {
      await platformServer(`/api/platform/admin/courses/${courseId}/access/${userId}`, {
        method: 'DELETE',
      });
    }

    const access = await loadAccess(courseId);
    const enrollment = (access.enrollments ?? []).find((item) => item.user_id === userId) ?? null;
    return NextResponse.json({ enrollment: serializeEnrollment(enrollment) });
  } catch (error) {
    return platformFailure(error);
  }
}
