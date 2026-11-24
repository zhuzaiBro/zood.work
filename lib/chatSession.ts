const GUEST_SESSION_KEY = 'zood_chat_session_id';
let temporaryGuestId = '';

export function getGuestSessionId(create = true): string {
  if (typeof window === 'undefined') return '';

  try {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id && create) {
      id = crypto.randomUUID();
      localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id || '';
  } catch {
    if (!temporaryGuestId && create) temporaryGuestId = crypto.randomUUID();
    return temporaryGuestId;
  }
}

/** 登录用户用 user_id 作为 session，便于后台按用户回复 */
export function getChatSessionId(userId: string | null | undefined, createGuest = true): string {
  if (userId) return userId;
  return getGuestSessionId(createGuest);
}
