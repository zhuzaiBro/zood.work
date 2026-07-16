import type { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type BrowserSupabaseClient = ReturnType<typeof createClient>;
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
  supabase: BrowserSupabaseClient,
): Promise<AdminUsersResponse> {
  const today = getShanghaiDayRange(0);
  const yesterday = getShanghaiDayRange(-1);
  const [profilesResult, logsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, username, display_name, avatar_url, vip_level, is_admin, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('video_access_logs')
      .select('user_id, video_id, watch_seconds, created_at')
      .gte('created_at', yesterday.start.toISOString())
      .lt('created_at', today.end.toISOString())
      .order('created_at', { ascending: false }),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (logsResult.error) throw logsResult.error;

  const statsByUser = new Map<string, {
    today: number;
    yesterday: number;
    recentAt: string | null;
    videoIds: Set<string>;
  }>();

  for (const log of (logsResult.data ?? []) as VideoAccessLog[]) {
    const stats = statsByUser.get(log.user_id) ?? {
      today: 0,
      yesterday: 0,
      recentAt: null,
      videoIds: new Set<string>(),
    };
    const seconds = Math.max(0, log.watch_seconds ?? 0);
    const createdAt = log.created_at ? new Date(log.created_at) : null;

    if (createdAt && createdAt >= today.start && createdAt < today.end) {
      stats.today += seconds;
    } else {
      stats.yesterday += seconds;
    }
    if (log.video_id) stats.videoIds.add(log.video_id);
    if (log.created_at && (!stats.recentAt || log.created_at > stats.recentAt)) {
      stats.recentAt = log.created_at;
    }
    statsByUser.set(log.user_id, stats);
  }

  const profiles = (profilesResult.data ?? []) as UserProfileSummary[];
  const users: AdminUserStudyRow[] = profiles.map((profile) => {
    const stats = statsByUser.get(profile.id) ?? {
      today: 0,
      yesterday: 0,
      recentAt: null,
      videoIds: new Set<string>(),
    };

    return {
      id: profile.id,
      email: null,
      phone: null,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      provider: null,
      providers: [],
      role: null,
      emailConfirmedAt: null,
      phoneConfirmedAt: null,
      lastSignInAt: null,
      isSsoUser: false,
      isAnonymous: false,
      hasProfile: true,
      vipLevel: profile.vip_level,
      isAdmin: Boolean(profile.is_admin),
      createdAt: profile.created_at,
      todayStudySeconds: stats.today,
      yesterdayStudySeconds: stats.yesterday,
      totalStudySeconds: stats.today + stats.yesterday,
      uniqueVideoCount: stats.videoIds.size,
      recentStudyAt: stats.recentAt,
    };
  }).sort((a, b) =>
    b.todayStudySeconds - a.todayStudySeconds
    || b.yesterdayStudySeconds - a.yesterdayStudySeconds
    || (b.recentStudyAt ?? '').localeCompare(a.recentStudyAt ?? '')
    || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  );

  return {
    users,
    summary: {
      userCount: users.length,
      missingProfileCount: 0,
      activeTodayCount: users.filter((item) => item.todayStudySeconds > 0).length,
      activeYesterdayCount: users.filter((item) => item.yesterdayStudySeconds > 0).length,
      todayStudySeconds: users.reduce((sum, item) => sum + item.todayStudySeconds, 0),
      yesterdayStudySeconds: users.reduce((sum, item) => sum + item.yesterdayStudySeconds, 0),
    },
    ranges: {
      today: {
        label: today.label,
        start: today.start.toISOString(),
        end: today.end.toISOString(),
      },
      yesterday: {
        label: yesterday.label,
        start: yesterday.start.toISOString(),
        end: yesterday.end.toISOString(),
      },
    },
  };
}
