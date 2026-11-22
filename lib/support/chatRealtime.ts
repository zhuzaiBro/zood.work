export type SupportChatMessage = {
  id: string
  session_id: string
  user_id: string | null
  sender_type: string
  content: string
  created_at: string
}

export function mergeChatMessages<T extends { id: string; created_at: string }>(current: T[], incoming: T[]) {
  const byId = new Map<string, T>()
  for (const message of current) byId.set(message.id, message)
  for (const message of incoming) {
    if (!byId.has(message.id)) byId.set(message.id, message)
  }
  return [...byId.values()].sort((left, right) => left.created_at.localeCompare(right.created_at))
}

export function messageFromBroadcast(payload: unknown, sessionId: string): SupportChatMessage | null {
  if (!payload || typeof payload !== 'object') return null
  const row = payload as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.session_id !== 'string' || typeof row.created_at !== 'string') return null
  if (row.session_id !== sessionId) return null
  if (row.sender_type !== 'user' && row.sender_type !== 'admin') return null
  if (typeof row.content !== 'string') return null
  return {
    id: row.id,
    session_id: row.session_id,
    user_id: null,
    sender_type: row.sender_type,
    content: row.content,
    created_at: row.created_at,
  }
}

export function shouldCloseRealtime(previousUserId: string | null | undefined, nextUserId: string | null | undefined) {
  return (previousUserId ?? null) !== (nextUserId ?? null)
}

export function publicTelegramConfig(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const body = value as Record<string, unknown>
  const token = body.telegramBotToken
  if (!token || typeof token !== 'object') return null
  const view = token as Record<string, unknown>
  return {
    configured: view.configured === true,
    hint: typeof view.hint === 'string' ? view.hint : null,
  }
}
