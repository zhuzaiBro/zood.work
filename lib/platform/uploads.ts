import { browserAccessToken } from '@/lib/auth/session'
import { platformBaseUrl } from '@/lib/platform/http'

export async function uploadPlatformFile(bucket: string, file: File) {
  const body = new FormData()
  body.set('bucket', bucket)
  body.set('file', file)
  const token = await browserAccessToken()
  const response = await fetch(`${platformBaseUrl()}/api/platform/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { error: payload.error || '上传失败' }
  }
  return {
    publicUrl: payload.publicUrl as string,
    path: payload.path as string,
    fileName: (payload.fileName as string) || file.name,
  }
}
