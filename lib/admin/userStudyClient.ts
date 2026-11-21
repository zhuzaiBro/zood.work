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

export interface AdminUsersPage {
  page: number;
  pageSize: number;
  total: number;
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
  page: AdminUsersPage;
  ranges: {
    today: { label: string; start: string; end: string };
    yesterday: { label: string; start: string; end: string };
  };
}

export type AdminUserSort = 'created_at' | 'today' | 'yesterday' | 'total' | 'videos';

export interface AdminUserListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: AdminUserSort;
  order?: 'asc' | 'desc';
}

export function adminUserListQuery(query: AdminUserListQuery = {}) {
  const params = new URLSearchParams();
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 50) : 12;
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  const keyword = query.q?.trim();
  if (keyword) params.set('q', keyword);
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);
  return params.toString();
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
  query: AdminUserListQuery = {},
): Promise<AdminUsersResponse> {
  const response = await fetch(`/api/admin/users?${adminUserListQuery(query)}`, { cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { error?: string }).error || '加载用户学习统计失败');
  }
  return body as AdminUsersResponse;
}
