import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function hasRecentPasswordRecovery(auth: SupabaseClient['auth']) {
  const { data } = await auth.getClaims();
  const now = Math.floor(Date.now() / 1000);
  // GoTrue signs the original verification time and method, even on refreshed tokens.
  return data?.claims.amr?.some(({ method, timestamp }) =>
    method === 'recovery' && timestamp <= now + 30 && timestamp >= now - 15 * 60
  ) ?? false;
}
