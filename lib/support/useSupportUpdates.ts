'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSupportUpdates(active: boolean, topic: string | null, reload: () => void) {
  const callback = useRef(reload);
  useEffect(() => { callback.current = reload; }, [reload]);
  useEffect(() => {
    if (!active) return;
    let connected = false, stopped = false;
    let pending: number | undefined;
    const refresh = () => {
      if (stopped || document.hidden || pending !== undefined) return;
      pending = window.setTimeout(() => { pending = undefined; if (!stopped) callback.current(); }, 120);
    };
    const client = createClient();
    const channel = topic ? client.channel(topic).on('broadcast', { event: 'changed' }, refresh).subscribe(status => {
      connected = status === 'SUBSCRIBED';
      if (connected) refresh();
    }) : null;
    const fallback = window.setInterval(() => { if (!connected) refresh(); }, 30000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);
    return () => {
      stopped = true;
      window.clearTimeout(pending);
      window.clearInterval(fallback);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', refresh);
      if (channel) void client.removeChannel(channel);
    };
  }, [active, topic]);
}
