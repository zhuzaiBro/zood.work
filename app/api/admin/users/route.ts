import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';
import type { AuthUser } from '@supabase/supabase-js';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type VideoAccessLog = Pick<
  Database['public']['Tables']['video_access_logs']['Row'],
  'user_id' | 'video_id' | 'watch_seconds' | 'created_at'
>;

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

interface DayRange {
  start: Date;
  end: Date;
  label: string;
}

interface UserStudyAccumulator {
  todayStudySeconds: number;
  yesterdayStudySeconds: number;
  recentStudyAt: string | null;
  videoIds: Set<string>;
}

async function listAllAuthUsers(adminClient: ReturnType<typeof createAdminClient>) {
  const users: AuthUser[] = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    users.push(...data.users);

    if (!data.nextPage || data.users.length === 0) {
      break;
    }

    page = data.nextPage;
  }

  return users;
}

function getAuthDisplayName(user: AuthUser) {
  return (
    user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.user_metadata?.user_name
    || user.user_metadata?.preferred_username
    || user.email
    || user.phone
    || user.id
  );
}

function getAuthAvatarUrl(user: AuthUser) {
  return (
    user.user_metadata?.avatar_url
    || user.user_metadata?.picture
    || null
  );
}

function getShanghaiDayRange(dayOffset: number): DayRange {
  const now = new Date();
  const shanghaiNow = new Date(now.getTime() + SHANGHAI_OFFSET_MS);
  const year = shanghaiNow.getUTCFullYear();
  const month = shanghaiNow.getUTCMonth();
  const date = shanghaiNow.getUTCDate() + dayOffset;

  const startMs = Date.UTC(year, month, date, 0, 0, 0) - SHANGHAI_OFFSET_MS;
  const endMs = startMs + 24 * 60 * 60 * 1000;
  const label = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startMs));

  return {
    start: new Date(startMs),
    end: new Date(endMs),
    label,
  };
}

function emptyAccumulator(): UserStudyAccumulator {
  return {
    todayStudySeconds: 0,
    yesterdayStudySeconds: 0,
    recentStudyAt: null,
    videoIds: new Set<string>(),
  };
}

function addLogToAccumulator(
  accumulator: UserStudyAccumulator,
  log: VideoAccessLog,
  today: DayRange,
) {
  const seconds = Math.max(0, log.watch_seconds ?? 0);
  const createdAt = log.created_at ? new Date(log.created_at) : null;

  if (createdAt && createdAt >= today.start && createdAt < today.end) {
    accumulator.todayStudySeconds += seconds;
  } else {
    accumulator.yesterdayStudySeconds += seconds;
  }

  if (log.video_id) {
    accumulator.videoIds.add(log.video_id);
  }

  if (
    log.created_at
    && (!accumulator.recentStudyAt || log.created_at > accumulator.recentStudyAt)
  ) {
    accumulator.recentStudyAt = log.created_at;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single<Pick<UserProfile, 'is_admin'>>();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    const today = getShanghaiDayRange(0);
    const yesterday = getShanghaiDayRange(-1);
    const adminClient = createAdminClient();
    const authUsers = await listAllAuthUsers(adminClient);

    const { data: profiles, error: profilesError } = await adminClient
      .from('user_profiles')
      .select('id, username, display_name, avatar_url, vip_level, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const { data: logs, error: logsError } = await adminClient
      .from('video_access_logs')
      .select('user_id, video_id, watch_seconds, created_at')
      .gte('created_at', yesterday.start.toISOString())
      .lt('created_at', today.end.toISOString())
      .order('created_at', { ascending: false });

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    const statsByUser = new Map<string, UserStudyAccumulator>();

    for (const log of (logs ?? []) as VideoAccessLog[]) {
      const stats = statsByUser.get(log.user_id) ?? emptyAccumulator();
      addLogToAccumulator(stats, log, today);
      statsByUser.set(log.user_id, stats);
    }

    const usersById = new Map<string, Pick<
      UserProfile,
      'id' | 'username' | 'display_name' | 'avatar_url' | 'vip_level' | 'is_admin' | 'created_at'
    >>();

    for (const item of profiles ?? []) {
      usersById.set(item.id, item);
    }

    const authUsersById = new Map(authUsers.map((item) => [item.id, item]));
    const userIds = new Set(authUsersById.keys());
    const users = [...userIds].map((userId) => {
      const authUser = authUsersById.get(userId) ?? null;
      const userProfile = usersById.get(userId) ?? null;
      const stats = statsByUser.get(userId) ?? emptyAccumulator();
      const totalStudySeconds = stats.todayStudySeconds + stats.yesterdayStudySeconds;
      const providers = authUser?.app_metadata?.providers ?? (
        authUser?.app_metadata?.provider ? [authUser.app_metadata.provider] : []
      );

      return {
        id: userId,
        email: authUser?.email ?? null,
        phone: authUser?.phone ?? null,
        username: userProfile?.username ?? authUser?.email ?? authUser?.phone ?? 'unknown-user',
        displayName: userProfile?.display_name ?? (authUser ? getAuthDisplayName(authUser) : null),
        avatarUrl: userProfile?.avatar_url ?? (authUser ? getAuthAvatarUrl(authUser) : null),
        provider: authUser?.app_metadata?.provider ?? providers[0] ?? null,
        providers,
        role: authUser?.role ?? null,
        emailConfirmedAt: authUser?.email_confirmed_at ?? authUser?.confirmed_at ?? null,
        phoneConfirmedAt: authUser?.phone_confirmed_at ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        isSsoUser: Boolean(authUser?.is_sso_user),
        isAnonymous: Boolean(authUser?.is_anonymous),
        vipLevel: userProfile?.vip_level ?? null,
        isAdmin: Boolean(userProfile?.is_admin),
        createdAt: authUser?.created_at ?? userProfile?.created_at ?? null,
        todayStudySeconds: stats.todayStudySeconds,
        yesterdayStudySeconds: stats.yesterdayStudySeconds,
        totalStudySeconds,
        uniqueVideoCount: stats.videoIds.size,
        recentStudyAt: stats.recentStudyAt,
      };
    }).sort((a, b) => {
      if (b.todayStudySeconds !== a.todayStudySeconds) {
        return b.todayStudySeconds - a.todayStudySeconds;
      }

      if (b.yesterdayStudySeconds !== a.yesterdayStudySeconds) {
        return b.yesterdayStudySeconds - a.yesterdayStudySeconds;
      }

      const recentCompare = (b.recentStudyAt ?? '').localeCompare(a.recentStudyAt ?? '');
      if (recentCompare !== 0) return recentCompare;

      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });

    return NextResponse.json({
      users,
      summary: {
        userCount: users.length,
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
