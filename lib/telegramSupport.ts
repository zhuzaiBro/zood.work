import 'server-only';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

export type TelegramSentMessage = {
  message_id: number;
  chat: { id: number };
};

function getTelegramToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('缺少 TELEGRAM_BOT_TOKEN');
  return token;
}

export function getTelegramWebhookSecret() {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) throw new Error('缺少 TELEGRAM_WEBHOOK_SECRET');
  return secret;
}

export function getTelegramSetupSecret() {
  const secret = process.env.TELEGRAM_SETUP_SECRET;
  if (!secret) throw new Error('缺少 TELEGRAM_SETUP_SECRET');
  return secret;
}

export async function callTelegram<T>(
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${getTelegramToken()}/${method}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  );
  const payload = (await response.json()) as TelegramApiResponse<T>;
  if (!response.ok || !payload.ok || payload.result === undefined) {
    throw new Error(payload.description || `Telegram ${method} 请求失败`);
  }
  return payload.result;
}

export function sendTelegramMessage(
  chatId: number,
  text: string,
  replyToMessageId?: number
) {
  return callTelegram<TelegramSentMessage>('sendMessage', {
    chat_id: chatId,
    text,
    ...(replyToMessageId
      ? { reply_parameters: { message_id: replyToMessageId } }
      : {}),
  });
}

export function compactSessionId(sessionId: string) {
  return `${sessionId.slice(0, 8)}...${sessionId.slice(-4)}`;
}
