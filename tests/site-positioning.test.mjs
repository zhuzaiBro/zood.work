import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const positioning = readFileSync(new URL('../lib/site-positioning.ts', import.meta.url), 'utf8')
const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')

test('site positioning is the exact phrase', () => {
  assert.match(positioning, /export const sitePositioning = 'AI出海社区'/)
  assert.match(positioning, /export const siteShareTitle = '油条TV - AI出海社区'/)
  assert.equal(positioning.includes('AI 出海'), false)
  assert.equal(positioning.includes('Web3学习、Agent学习路线'), false)
})

test('homepage metadata uses the shared title and does not keep the old slogan', () => {
  assert.match(home, /title:\s*\{\s*absolute:\s*siteShareTitle\s*\}/)
  assert.match(home, /description:\s*homeDescription/)
  assert.equal(home.includes('openGraph:'), false)
  assert.equal(home.includes('Web3学习、Agent学习路线与交易所攻略'), false)
})

test('root share metadata uses the same positioning', () => {
  for (const field of ['default: siteShareTitle', 'title: siteShareTitle', 'description: shareDescription']) {
    assert.equal(layout.includes(field), true, field)
  }
  assert.equal(layout.includes('Web3学习、Agent学习路线与远程工作攻略'), false)
  assert.equal(layout.includes('Web3学习、CEX项目、交易所攻略、远程工作和简历优化 Agent。'), false)
})
