'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSupportUpdates(active: boolean, topic: string | null, reload: () => void, background = false, onTyping?: () => void) {
  const callback = useRef(reload);
  const typing = useRef(onTyping);
  const connected = useRef(false);
  useEffect(() => { typing.current = onTyping; }, [onTyping]);
  useEffect(() => {
    if (!onTyping) return;
    const poll = window.setInterval(() => { if (!connected.current && !document.hidden) onTyping(); }, 3500);
    return () => window.clearInterval(poll);
  }, [onTyping]);
  useEffect(() => { callback.current = reload; }, [reload]);
  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let pending: number | undefined;
    let refreshedAt = 0;
    const refresh = () => {
      if (stopped || (!background && document.hidden) || pending !== undefined) return;
      pending = window.setTimeout(() => { pending = undefined; refreshedAt = Date.now(); if (!stopped) callback.current(); }, 120);
    };
    const client = createClient();
    let typingTimer: number | undefined;
    const refreshTyping = () => {
      if (document.hidden || !typing.current || typingTimer !== undefined) return;
      typingTimer = window.setTimeout(() => { typingTimer = undefined; if (!stopped) typing.current?.(); }, 80);
    };
    const channel = topic ? client.channel(topic).on('broadcast', { event: 'changed' }, refresh)
      .on('broadcast', { event: 'typing' }, refreshTyping).subscribe(status => {
      if (stopped) return;
      connected.current = status === 'SUBSCRIBED';
      if (connected.current) { refresh(); refreshTyping(); }
    }) : null;
    const fallback = window.setInterval(() => {
      if (!connected.current || Date.now() - refreshedAt >= (document.hidden ? 300000 : 60000)) refresh();
    }, 30000);
    document.addEventListener('visibilitychange', refresh);
    document.addEventListener('visibilitychange', refreshTyping);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    return () => {
      stopped = true; connected.current = false;
      window.clearTimeout(typingTimer);
      document.removeEventListener('visibilitychange', refreshTyping);
      window.clearTimeout(pending);
      window.clearInterval(fallback);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      if (channel) void client.removeChannel(channel);
    };
  }, [active, topic, background]);
}
