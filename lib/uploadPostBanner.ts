import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const POST_BANNERS_BUCKET = 'post-banners'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  return 'jpg'
}

export async function uploadPostBanner(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: '仅支持 JPEG、PNG、WebP、GIF 图片' }
  }
  if (file.size > MAX_BYTES) {
    return { error: '封面图不能超过 5MB' }
  }

  const ext = extForMime(file.type)
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `${userId}/${Date.now()}-${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(POST_BANNERS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data } = supabase.storage.from(POST_BANNERS_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}
