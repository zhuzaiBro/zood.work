'use client';

import Link from 'next/link';
import InboxLoading from './loading';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { platformBrowser, PlatformError } from '@/lib/platform/client';
import { useVisibleMessageReads } from '@/lib/support/useVisibleMessageReads';
import { useStaffTyping } from '@/lib/support/useSupportTyping';
import { useSupportUpdates } from '@/lib/support/useSupportUpdates';

type Thread = { id: string; content: string; sender: string; at: string; member: boolean; customer_name?: string };
type Message = { id: string; content: string; sender_type: string; created_at: string; customer_name?: string; read?: boolean };
type Bot = { configured: boolean; username: string; bindings: number; realtime: boolean };
type History = { messages: Message[]; more: boolean };
const base = '/api/platform/admin/support';
const button = 'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:border-blue-400 disabled:opacity-45';
const primary = 'rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50';
const time = (v: string) => new Date(v).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' });
const errorText = (e: unknown) => e instanceof PlatformError ? e.message : '连接失败，请稍后重试。';
const customerName = (thread: Thread) => thread.customer_name || (thread.member ? '已登录用户' : '网站访客') + ' · ' + thread.id.slice(0, 8);

export default function SupportInbox() {
  const [page, setPage] = useState(1), [more, setMore] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]), [selected, setSelected] = useState('');
  const [topic, setTopic] = useState<string | null>(null), [bot, setBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]), [older, setOlder] = useState(false);
  const [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const listSeq = useRef(0), historySeq = useRef(0);
  const selection = useRef('');
  const refreshBot = useCallback(async () => setBot(await platformBrowser<Bot>(base + '/telegram', { cache: 'no-store' })), []);
  const loadThreads = useCallback(async () => {
    const seq = ++listSeq.current;
    try {
      const r = await platformBrowser<{ threads: Thread[]; more: boolean; topic: string }>(base + '/threads?page=' + page, { cache: 'no-store' });
      if (listSeq.current !== seq) return;
      setThreads(r.threads); setMore(r.more); setTopic(r.topic); setError('');
    } catch (e) {
      if (seq !== listSeq.current) return;
      if (e instanceof PlatformError && (e.status === 401 || e.status === 403)) setDenied(true);
      setError(errorText(e));
    } finally { if (seq === listSeq.current) setLoading(false); }
  }, [page]);
  const loadHistory = useCallback(async (id: string, before = '') => {
    if (!id) return;
    const seq = ++historySeq.current;
    try {
      const r = await platformBrowser<History>(base + '/threads/' + id + (before ? '?before=' + before : ''), { cache: 'no-store' });
      if (seq !== historySeq.current || selection.current !== id) return;
      setMessages(previous => {
        const all = before ? [...r.messages, ...previous] : [...previous, ...r.messages];
        return [...new Map(all.map(m => [m.id, m])).values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
      });
      if (before) setOlder(r.more);
      else setOlder(current => messagesLoadedBefore.current ? current : r.more);
    } catch (e) { if (seq === historySeq.current) setError(errorText(e)); }
  }, []);
  const signalTyping = useStaffTyping(selected);
  const historyPanel = useRef<HTMLDivElement>(null);
  const refreshHistory = useCallback(() => { void loadHistory(selection.current); }, [loadHistory]);
  useVisibleMessageReads(historyPanel, selected && !denied ? base + '/threads/' + selected + '/read' : null, messages, refreshHistory);
  const messagesLoadedBefore = useRef(false);
  useEffect(() => { void loadThreads(); }, [loadThreads]);
  useEffect(() => { void refreshBot().catch(e => setError(errorText(e))); }, [refreshBot]);
  useEffect(() => {
    selection.current = selected; messagesLoadedBefore.current = false;
    setMessages([]); setDraft(''); setOlder(false);
    void loadHistory(selected);
  }, [selected, loadHistory]);
  useSupportUpdates(!denied, topic, () => { void loadThreads(); void loadHistory(selection.current); void refreshBot().catch(() => {}); });
  async function reply(event: FormEvent) {
    event.preventDefault(); const content = draft.trim(), id = selected;
    if (!content || busy || !id) return;
    signalTyping(false);
    setBusy(true);
    try {
      await platformBrowser(base + '/threads/' + id, { method: 'POST', body: { content } });
      if (selection.current === id) setDraft(value => value.trim() === content ? '' : value);
      await Promise.all([loadThreads(), loadHistory(selection.current)]);
    }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  const current = threads.find(t => t.id === selected);
  const title = current ? customerName(current) : messages.find(m => m.customer_name)?.customer_name;
  if (loading && !threads.length && !error) return <InboxLoading />;
  return (
    <div className="mx-auto max-w-7xl space-y-4 text-slate-900">
      <h1 className="text-2xl font-bold">客服收件箱</h1>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error} {denied && <Link className="underline" href="/login?redirect=/admin/support">前往登录</Link>}</p>}
      {!denied && <>
        {bot && <TelegramSettings bot={bot} refresh={refreshBot} />}
        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[19rem_minmax(0,1fr)]">
          <section className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <h2 className="border-b border-slate-200 p-4 font-bold">全部会话</h2>
            <div className="max-h-64 overflow-y-auto lg:max-h-[65vh]">
              {threads.map(t => <button key={t.id} type="button" aria-pressed={selected === t.id} onClick={() => setSelected(t.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${selected === t.id ? 'bg-blue-50' : ''}`}>
                <span className="flex items-baseline justify-between gap-2"><strong className="truncate text-sm">{customerName(t)}</strong><time className="shrink-0 text-xs text-slate-500">{time(t.at)}</time></span>
                <span className="mt-1 block truncate text-sm text-slate-600">{t.sender === 'admin' ? '客服 · ' : ''}{t.content}</span>
              </button>)}
              {!threads.length && <p className="p-4 text-sm text-slate-500">{loading ? '正在加载会话…' : '还没有客服消息。'}</p>}
            </div>
            {(page > 1 || more) && <nav className="flex items-center justify-between gap-2 p-3">
              <button className={button} disabled={page === 1} onClick={() => { setSelected(''); setPage(page - 1); }}>上一页</button>
              <span className="text-sm">{page}</span><button className={button} disabled={!more} onClick={() => { setSelected(''); setPage(page + 1); }}>下一页</button>
            </nav>}
          </section>
          <section className="min-w-0 p-4">
            <h2 className="break-words font-bold">{title ? '与 ' + title + ' 的会话' : '会话记录'}</h2>
            {!selected && <p className="mt-3 text-sm text-slate-500">选择一个会话查看消息。</p>}
            {selected && <>
              <div ref={historyPanel} className="my-4 max-h-[55vh] min-h-36 space-y-3 overflow-y-auto" aria-live="polite">
                {older && <button className={button} onClick={() => { messagesLoadedBefore.current = true; void loadHistory(selected, messages[0]?.id); }}>查看更早消息</button>}
                {messages.map(m => <div key={m.id} data-unread-id={m.sender_type === 'user' && m.read === false ? m.id : undefined} className={`w-fit max-w-[90%] rounded-lg p-3 ${m.sender_type === 'user' ? 'bg-slate-100' : 'ml-auto bg-blue-50'}`}>
                  <small className="text-slate-600">{m.sender_type === 'user' ? m.customer_name || title || '客户' : '客服'} · {time(m.created_at)}</small>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{m.content}</p>
                </div>)}
              </div>
              <form onSubmit={reply}><label className="text-sm font-medium" htmlFor="support-reply">回复客户</label>
                <textarea id="support-reply" value={draft}
                  onChange={e => { setDraft(e.target.value); signalTyping(Boolean(e.target.value.trim())); }}
                  onBlur={() => signalTyping(false)} maxLength={2000} rows={2} className="my-2 block w-full rounded-md border border-slate-300 p-2" />
                <button disabled={busy || !draft.trim()} className={primary}>发送回复</button>
              </form>
            </>}
          </section>
        </div>
      </>}
    </div>
  );
}

function TelegramSettings({ bot, refresh }: { bot: Bot; refresh: () => Promise<void> }) {
  const [token, setToken] = useState(''), [binding, setBinding] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy || !token.trim()) return; setBusy(true); setNotice('');
    try { await platformBrowser(base + '/telegram', { method: 'PUT', body: { token: token.trim() } }); setToken(''); setBinding(''); await refresh(); setNotice('机器人已保存，Webhook 已设置。'); }
    catch (e) { setNotice(errorText(e)); } finally { setBusy(false); }
  }
  async function bind() {
    setBusy(true); setNotice('');
    try { const r = await platformBrowser<{ url: string }>(base + '/telegram/binding', { method: 'POST' }); setBinding(r.url); }
    catch (e) { setNotice(errorText(e)); } finally { setBusy(false); }
  }
  return <details className="rounded-xl border border-slate-200 bg-white p-4" open={!bot.configured || undefined}>
    <summary className="cursor-pointer font-semibold">Telegram 客服设置 <span className="ml-2 text-sm font-normal text-slate-600">{bot.configured ? '@' + bot.username + ' · ' + bot.bindings + ' 个已绑定会话' : '尚未配置'}</span></summary>
    <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-2">
      <label className="min-w-48 flex-1 text-sm font-medium">机器人 Token<input type="password" value={token} onChange={e => setToken(e.target.value)} autoComplete="off" spellCheck={false} placeholder="粘贴 BotFather 提供的 Token" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" /></label>
      <button className={primary} disabled={busy || !token.trim()}>保存并连接机器人</button>
      {bot.configured && <button type="button" onClick={bind} className={button} disabled={busy}>绑定我的 Telegram</button>}
    </form>
    {binding && <p className="mt-3 text-sm"><a href={binding} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">打开 Telegram 并点击 Start</a>。绑定链接 10 分钟内有效，仅可使用一次。</p>}
    {notice && <p role="status" className="mt-3 text-sm text-slate-700">{notice}</p>}
  </details>;
}
