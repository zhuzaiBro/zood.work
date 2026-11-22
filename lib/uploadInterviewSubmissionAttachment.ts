import { uploadPlatformFile } from '@/lib/platform/uploads'

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

  const uploaded = await uploadPlatformFile(INTERVIEW_SUBMISSION_ATTACHMENTS_BUCKET, file)
  if (uploaded.error) return { error: uploaded.error }
  return {
    fileName: uploaded.fileName || file.name,
    mimeType: file.type || 'application/octet-stream',
    path: uploaded.publicUrl || uploaded.path || '',
    size: file.size,
  }
}
