'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getChatSessionId } from '@/lib/chatSession';
import { useUser } from '@/store/userStore';
import type { Database } from '@/types/database.types';

type ChatMessage = Database['public']['Tables']['messages']['Row'];

const WELCOME_MESSAGE =
  '你好，我是 Zood 客服。有任何课程、会员或面试题相关问题，直接在这里留言，我会尽快回复。';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatDialog() {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getChatSessionId(user?.id));
  }, [user?.id]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (loadError) {
      setError('消息加载失败，请稍后重试');
    } else {
      setMessages(data ?? []);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    if (!open || !sessionId) return;
    loadMessages();
  }, [open, sessionId, loadMessages]);

  useEffect(() => {
    if (!open || !sessionId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((item) => item.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, sessionId]);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !sessionId || sending) return;

    setSending(true);
    setError('');

    const supabase = createClient();
    const { error: sendError } = await supabase.from('messages').insert({
      session_id: sessionId,
      user_id: user?.id ?? null,
      sender_type: 'user',
      content,
    });

    if (sendError) {
      setError('发送失败，请稍后重试');
    } else {
      setInput('');
    }
    setSending(false);
  };

  return (
    <div className="fixed bottom-6 right-4 z-40 sm:right-6">
      {open && (
        <div className="mb-3 flex h-[min(520px,calc(100vh-6rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-sky-300/20 bg-[#07101f]/95 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-sky-300/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">在线客服</p>
              <p className="text-xs text-[#8da2c4]">通常会在几小时内回复</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-[#8da2c4] transition hover:bg-white/5 hover:text-white"
              aria-label="关闭聊天"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-sm leading-6 text-[#e8eef9]">
                {WELCOME_MESSAGE}
              </div>
            </div>

            {loading && (
              <p className="text-center text-xs text-[#8da2c4]">加载中…</p>
            )}

            {messages.map((message) => {
              const isUser = message.sender_type === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                      isUser
                        ? 'rounded-br-md bg-[linear-gradient(135deg,#5f82ff,#8fe7ff)] text-[#04101f]'
                        : 'rounded-bl-md bg-white/10 text-[#e8eef9]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isUser ? 'text-[#04101f]/60' : 'text-[#8da2c4]'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="px-4 pb-1 text-center text-xs text-red-300">{error}</p>
          )}

          <form
            onSubmit={handleSend}
            className="border-t border-sky-300/10 p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="输入消息，Enter 发送"
                className="max-h-28 flex-1 resize-none rounded-xl border border-sky-300/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#60708f] outline-none focus:border-sky-300/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="shrink-0 rounded-xl bg-[linear-gradient(135deg,#5f82ff,#8fe7ff)] px-4 py-2 text-sm font-semibold text-[#04101f] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="chat-trigger-shell ml-auto">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="chat-trigger-btn group"
          aria-label={open ? '关闭聊天' : '打开在线客服'}
        >
          <span
            aria-hidden
            className="chat-trigger-gradient absolute inset-0 bg-[linear-gradient(135deg,#2563eb_0%,#6366f1_48%,#a855f7_100%)]"
          />
          <span
            aria-hidden
            className="chat-trigger-blob-a absolute -left-[12%] -top-[8%] h-[72%] w-[72%] rounded-full bg-[#1d4ed8]/75 blur-[1px]"
          />
          <span
            aria-hidden
            className="chat-trigger-blob-b absolute -bottom-[6%] -right-[8%] h-[68%] w-[68%] rounded-full bg-[#c084fc]/55 blur-[2px]"
          />
          <span
            aria-hidden
            className="chat-trigger-blob-c absolute left-[18%] top-[12%] h-[42%] w-[42%] rounded-full bg-[#93c5fd]/45 blur-[3px]"
          />
          <span
            aria-hidden
            className="chat-trigger-wave-a absolute -left-[10%] bottom-[-20%] h-[70%] w-[120%] rounded-[45%] bg-[#60a5fa]/50 blur-[4px]"
          />
          <span
            aria-hidden
            className="chat-trigger-wave-b absolute -right-[8%] bottom-[-25%] h-[65%] w-[110%] rounded-[40%] bg-[#a78bfa]/45 blur-[5px]"
          />
          <span
            aria-hidden
            className="chat-trigger-highlight absolute inset-0 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.58)_0%,rgba(255,255,255,0.14)_30%,transparent_58%)]"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_74%_86%,rgba(79,70,229,0.32)_0%,transparent_52%)]"
          />
          <span aria-hidden className="absolute inset-0 bg-white/12" />
          <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(37,99,235,0.35)]">
            {open ? (
              <svg className="h-[1.35rem] w-[1.35rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="h-[1.35rem] w-[1.35rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
