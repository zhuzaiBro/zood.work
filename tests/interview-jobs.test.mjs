import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { interviewIndexRequest, interviewJobs } from '../lib/interview-jobs.ts'

const source = readFileSync(new URL('../lib/interview-jobs.ts', import.meta.url), 'utf8')
const indexPage = readFileSync(new URL('../app/interview/page.tsx', import.meta.url), 'utf8')
const detailPage = readFileSync(new URL('../app/interview/[id]/page.tsx', import.meta.url), 'utf8')

test('interview jobs use the six requested names in order', () => {
  const names = [...source.matchAll(/name: '([^']+)'/g)].map((match) => match[1])
  assert.deepEqual(names, ['程序员', '设计', '跨境电商运营', '加密行业BD', '跨境电商BD', '加密行业运营'])
})

test('every known job tab requests that role collection list', () => {
  assert.equal(interviewIndexRequest(undefined).path, '/api/platform/interview')
  assert.equal(interviewIndexRequest('programmer').path, '/api/platform/interview')
  assert.equal(interviewIndexRequest('programmer', 'react').path, '/api/platform/interview?tag=react')

  for (const job of interviewJobs) {
    if (job.slug === 'programmer') continue
    const request = interviewIndexRequest(job.slug, 'react')
    assert.equal(request.unknownJob, false)
    assert.equal(request.technical, false)
    assert.equal(request.activeSlug, job.slug)
    assert.equal(request.activeName, job.name)
    assert.equal(request.path, `/api/platform/interview?role=${job.slug}`)
  }
})

test('an unknown role does not call the interview API', () => {
  const request = interviewIndexRequest('not-a-job')
  assert.equal(request.unknownJob, true)
  assert.equal(request.path, null)
  assert.equal(request.activeSlug, '')
})

test('the interview index renders collections for every fetched role', () => {
  assert.match(indexPage, /interviewIndexRequest\(params\.role, params\.tag\)/)
  assert.match(indexPage, /if \(index\.path\)/)
  assert.match(indexPage, /!index\.unknownJob && collections\.map/)
  assert.match(indexPage, /暂无面试题集/)
  assert.match(indexPage, /还没有面试题/)
  assert.match(indexPage, /没有这个岗位/)
  assert.doesNotMatch(indexPage, /if \(technical\)/)
})

test('collection detail does not nest an untagged force-cache fetch', () => {
  assert.doesNotMatch(detailPage, /cache:\s*'force-cache'/)
  assert.match(detailPage, /cache:\s*'no-store'/)
  assert.match(detailPage, /interview-collection-page-v4/)
  assert.match(detailPage, /tags:\s*\['interview-collections'\]/)
  assert.match(detailPage, /revalidate:\s*300/)
})
