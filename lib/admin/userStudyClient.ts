import type { Database } from '@/types/database.types';
type VideoAccessLog = Pick<
  Database['public']['Tables']['video_access_logs']['Row'],
  'user_id' | 'video_id' | 'watch_seconds' | 'created_at'
>;
type UserProfileSummary = Pick<
  Database['public']['Tables']['user_profiles']['Row'],
  'id' | 'username' | 'display_name' | 'avatar_url' | 'vip_level' | 'is_admin' | 'created_at'
>;

export interface AdminUserStudyRow {
  id: string;
  email: string | null;
  phone: string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  provider: string | null;
  providers: string[];
  role: string | null;
  emailConfirmedAt: string | null;
  phoneConfirmedAt: string | null;
  lastSignInAt: string | null;
  isSsoUser: boolean;
  isAnonymous: boolean;
  hasProfile: boolean;
  vipLevel: number | null;
  isAdmin: boolean;
  createdAt: string | null;
  todayStudySeconds: number;
  yesterdayStudySeconds: number;
  totalStudySeconds: number;
  uniqueVideoCount: number;
  recentStudyAt: string | null;
}

export interface AdminUsersResponse {
  users: AdminUserStudyRow[];
  summary: {
    userCount: number;
    missingProfileCount: number;
    activeTodayCount: number;
    activeYesterdayCount: number;
    todayStudySeconds: number;
    yesterdayStudySeconds: number;
  };
  ranges: {
    today: { label: string; start: string; end: string };
    yesterday: { label: string; start: string; end: string };
  };
}

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

function getShanghaiDayRange(dayOffset: number) {
  const now = new Date();
  const shanghaiNow = new Date(now.getTime() + SHANGHAI_OFFSET_MS);
  const startMs = Date.UTC(
    shanghaiNow.getUTCFullYear(),
    shanghaiNow.getUTCMonth(),
    shanghaiNow.getUTCDate() + dayOffset,
  ) - SHANGHAI_OFFSET_MS;
  const endMs = startMs + 24 * 60 * 60 * 1000;

  return {
    start: new Date(startMs),
    end: new Date(endMs),
    label: new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(startMs)),
  };
}

export async function loadAdminUserStudyData(
  _unused?: unknown,
): Promise<AdminUsersResponse> {
  const response = await fetch('/api/admin/users', { cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { error?: string }).error || '加载用户学习统计失败');
  }
  return body as AdminUsersResponse;
}
