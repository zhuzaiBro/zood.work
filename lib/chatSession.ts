const GUEST_SESSION_KEY = 'zood_chat_session_id';

export function getGuestSessionId(): string {
  if (typeof window === 'undefined') return '';

  let id = localStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

/** 登录用户用 user_id 作为 session，便于后台按用户回复 */
export function getChatSessionId(userId: string | null | undefined): string {
  if (userId) return userId;
  return getGuestSessionId();
}
