'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSupportUpdates(active: boolean, topic: string | null, reload: () => void, background = false) {
  const callback = useRef(reload);
  useEffect(() => { callback.current = reload; }, [reload]);
  useEffect(() => {
    if (!active) return;
    let connected = false, stopped = false;
    let pending: number | undefined;
    let refreshedAt = 0;
    const refresh = () => {
      if (stopped || (!background && document.hidden) || pending !== undefined) return;
      pending = window.setTimeout(() => { pending = undefined; refreshedAt = Date.now(); if (!stopped) callback.current(); }, 120);
    };
    const client = createClient();
    const channel = topic ? client.channel(topic).on('broadcast', { event: 'changed' }, refresh).subscribe(status => {
      connected = status === 'SUBSCRIBED';
      if (connected) refresh();
    }) : null;
    const fallback = window.setInterval(() => {
      if (!connected || Date.now() - refreshedAt >= (document.hidden ? 300000 : 60000)) refresh();
    }, 30000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    return () => {
      stopped = true;
      window.clearTimeout(pending);
      window.clearInterval(fallback);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      if (channel) void client.removeChannel(channel);
    };
  }, [active, topic, background]);
}
