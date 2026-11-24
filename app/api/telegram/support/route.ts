import { createPublicKey, verify } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { platformBaseUrl } from '@/lib/platform/http'

export const runtime = 'nodejs'

type Method = 'getMe' | 'setWebhook' | 'sendMessage'
const headers = { 'Cache-Control': 'private, no-store' }
const reject = (status: number) => new Response(null, { status, headers })
// Only the Video API has the private key corresponding to this public key.
const videoApiKey = createPublicKey({
  key: Buffer.from('MCowBQYDK2VwAyEAQO0pU743DwA9vF2lDNm4H38Lca6dAa2ce2gZOzDCU/M=', 'base64'),
  format: 'der', type: 'spki',
})

function parameters(method: Method, payload: Record<string, unknown>) {
  if (method === 'getMe') return {}
  if (method === 'setWebhook') {
    const url = platformBaseUrl() + '/api/platform/telegram/webhook'
    const secret = payload.secret_token
    if (payload.url !== url || typeof secret !== 'string' || !/^[a-f0-9]{64}$/.test(secret)) return null
    return { url, secret_token: secret, allowed_updates: ['message', 'callback_query'], drop_pending_updates: false }
  }
  const { chat_id, text } = payload
  if (typeof chat_id !== 'number' || !Number.isSafeInteger(chat_id) || chat_id <= 0 ||
      typeof text !== 'string' || !text || [...text].length > 4096) return null
  if (payload.reply_markup) {
    // This relay supports exactly one action on customer notifications.
    const markup = { inline_keyboard: [[{ text: '标为已读', callback_data: 'support_read' }]] }
    return { chat_id, text, reply_markup: markup }
  }
  return { chat_id, text }
}

export async function POST(request: Request) {
  const time = request.headers.get('x-zood-time') || ''
  const signature = request.headers.get('x-zood-signature') || ''
  if (!/^\d{10}$/.test(time) || Math.abs(Date.now() / 1000 - Number(time)) > 60 ||
      !/^[A-Za-z0-9+/]{86}==$/.test(signature)) return reject(401)
  if (Number(request.headers.get('content-length')) > 65536) return reject(413)
  const reader = request.body?.getReader()
  if (!reader) return reject(400)
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > 65536) {
      await reader.cancel()
      return reject(413)
    }
    chunks.push(value)
  }
  const raw = Buffer.concat(chunks)
  const signed = Buffer.concat([Buffer.from(time + '\n'), raw])
  if (!verify(null, signed, videoApiKey, Buffer.from(signature, 'base64'))) return reject(401)
  let call
  try { call = JSON.parse(raw.toString('utf8')) } catch { return reject(400) }
  if (!call || typeof call.token !== 'string' || !/^\d{4,20}:[\w-]{24,128}$/.test(call.token) ||
      !['getMe', 'setWebhook', 'sendMessage'].includes(call.method) ||
      !call.payload || typeof call.payload !== 'object' || Array.isArray(call.payload)) return reject(400)
  const input = parameters(call.method, call.payload)
  if (!input) return reject(400)

  try {
    // Telegram requires the token in its path. Keep it out of Next.js fetch tracing.
    const upstream = await new Promise<IncomingMessage>((resolve, onError) => {
      const req = httpsRequest({
        hostname: 'api.telegram.org', method: 'POST', path: '/bot' + call.token + '/' + call.method,
        headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(7000),
      }, resolve)
      req.on('error', onError)
      req.end(JSON.stringify(input))
    })
    upstream.setEncoding('utf8')
    let json = ''
    for await (const chunk of upstream) {
      json += chunk
      if (json.length > 131072) return reject(502)
    }
    const data = JSON.parse(json)
    if (data.ok === false && Number.isInteger(data.error_code) && data.error_code >= 400 && data.error_code <= 599) {
      return Response.json({ ok: false, error_code: data.error_code }, { status: data.error_code, headers })
    }
    if (upstream.statusCode !== 200 || data.ok !== true) return reject(502)
    let result
    if (call.method === 'getMe') {
      const { id, is_bot, username, active_usernames } = data.result
      result = { id, is_bot, username, active_usernames }
    } else if (call.method === 'sendMessage') {
      result = { message_id: data.result.message_id }
    } else {
      result = data.result === true
    }
    return Response.json({ ok: true, result }, { headers })
  } catch {
    return reject(502)
  }
}
