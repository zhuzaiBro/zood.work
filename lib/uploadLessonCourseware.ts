import type { createClient } from '@/lib/supabase/client'

type BrowserSupabaseClient = ReturnType<typeof createClient>

export const LESSON_COURSEWARE_BUCKET = 'lesson-courseware'

const MAX_BYTES = 50 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
])
const ALLOWED_EXTS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'txt'])

function getFileExt(file: File) {
  const parts = file.name.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? 'bin' : 'bin'
}

export async function uploadLessonCourseware(
  supabase: BrowserSupabaseClient,
  userId: string,
  file: File,
): Promise<{ publicUrl: string; fileName: string } | { error: string }> {
  const ext = getFileExt(file)

  if (file.type && !ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTS.has(ext)) {
    return { error: '仅支持 PDF、Word、PPT、Excel、ZIP、TXT 课件文件' }
  }

  if (file.size > MAX_BYTES) {
    return { error: '课件文件不能超过 50MB' }
  }
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const path = `${userId}/${Date.now()}-${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(LESSON_COURSEWARE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data } = supabase.storage
    .from(LESSON_COURSEWARE_BUCKET)
    .getPublicUrl(path)

  return {
    publicUrl: data.publicUrl,
    fileName: file.name,
  }
}
