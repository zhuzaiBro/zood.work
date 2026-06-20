import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const INTERVIEW_SUBMISSION_ATTACHMENTS_BUCKET = 'interview-submission-attachments'
export const INTERVIEW_SUBMISSION_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const MAX_BYTES = 20 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])
const ALLOWED_EXTS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx'])

function getFileExt(file: File) {
  const parts = file.name.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? 'bin' : 'bin'
}

export function validateInterviewSubmissionAttachment(file: File): string | null {
  const ext = getFileExt(file)

  if (file.type && !ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTS.has(ext)) {
    return '仅支持 PDF、Word、Excel 文件'
  }

  if (file.size > MAX_BYTES) {
    return '附件不能超过 20MB'
  }

  return null
}

export async function uploadInterviewSubmissionAttachment(
  supabase: SupabaseClient<Database, any, any, any, any>,
  userId: string,
  file: File,
): Promise<
  | {
      fileName: string
      mimeType: string
      path: string
      size: number
    }
  | { error: string }
> {
  const validationError = validateInterviewSubmissionAttachment(file)

  if (validationError) {
    return { error: validationError }
  }

  const ext = getFileExt(file)
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `${userId}/${Date.now()}-${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(INTERVIEW_SUBMISSION_ATTACHMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })

  if (uploadError) {
    const message = uploadError.message.toLowerCase()

    if (message.includes('bucket') && message.includes('not found')) {
      return { error: '附件存储未初始化，请先执行 .sql/setup_interview_submission_storage.sql。' }
    }

    if (
      message.includes('row-level security') ||
      message.includes('permission') ||
      message.includes('unauthorized')
    ) {
      return { error: '附件上传权限未初始化，请先执行 .sql/setup_interview_submission_storage.sql。' }
    }

    return { error: uploadError.message }
  }

  return {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    path,
    size: file.size,
  }
}
