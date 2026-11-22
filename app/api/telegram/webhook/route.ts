import { NextRequest, NextResponse } from 'next/server';
import { platformBaseUrl } from '@/lib/platform/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  try {
    const response = await fetch(`${platformBaseUrl()}/api/platform/telegram/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': request.headers.get('x-telegram-bot-api-secret-token') || '',
      },
      body,
      cache: 'no-store',
    });
    const text = await response.text();
    if (!response.ok) {
      console.error('[telegram/webhook] platform', response.status, text);
      return NextResponse.json({ ok: true });
    }
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[telegram/webhook]', error);
    return NextResponse.json({ ok: true });
  }
}
