import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/admin/requireAdmin';
import { buildDefaultUserProfile } from '@/lib/user-profiles';

const MIN_VIP_LEVEL = 0;
const MAX_VIP_LEVEL = 5;

// No platform endpoint creates another user's profile or reads auth.users.
async function ensureUserProfile(adminClient: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('id, vip_level, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (profile) {
    return profile;
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(userId);

  if (authError || !authData.user) {
    return null;
  }

  const defaultProfile = buildDefaultUserProfile(authData.user);
  const { data: createdProfile, error: insertError } = await adminClient
    .from('user_profiles')
    .upsert(defaultProfile, { onConflict: 'id' })
    .select('id, vip_level, is_admin')
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return createdProfile;
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminRequest();
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const consultationRequestId =
      typeof body.consultationRequestId === 'number'
        ? body.consultationRequestId
        : Number.parseInt(String(body.consultationRequestId ?? ''), 10);
    const vipLevelRaw = body.vipLevel;
    const vipLevel =
      vipLevelRaw === undefined || vipLevelRaw === null
        ? 1
        : Number.parseInt(String(vipLevelRaw), 10);

    if (!userId) {
      return NextResponse.json({ error: '缺少用户 ID' }, { status: 400 });
    }

    if (
      !Number.isInteger(vipLevel)
      || vipLevel < MIN_VIP_LEVEL
      || vipLevel > MAX_VIP_LEVEL
    ) {
      return NextResponse.json(
        { error: `会员等级必须是 ${MIN_VIP_LEVEL}-${MAX_VIP_LEVEL} 的整数` },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    const profile = await ensureUserProfile(adminClient, userId);

    if (!profile) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

  // No platform endpoint updates another user's vip_level.
  const { data: updatedProfile, error: updateError } = await adminClient
      .from('user_profiles')
      .update({ vip_level: vipLevel, vip_expires_at: null })
      .eq('id', userId)
      .select('id, username, display_name, avatar_url, vip_level, vip_expires_at, is_admin, created_at')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (
      Number.isInteger(consultationRequestId)
      && consultationRequestId > 0
      && vipLevel > 0
    ) {
      const now = new Date().toISOString();
      // No platform endpoint updates membership_consultation_requests.
      await (adminClient as any)
        .from('membership_consultation_requests')
        .update({
          status: 'paid',
          paid_at: now,
          user_id: userId,
        })
        .eq('id', consultationRequestId);
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: vipLevel > 0 ? `已开通 VIP${vipLevel}` : '已取消会员',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新会员状态失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
