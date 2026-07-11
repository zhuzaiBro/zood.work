import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import {
  compactSessionId,
  sendTelegramMessage,
} from '@/lib/telegramSupport';

export const runtime = 'nodejs';

const requestSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
  pageUrl: z.string().url().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: '消息内容不合法' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { sessionId, content, pageUrl } = parsed.data;
    if (user && sessionId !== user.id) {
      return NextResponse.json({ error: '会话身份不匹配' }, { status: 403 });
    }

    const admin = createAdminClient();
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recentMessageCount, error: rateLimitError } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('sender_type', 'user')
      .gte('created_at', oneMinuteAgo);

    if (rateLimitError) throw new Error(rateLimitError.message);
    if ((recentMessageCount ?? 0) >= 5) {
      return NextResponse.json(
        { error: '发送得有点快，请稍后再试' },
        { status: 429 }
      );
    }

    const { data: siteMessage, error: insertError } = await admin
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: user?.id ?? null,
        sender_type: 'user',
        content,
      })
      .select('*')
      .single();

    if (insertError || !siteMessage) {
      throw new Error(insertError?.message || '保存消息失败');
    }

    const { data: supportAdmins, error: adminError } = await admin
      .from('telegram_support_admins')
      .select('chat_id')
      .eq('active', true);

    if (adminError) throw new Error(adminError.message);

    const visitor = user?.email || '匿名访客';
    const telegramText = [
      '网站客服新消息',
      `访客：${visitor}`,
      `会话：${compactSessionId(sessionId)}`,
      pageUrl ? `页面：${pageUrl}` : null,
      '',
      content,
      '',
      '请直接回复这条消息。',
    ]
      .filter((line) => line !== null)
      .join('\n');

    const results = await Promise.allSettled(
      (supportAdmins ?? []).map(async ({ chat_id: chatId }) => {
        const telegramMessage = await sendTelegramMessage(chatId, telegramText);
        const { error: linkError } = await admin
          .from('telegram_message_links')
          .insert({
            site_message_id: siteMessage.id,
            session_id: sessionId,
            telegram_chat_id: chatId,
            telegram_message_id: telegramMessage.message_id,
            direction: 'to_telegram',
          });
        if (linkError) throw new Error(linkError.message);
      })
    );

    const forwarded = results.filter(
      (result) => result.status === 'fulfilled'
    ).length;
    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('[chat/messages] Telegram 转发失败', result.reason);
      }
    });

    return NextResponse.json({ message: siteMessage, forwarded });
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送失败';
    console.error('[chat/messages]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
