import { uploadPlatformFile } from '@/lib/platform/uploads'

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
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: '仅支持 JPEG、PNG、WebP、GIF 图片' }
  }
  if (file.size > MAX_BYTES) {
    return { error: '封面图不能超过 5MB' }
  }
  const uploaded = await uploadPlatformFile(POST_BANNERS_BUCKET, file)
  if (uploaded.error || !uploaded.publicUrl) return { error: uploaded.error || '上传失败' }
  return { publicUrl: uploaded.publicUrl }
}
