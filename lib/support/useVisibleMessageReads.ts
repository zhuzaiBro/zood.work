'use client';

import { useEffect, type RefObject } from 'react';
import { platformBrowser } from '@/lib/platform/client';

// The viewport observer also respects clipping by the scrollable message panel.
export function useVisibleMessageReads(
  panel: RefObject<HTMLDivElement | null>, endpoint: string | null,
  messages: readonly { id: string }[], refresh: () => void,
) {
  useEffect(() => {
    if (!endpoint || !panel.current) return;
    const targets = panel.current.querySelectorAll<HTMLElement>('[data-unread-id]');
    if (!targets.length) return;
    const visible = new Set<string>();
    let timer: number | undefined;
    let stopped = false, busy = false;
    const schedule = (delay = 300) => {
      if (stopped || busy || document.hidden || !visible.size || timer !== undefined) return;
      timer = window.setTimeout(async () => {
        timer = undefined;
        if (stopped || document.hidden || !visible.size) return;
        busy = true;
        const messageIds = [...visible].slice(0, 200);
        let retry = false;
        try {
          await platformBrowser(endpoint, { method: 'POST', body: { messageIds } });
          messageIds.forEach(id => visible.delete(id));
          if (!stopped) refresh();
        } catch { retry = true; }
        finally { busy = false; schedule(retry ? 5000 : 300); }
      }, delay);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.unreadId!;
        if (entry.isIntersecting && entry.intersectionRect.height > 0) visible.add(id);
        else visible.delete(id);
      }
      schedule();
    });
    targets.forEach(node => observer.observe(node));
    const onVisible = () => { if (!document.hidden) schedule(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [panel, endpoint, messages, refresh]);
}
