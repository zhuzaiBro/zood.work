import type { User } from '@supabase/supabase-js'
import type { createAdminClient } from '@/lib/supabase/server'
import { buildDefaultUserProfile } from '@/lib/user-profiles'
import { isUuid } from '@/lib/interview-referral-cookies'
const REWARD_DAYS = 1
const REWARD_VIP_LEVEL = 1
const MAX_REGISTRATION_AGE_MS = 7 * 24 * 60 * 60 * 1000

type AdminClient = ReturnType<typeof createAdminClient>

type ClaimReferralInput = {
  adminClient: AdminClient
  referrerUserId: string | null | undefined
  referredUser: User
  sourceCollectionId?: string | null
  sourceUrl?: string | null
}

function isRecentRegistration(user: Pick<User, 'created_at'>) {
  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
  if (!Number.isFinite(createdAt) || createdAt <= 0) return false
  return Date.now() - createdAt <= MAX_REGISTRATION_AGE_MS
}

function addRewardDays(base: Date, rewardDays: number) {
  return new Date(base.getTime() + rewardDays * 24 * 60 * 60 * 1000)
}

export async function claimInterviewReferralReward({
  adminClient,
  referrerUserId,
  referredUser,
  sourceCollectionId,
  sourceUrl,
}: ClaimReferralInput) {
  const normalizedReferrerId = referrerUserId?.trim()

  if (!isUuid(normalizedReferrerId) || normalizedReferrerId === referredUser.id) {
    return { awarded: false, reason: 'invalid_referrer' as const }
  }

  if (!isRecentRegistration(referredUser)) {
    return { awarded: false, reason: 'not_new_user' as const }
  }

  const { data: existingReward, error: existingRewardError } = await adminClient
    .from('interview_referral_rewards')
    .select('id')
    .eq('referred_user_id', referredUser.id)
    .maybeSingle()

  if (existingRewardError) {
    throw new Error(existingRewardError.message)
  }

  if (existingReward) {
    return { awarded: false, reason: 'already_awarded' as const }
  }

  const defaultProfile = buildDefaultUserProfile(referredUser)
  const { error: referredProfileError } = await adminClient
    .from('user_profiles')
    .upsert(defaultProfile, { onConflict: 'id', ignoreDuplicates: true })

  if (referredProfileError) {
    throw new Error(referredProfileError.message)
  }

  const { data: referrerProfile, error: referrerError } = await adminClient
    .from('user_profiles')
    .select('id, vip_level, vip_expires_at')
    .eq('id', normalizedReferrerId)
    .maybeSingle()

  if (referrerError) {
    throw new Error(referrerError.message)
  }

  if (!referrerProfile) {
    return { awarded: false, reason: 'referrer_not_found' as const }
  }

  const now = new Date()
  const currentVipLevel = referrerProfile.vip_level ?? 0
  const hasPermanentVip = currentVipLevel > 0 && !referrerProfile.vip_expires_at
  const currentExpiry = referrerProfile.vip_expires_at ? new Date(referrerProfile.vip_expires_at) : null
  const baseExpiry = currentExpiry && currentExpiry > now ? currentExpiry : now
  const nextExpiry = hasPermanentVip ? null : addRewardDays(baseExpiry, REWARD_DAYS).toISOString()
  const nextVipLevel = Math.max(currentVipLevel, REWARD_VIP_LEVEL)

  const { error: insertRewardError } = await adminClient
    .from('interview_referral_rewards')
    .insert({
      referrer_user_id: normalizedReferrerId,
      referred_user_id: referredUser.id,
      source_collection_id: isUuid(sourceCollectionId) ? sourceCollectionId : null,
      source_url: sourceUrl?.slice(0, 1000) ?? null,
      reward_days: REWARD_DAYS,
      reward_vip_level: REWARD_VIP_LEVEL,
    })

  if (insertRewardError) {
    if (insertRewardError.code === '23505') {
      return { awarded: false, reason: 'already_awarded' as const }
    }

    throw new Error(insertRewardError.message)
  }

  const { error: updateReferrerError } = await adminClient
    .from('user_profiles')
    .update({
      vip_level: nextVipLevel,
      vip_expires_at: nextExpiry,
    })
    .eq('id', normalizedReferrerId)

  if (updateReferrerError) {
    throw new Error(updateReferrerError.message)
  }

  return {
    awarded: true,
    reason: 'awarded' as const,
    vipExpiresAt: nextExpiry,
  }
}
