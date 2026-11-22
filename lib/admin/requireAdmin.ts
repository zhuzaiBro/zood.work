import { NextResponse } from 'next/server';
import { platformServer, PlatformError } from '@/lib/platform/server';

export async function requireAdminRequest() {
  try {
    const { profile } = await platformServer<{ profile: { id: string; is_admin?: boolean | null } | null }>(
      '/api/platform/me/profile',
    );

    if (!profile?.is_admin) {
      return {
        response: NextResponse.json({ error: '无权访问' }, { status: 403 }),
      };
    }

    return { user: { id: profile.id } };
  } catch (error) {
    if (error instanceof PlatformError && error.status === 401) {
      return {
        response: NextResponse.json({ error: '未登录' }, { status: 401 }),
      };
    }
    if (error instanceof PlatformError && (error.status === 403 || error.status === 404)) {
      return {
        response: NextResponse.json({ error: '无权访问' }, { status: 403 }),
      };
    }
    const message = error instanceof Error ? error.message : '服务器错误';
    return {
      response: NextResponse.json({ error: message }, { status: 500 }),
    };
  }
}
