export type VipProfileLike = {
  vip_level?: number | null
  vip_expires_at?: string | null
}

export function getEffectiveVipLevel(profile: VipProfileLike | null | undefined) {
  const vipLevel = profile?.vip_level ?? 0

  if (vipLevel <= 0) {
    return 0
  }

  if (!profile?.vip_expires_at) {
    return vipLevel
  }

  return new Date(profile.vip_expires_at).getTime() > Date.now() ? vipLevel : 0
}

export function isActiveMember(profile: VipProfileLike | null | undefined) {
  return getEffectiveVipLevel(profile) > 0
}
