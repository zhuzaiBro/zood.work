import assert from 'node:assert/strict'
import http from 'node:http'
import test from 'node:test'

const { platformRequest, PlatformError } = await import('../lib/platform/http.ts')

function listen() {
  const requests = []
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      requests.push({
        method: req.method,
        url: req.url,
        authorization: req.headers.authorization || '',
        accept: req.headers.accept || '',
        body: Buffer.concat(chunks).toString('utf8'),
      })
      if (req.url === '/api/platform/admin/users/study') {
        res.writeHead(401, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: '未登录', code: 'UNAUTHORIZED' }))
        return
      }
      if (req.url === '/api/platform/courses?status=published') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ courses: [{ id: 'course', lessonCount: 2, totalDuration: 90 }] }))
        return
      }
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'missing' }))
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, requests, port: server.address().port }))
  })
}

test('platform client sends the caller token and preserves failure status', async () => {
  const { server, requests, port } = await listen()
  process.env.PLATFORM_API_BASE_URL = `http://127.0.0.1:${port}`
  delete process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL
  try {
    const ok = await platformRequest('/api/platform/courses?status=published', { cache: 'no-store' })
    assert.equal(ok.courses[0].totalDuration, 90)
    assert.equal(requests[0].authorization, '')
    assert.equal(requests[0].url, '/api/platform/courses?status=published')

    await assert.rejects(
      () => platformRequest('/api/platform/admin/users/study', { token: 'user-jwt', cache: 'no-store' }),
      (error) => error instanceof PlatformError && error.status === 401 && error.code === 'UNAUTHORIZED',
    )
    assert.equal(requests[1].method, 'GET')
    assert.equal(requests[1].authorization, 'Bearer user-jwt')
    assert.equal(requests[1].url, '/api/platform/admin/users/study')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
