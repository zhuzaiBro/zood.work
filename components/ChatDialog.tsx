'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, Fragment, type FormEvent } from 'react';
import { CloseOutlined, CustomerServiceOutlined, DownOutlined, MutedOutlined, SendOutlined, SoundOutlined } from '@ant-design/icons';
import { platformBrowser } from '@/lib/platform/client';
import { createClient } from '@/lib/supabase/client';
import { getChatSessionId } from '@/lib/chatSession';
import { useSupportSound } from '@/lib/support/useSupportSound';
import { useVisibleMessageReads } from '@/lib/support/useVisibleMessageReads';
import { useCustomerTyping } from '@/lib/support/useSupportTyping';
import { useSupportUpdates } from '@/lib/support/useSupportUpdates';
import Skeleton from '@/components/ui/Skeleton';
import type { Database } from '@/types/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & { read?: boolean };
const time = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
const day = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
const iconButton = 'inline-flex size-10 items-center justify-center rounded-xl text-base text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600';

export default function ChatDialog() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sound = useSupportSound(open || !!sessionId);

  useEffect(() => {
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_, session) => {
      setSessionId(getChatSessionId(session?.user.id, false));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (open && sessionId === '') setSessionId(getChatSessionId(null));
  }, [open, sessionId]);

  return <Conversation key={sessionId} sessionId={sessionId} open={open} setOpen={setOpen} sound={sound} />;
}

function Conversation({ sessionId, open, setOpen, sound }: {
  sessionId: string | null; open: boolean; setOpen: (open: boolean) => void; sound: ReturnType<typeof useSupportSound>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const serverReceipts = useRef(false);
  const lastCursor = useRef<Message | null | undefined>(undefined);
  const version = useRef(0);
  const visible = useRef(open);
  const follow = useRef(true);
  const scroll = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const play = sound.play;
  const staff = useCustomerTyping(sessionId, open);

  const reload = useCallback(async () => {
    if (!sessionId) return;
    const request = ++version.current;
    try {
      const data = await platformBrowser<{ messages: Message[]; topic?: string; unreadReplies?: number }>(
        '/api/platform/messages?sessionId=' + encodeURIComponent(sessionId), { cache: 'no-store' });
      if (request !== version.current) return;
      const rows = data.messages;
      serverReceipts.current = typeof data.unreadReplies === 'number';
      if (typeof data.unreadReplies === 'number') setUnread(data.unreadReplies);
      const previous = lastCursor.current;
      if (previous !== undefined) {
        const index = previous ? rows.findIndex(m => m.id === previous.id) : -1;
        const added = index >= 0 ? rows.slice(index + 1) : rows.filter(m => !previous || Date.parse(m.created_at) > Date.parse(previous.created_at));
        const replies = added.filter(m => m.sender_type === 'admin');
        if (replies.length) {
          play(sessionId, replies[replies.length - 1].id);
          if (!serverReceipts.current && (!visible.current || document.hidden)) setUnread(n => n + replies.length);
        }
      }
      lastCursor.current = rows[rows.length - 1] ?? previous ?? null;
      setMessages(rows);
      setTopic(data.topic || null);
      setError('');
    } catch {
      if (request === version.current) setError('消息加载失败，请重试。');
    } finally {
      if (request === version.current) setReady(true);
    }
  }, [sessionId, play]);

  useEffect(() => {
    void reload();
    return () => { version.current++; };
  }, [reload]);
  useVisibleMessageReads(scroll, open && sessionId ? '/api/platform/messages/read?sessionId=' + encodeURIComponent(sessionId) : null, messages, reload);
  useSupportUpdates(!!sessionId && (open || messages.length > 0), topic, reload, true, staff.refresh);

  useEffect(() => {
    visible.current = open;
    if (!open) return;
    follow.current = true;
    dialog.current?.focus({ preventScroll: true });
    const markRead = () => { if (!document.hidden && !serverReceipts.current) setUnread(0); };
    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => document.removeEventListener('visibilitychange', markRead);
  }, [open]);
  useEffect(() => {
    if (open && follow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages, open]);

  function close() {
    setOpen(false);
    launcher.current?.focus({ preventScroll: true });
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!sessionId || !content || sending) return;
    setSending(true);
    setError('');
    try {
      await platformBrowser('/api/platform/messages', { method: 'POST', body: { sessionId, content, pageUrl: window.location.href } });
      follow.current = true;
      setDraft(value => value.trim() === content ? '' : value);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '消息发送失败，请重试。');
    } finally { setSending(false); }
  }

  const today = day.format(new Date());
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] flex flex-col items-end gap-3 sm:left-auto sm:right-6 sm:bottom-6">
      {open && <section ref={dialog} id="support-conversation" role="dialog" aria-labelledby="support-title" tabIndex={-1}
        onKeyDown={e => { if (e.key === 'Escape' && !e.nativeEvent.isComposing) close(); }}
        className="pointer-events-auto flex h-[min(540px,calc(100dvh-6.5rem-env(safe-area-inset-bottom)))] w-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white text-slate-900 shadow-[0_14px_55px_-12px_rgba(15,35,65,.23),0_2px_8px_rgba(15,35,65,.06)] outline-none sm:w-[374px]">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white px-4 py-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50">
            <Image src="/brand/zood-mark.png" alt="" width={28} height={30} className="h-7 w-auto" />
          </span>
          <div className="mr-auto min-w-0">
            <h2 id="support-title" className="text-[17px] font-bold leading-6 tracking-tight">在线客服</h2>
            <div role="status" className="text-xs leading-4 text-blue-700">{staff.typing ? '客服正在输入…' : ''}</div>
          </div>
          <div className="flex gap-0.5">
            <button type="button" className={iconButton} onClick={sound.toggle} aria-pressed={!sound.muted}
              aria-label="回复提示音" title={sound.muted ? '开启回复提示音' : '关闭回复提示音'}>
              {sound.muted ? <MutedOutlined /> : <SoundOutlined />}
            </button>
            <button type="button" className={iconButton} aria-label="关闭聊天" onClick={close}><CloseOutlined /></button>
          </div>
        </header>
        <div ref={scroll} onScroll={e => { const el = e.currentTarget; follow.current = el.scrollHeight - el.clientHeight - el.scrollTop < 48; }}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f5f8fc] px-4 py-4 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
          <div role="log" aria-label="聊天记录" aria-live="polite" className="flex flex-col gap-3">
            {!ready && <div role="status" aria-label="消息加载中" className="space-y-3">
              <Skeleton className="h-11 w-3/4 rounded-2xl" /><Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
            </div>}
            {ready && !error && !messages.length && <div className="max-w-[88%] self-start">
              <p className="mb-1.5 ml-1 text-xs text-slate-500">AI出海客服</p>
              <p className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed">你好！课程、面试准备或会员使用上遇到了什么问题？</p>
            </div>}
            {messages.map((message, i) => {
              const mine = message.sender_type === 'user';
              const date = new Date(message.created_at);
              const dateLabel = day.format(date);
              const newDay = i === 0 || dateLabel !== day.format(new Date(messages[i - 1].created_at));
              return <Fragment key={message.id}>
                {newDay && <div className="flex items-center justify-center gap-2.5 py-1 text-[11px] text-slate-500">
                  <span className="h-px w-6 bg-slate-200" />{dateLabel === today ? '今天' : dateLabel}<span className="h-px w-6 bg-slate-200" />
                </div>}
                <div data-unread-id={!mine && message.read === false ? message.id : undefined}
                  className={'flex max-w-[86%] flex-col gap-1 ' + (mine ? 'items-end self-end' : 'items-start self-start')}>
                  <div className={'max-w-full rounded-2xl px-3.5 py-2 text-[14px] leading-[1.6] ' +
                    (mine ? 'flex flex-wrap items-end justify-end gap-x-2 rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900')}>
                    <span className="min-w-0 flex-auto whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</span>
                    {mine && <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 self-end pb-px text-[11px] leading-4 tabular-nums text-blue-100">
                      <time dateTime={message.created_at}>{time.format(date)}</time>
                      <span role="img" aria-label={message.read ? '已读' : '已发送'} title={message.read ? '客服已读' : '已发送'}>
                        <svg aria-hidden="true" width={message.read ? 19 : 14} height="14" viewBox={message.read ? '0 0 20 14' : '0 0 14 14'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m1.5 7.1 3.1 3.1 7.2-8" />{message.read && <path d="m8.7 9.2 1 1 7.2-8" />}
                        </svg>
                      </span>
                    </span>}
                  </div>
                  {!mine && <time dateTime={message.created_at} className="mx-1 text-[11px] tabular-nums text-slate-500">客服 · {time.format(date)}</time>}
                </div>
              </Fragment>;
            })}
          </div>
        </div>
        <form onSubmit={send} className="shrink-0 border-t border-slate-200 bg-white p-3">
          {error && <p role="alert" className="mb-2 px-1 text-xs text-red-700">{error} <button type="button" onClick={() => void reload()} className="underline">重新加载</button></p>}
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <textarea aria-label="客服消息" placeholder="输入消息…" rows={1} maxLength={2000} value={draft}
              onChange={e => setDraft(e.target.value)} onKeyDown={e => {
                if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
                e.preventDefault(); e.currentTarget.form?.requestSubmit();
              }}
              className="max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 text-slate-900 outline-none [field-sizing:content] placeholder:text-slate-500 sm:text-sm" />
            <button type="submit" disabled={!sessionId || !draft.trim() || sending} aria-label="发送消息" title="Enter 发送，Shift + Enter 换行"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-[17px] text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"><SendOutlined /></button>
          </div>
        </form>
      </section>}
      <button ref={launcher} type="button" disabled={sessionId === null} onClick={() => { if (open) close(); else setOpen(true); }}
        aria-label={open ? '收起客服' : '打开在线客服' + (unread ? '，有 ' + unread + ' 条新回复' : '')}
        aria-expanded={open} aria-controls={open ? 'support-conversation' : undefined}
        className="pointer-events-auto relative grid size-[52px] place-items-center rounded-full border border-blue-700/10 bg-blue-600 text-[23px] text-white shadow-[0_5px_18px_rgba(37,99,235,.27)] transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600">
        {open ? <DownOutlined className="text-lg" /> : <CustomerServiceOutlined />}
        {!open && unread > 0 && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold tabular-nums text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
    </div>
  );
}
