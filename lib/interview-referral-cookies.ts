export const INTERVIEW_REFERRER_COOKIE = 'zood_interview_referrer'
export const INTERVIEW_REFERRAL_COLLECTION_COOKIE = 'zood_interview_ref_collection'
export const INTERVIEW_REFERRAL_URL_COOKIE = 'zood_interview_ref_url'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value))
}
