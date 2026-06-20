import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']

function firstNonEmpty(values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim()
    if (normalized) return normalized
  }

  return null
}

function sanitizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function getWalletAddress(user: Pick<User, 'identities' | 'user_metadata'>) {
  const identityAddress = user.identities?.find((identity) => {
    const address = identity.identity_data?.address
    return typeof address === 'string' && address.trim().length > 0
  })?.identity_data?.address

  const metadataAddress = firstNonEmpty([
    typeof user.user_metadata?.address === 'string' ? user.user_metadata.address : null,
    typeof user.user_metadata?.wallet_address === 'string' ? user.user_metadata.wallet_address : null,
  ])

  return firstNonEmpty([
    typeof identityAddress === 'string' ? identityAddress : null,
    metadataAddress,
  ])
}

export function buildUserProfileUsername(
  user: Pick<User, 'id' | 'email' | 'phone' | 'user_metadata' | 'identities'>,
) {
  const walletAddress = getWalletAddress(user)
  if (walletAddress) {
    return walletAddress.toLowerCase()
  }

  const base = firstNonEmpty([
    typeof user.user_metadata?.user_name === 'string' ? user.user_metadata.user_name : null,
    typeof user.user_metadata?.username === 'string' ? user.user_metadata.username : null,
    typeof user.user_metadata?.preferred_username === 'string'
      ? user.user_metadata.preferred_username
      : null,
    user.email?.split('@')[0],
    user.phone?.replace(/\D+/g, ''),
  ])

  const normalizedBase = sanitizeUsername(base ?? 'user')
  const safeBase = normalizedBase || 'user'
  const suffix = user.id.replace(/-/g, '').slice(0, 8)

  return `${safeBase.slice(0, 24)}_${suffix}`
}

export function buildUserProfileDisplayName(
  user: Pick<User, 'id' | 'email' | 'phone' | 'user_metadata' | 'identities'>,
) {
  const walletAddress = getWalletAddress(user)
  if (walletAddress) {
    const compact = walletAddress.toLowerCase()
    return `${compact.slice(0, 6)}...${compact.slice(-4)}`
  }

  return firstNonEmpty([
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null,
    typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null,
    typeof user.user_metadata?.user_name === 'string' ? user.user_metadata.user_name : null,
    typeof user.user_metadata?.preferred_username === 'string'
      ? user.user_metadata.preferred_username
      : null,
    user.email,
    user.phone,
  ]) ?? `用户 ${user.id.slice(0, 8)}`
}

export function buildUserProfileAvatarUrl(
  user: Pick<User, 'id' | 'user_metadata' | 'identities'>,
) {
  return firstNonEmpty([
    typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null,
    typeof user.user_metadata?.picture === 'string' ? user.user_metadata.picture : null,
  ]) ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`
}

export function buildDefaultUserProfile(
  user: Pick<User, 'id' | 'email' | 'phone' | 'user_metadata' | 'identities'>,
): UserProfileInsert {
  return {
    id: user.id,
    username: buildUserProfileUsername(user),
    display_name: buildUserProfileDisplayName(user),
    avatar_url: buildUserProfileAvatarUrl(user),
    bio: null,
    vip_level: 0,
    is_admin: false,
  }
}
