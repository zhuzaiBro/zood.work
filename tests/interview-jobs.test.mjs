import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../lib/interview-jobs.ts', import.meta.url), 'utf8')

test('interview jobs use the six requested names in order', () => {
  const names = [...source.matchAll(/name: '([^']+)'/g)].map((match) => match[1])
  assert.deepEqual(names, ['程序员', '设计', '跨境电商运营', '加密行业BD', '跨境电商BD', '加密行业运营'])
})
