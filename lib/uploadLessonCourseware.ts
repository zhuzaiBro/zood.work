import { uploadPlatformFile } from '@/lib/platform/uploads'

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
  file: File,
): Promise<{ publicUrl: string; fileName: string } | { error: string }> {
  const ext = getFileExt(file)

  if (file.type && !ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTS.has(ext)) {
    return { error: '仅支持 PDF、Word、PPT、Excel、ZIP、TXT 课件文件' }
  }

  if (file.size > MAX_BYTES) {
    return { error: '课件文件不能超过 50MB' }
  }
  const uploaded = await uploadPlatformFile(LESSON_COURSEWARE_BUCKET, file)
  if (uploaded.error || !uploaded.publicUrl) return { error: uploaded.error || '上传失败' }
  return {
    publicUrl: uploaded.publicUrl,
    fileName: uploaded.fileName,
  }
}
