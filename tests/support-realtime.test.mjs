import assert from 'node:assert/strict'
import test from 'node:test'
import { platformHeaders } from '../lib/platform/http.ts'
import {
  mergeChatMessages,
  messageFromBroadcast,
  publicTelegramConfig,
  shouldCloseRealtime,
} from '../lib/support/chatRealtime.ts'

const sessionA = '11111111-1111-4111-8111-111111111111'
const sessionB = '22222222-2222-4222-8222-222222222222'

test('catch-up keeps the first copy and does not duplicate an event', () => {
  const current = [{ id: 'a', created_at: '2026-11-22T00:00:02Z', content: 'live' }]
  const fetched = [
    { id: 'a', created_at: '2026-11-22T00:00:02Z', content: 'stored' },
    { id: 'b', created_at: '2026-11-22T00:00:01Z', content: 'older' },
  ]
  assert.deepEqual(mergeChatMessages(current, fetched), [
    { id: 'b', created_at: '2026-11-22T00:00:01Z', content: 'older' },
    { id: 'a', created_at: '2026-11-22T00:00:02Z', content: 'live' },
  ])
  assert.equal(mergeChatMessages(fetched, fetched).length, 2)
})

test('a broadcast for another session is ignored and logout changes the channel key', () => {
  const own = messageFromBroadcast({
    id: '44444444-4444-4444-8444-444444444444',
    session_id: sessionA,
    sender_type: 'admin',
    content: '收到',
    created_at: '2026-11-22T00:00:03Z',
    user_id: sessionA,
    pageUrl: 'https://www.zood.work/learn',
  }, sessionA)
  assert.equal(own?.user_id, null)
  assert.equal(own?.content, '收到')
  assert.equal(messageFromBroadcast({ ...own, session_id: sessionB }, sessionA), null)
  assert.equal(shouldCloseRealtime(sessionA, sessionB), true)
  assert.equal(shouldCloseRealtime(sessionA, sessionA), false)
  assert.equal(shouldCloseRealtime(sessionA, null), true)
})

test('the admin config response exposes only the mask', () => {
  const view = publicTelegramConfig({
    telegramBotToken: { configured: true, hint: '9012', token: '123456789:secret' },
  })
  assert.deepEqual(view, { configured: true, hint: '9012' })
  assert.equal(JSON.stringify(view).includes('123456789'), false)
})

test('caller headers cannot replace the platform authorization', () => {
  const headers = platformHeaders({
    token: 'session-token',
    headers: {
      Authorization: 'Bearer injected',
      Cookie: 'sb=injected',
      'X-Zood-Request': 'support-config',
    },
  })
  assert.equal(headers.get('Authorization'), 'Bearer session-token')
  assert.equal(headers.get('Cookie'), null)
  assert.equal(headers.get('X-Zood-Request'), 'support-config')
})
