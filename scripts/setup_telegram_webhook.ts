import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!token || !webhookSecret || !siteUrl) {
  throw new Error(
    '需要配置 TELEGRAM_BOT_TOKEN、TELEGRAM_WEBHOOK_SECRET 和 NEXT_PUBLIC_SITE_URL'
  );
}

const webhookUrl = new URL('/api/telegram/webhook', siteUrl).toString();
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: webhookSecret,
    allowed_updates: ['message'],
    drop_pending_updates: false,
  }),
});
const payload = (await response.json()) as {
  ok: boolean;
  description?: string;
};

if (!response.ok || !payload.ok) {
  throw new Error(payload.description || 'Telegram webhook 配置失败');
}

console.log(`Telegram webhook 已配置：${webhookUrl}`);
