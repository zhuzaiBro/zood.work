import assert from 'node:assert/strict'
import test from 'node:test'
import { adminUserListQuery } from '../lib/admin/userStudyClient.ts'

test('admin user query stays on the allowlisted page contract', () => {
  assert.equal(adminUserListQuery(), 'page=1&pageSize=12')
  assert.equal(
    adminUserListQuery({ page: 24, pageSize: 12, q: ' 100%_weird ', sort: 'today', order: 'desc' }),
    'page=24&pageSize=12&q=100%25_weird&sort=today&order=desc',
  )
  assert.equal(adminUserListQuery({ pageSize: 500, page: 0 }), 'page=1&pageSize=50')
})
