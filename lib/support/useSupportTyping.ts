'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { platformBrowser } from '@/lib/platform/client';

export function useStaffTyping(session: string) {
  const listener = useRef<(editing: boolean) => void>(() => {});
  useEffect(() => {
    if (!session) return;
    const editor = crypto.randomUUID();
    const endpoint = '/api/platform/admin/support/threads/' + session + '/typing';
    let active = false, last = 0;
    let idle: number;
    let pending = Promise.resolve();
    const publish = (editing: boolean) => {
      const queuedAt = Date.now();
      pending = pending.then(async () => {
        if (editing && (!active || Date.now() - queuedAt >= 4000)) return;
        await platformBrowser(endpoint, { method: 'POST', body: { editor, active: editing } });
      }).catch(() => {});
    };
    const update = (editing: boolean) => {
      window.clearTimeout(idle);
      if (!editing) {
        if (active) { active = false; publish(false); }
        return;
      }
      if (!active || Date.now() - last >= 2500) {
        active = true;
        last = Date.now();
        publish(true);
      }
      idle = window.setTimeout(() => update(false), 4000);
    };
    listener.current = update;
    const hide = () => { if (document.hidden) update(false); };
    document.addEventListener('visibilitychange', hide);
    return () => {
      update(false);
      listener.current = () => {};
      document.removeEventListener('visibilitychange', hide);
    };
  }, [session]);
  return useCallback((editing: boolean) => listener.current(editing), []);
}

export function useCustomerTyping(session: string | null, open: boolean) {
  const [typing, setTyping] = useState(false);
  const request = useRef(0);
  const expiry = useRef<number | undefined>(undefined);
  const refresh = useCallback(async () => {
    if (!open || !session || document.hidden) return;
    const version = ++request.current;
    const started = performance.now();
    try {
      const { remainingMs } = await platformBrowser<{ remainingMs: number }>(
        '/api/platform/messages/typing?sessionId=' + encodeURIComponent(session), { cache: 'no-store' });
      if (version !== request.current) return;
      const remaining = Math.min(7000, remainingMs) - (performance.now() - started);
      window.clearTimeout(expiry.current);
      setTyping(remaining > 0);
      if (remaining > 0) expiry.current = window.setTimeout(() => setTyping(false), remaining);
    } catch { /* The last confirmed status expires on its own. */ }
  }, [open, session]);
  useEffect(() => {
    setTyping(false);
    void refresh();
    return () => { request.current++; window.clearTimeout(expiry.current); };
  }, [refresh]);
  return { typing, refresh: open && session ? refresh : undefined };
}
