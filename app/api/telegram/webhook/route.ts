import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  getTelegramSetupSecret,
  getTelegramWebhookSecret,
  sendTelegramMessage,
} from '@/lib/telegramSupport';

export const runtime = 'nodejs';

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: { id: number; username?: string };
    reply_to_message?: { message_id: number };
  };
};

async function bindSupportAdmin(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.text || !message.from) return false;

  const [command, suppliedSecret] = message.text.trim().split(/\s+/, 2);
  if (command !== '/start' || suppliedSecret !== getTelegramSetupSecret()) {
    return false;
  }

  const admin = createAdminClient();
  const { error } = await admin.from('telegram_support_admins').upsert(
    {
      chat_id: message.chat.id,
      telegram_user_id: message.from.id,
      username: message.from.username ?? null,
      active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'chat_id' }
  );
  if (error) throw new Error(error.message);

  await sendTelegramMessage(
    message.chat.id,
    '绑定成功。之后网站访客发来的消息会出现在这里，直接回复对应消息即可。'
  );
  return true;
}

export async function POST(request: NextRequest) {
  if (
    request.headers.get('x-telegram-bot-api-secret-token') !==
    getTelegramWebhookSecret()
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    if (await bindSupportAdmin(update)) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    if (!message?.text || !message.from) {
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();
    const { data: supportAdmin } = await admin
      .from('telegram_support_admins')
      .select('chat_id')
      .eq('chat_id', message.chat.id)
      .eq('telegram_user_id', message.from.id)
      .eq('active', true)
      .maybeSingle();

    if (!supportAdmin) {
      await sendTelegramMessage(message.chat.id, '当前账号未绑定为网站客服。');
      return NextResponse.json({ ok: true });
    }

    const repliedMessageId = message.reply_to_message?.message_id;
    if (!repliedMessageId) {
      await sendTelegramMessage(
        message.chat.id,
        '请使用 Telegram 的“回复”功能，回复一条网站访客消息。'
      );
      return NextResponse.json({ ok: true });
    }

    const { data: existingUpdate } = await admin
      .from('telegram_message_links')
      .select('id')
      .eq('telegram_update_id', update.update_id)
      .maybeSingle();
    if (existingUpdate) return NextResponse.json({ ok: true });

    const { data: originalLink } = await admin
      .from('telegram_message_links')
      .select('session_id')
      .eq('telegram_chat_id', message.chat.id)
      .eq('telegram_message_id', repliedMessageId)
      .eq('direction', 'to_telegram')
      .maybeSingle();

    if (!originalLink) {
      await sendTelegramMessage(message.chat.id, '找不到对应的网站会话，请回复较新的访客消息。');
      return NextResponse.json({ ok: true });
    }

    const { data: siteMessage, error: messageError } = await admin
      .from('messages')
      .insert({
        session_id: originalLink.session_id,
        sender_type: 'admin',
        content: message.text.trim().slice(0, 2000),
      })
      .select('id')
      .single();
    if (messageError || !siteMessage) {
      throw new Error(messageError?.message || '客服回复入库失败');
    }

    const { error: linkError } = await admin.from('telegram_message_links').insert({
      site_message_id: siteMessage.id,
      session_id: originalLink.session_id,
      telegram_chat_id: message.chat.id,
      telegram_message_id: message.message_id,
      telegram_update_id: update.update_id,
      direction: 'from_telegram',
    });
    if (linkError && linkError.code !== '23505') throw new Error(linkError.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram/webhook]', error);
    return NextResponse.json({ ok: true });
  }
}
