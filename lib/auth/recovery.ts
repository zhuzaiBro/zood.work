import 'server-only';
import { createHash } from 'node:crypto';
import type { Session } from '@supabase/supabase-js';

export const recoveryCookie = 'zood-password-recovery';

// Tie the short-lived form to the session issued by the verified email link.
// A Supabase access token may refresh while the form is open; its session ID stays stable.
export function recoverySession(session: Session | null) {
  try {
    const payload = JSON.parse(Buffer.from(session?.access_token.split('.')[1] || '', 'base64url').toString('utf8'));
    if (typeof payload.session_id !== 'string' || !payload.session_id) return null;
    return createHash('sha256').update(payload.session_id).digest('hex');
  } catch {
    return null;
  }
}
