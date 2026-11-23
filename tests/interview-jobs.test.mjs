import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildInterviewDirectory } from '../lib/interview/directory.ts'
import { interviewIndexRequest, interviewJobs } from '../lib/interview-jobs.ts'

const source = readFileSync(new URL('../lib/interview-jobs.ts', import.meta.url), 'utf8')
const indexPage = readFileSync(new URL('../app/interview/page.tsx', import.meta.url), 'utf8')
const collectionLoader = readFileSync(new URL('../lib/interview/getCollectionPageData.ts', import.meta.url), 'utf8')
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
  assert.match(indexPage, /if \(index\.path && !isSearching\)/)
  assert.match(indexPage, /buildInterviewDirectory\(collections, questionCounts\)/)
  assert.match(indexPage, /暂无面试题集/)
  assert.match(indexPage, /还没有面试题/)
  assert.match(indexPage, /没有这个岗位/)
  assert.doesNotMatch(indexPage, /if \(technical\)/)
})

test('feature the newest playable set once and keep the other playable sets in API order', () => {
  const collections = [
    { id: 'empty', created_at: '2026-10-04' },
    { id: 'old', created_at: '2026-06-02' },
    { id: 'new', created_at: '2026-10-02' },
    { id: 'middle', created_at: '2026-07-02' },
  ]
  const directory = buildInterviewDirectory(collections, { old: 2, new: 3, middle: 1 })
  assert.equal(directory.featured.id, 'new')
  assert.deepEqual(directory.remaining.map((entry) => entry.id), ['old', 'middle', 'empty'])
  assert.equal(directory.totalQuestions, 6)

  const single = buildInterviewDirectory([collections[2]], [{ collection_id: 'new', question_count: '3' }])
  assert.equal(single.featured.id, 'new')
  assert.equal(single.totalQuestions, 3)
  assert.deepEqual(single.remaining, [])

  const empty = buildInterviewDirectory(collections, null)
  assert.equal(empty.featured, undefined)
  assert.deepEqual(empty.remaining.map((entry) => entry.id), collections.map((entry) => entry.id))
})

test('the collection detail and preview share the same invalidatable data', () => {
  const preview = readFileSync(new URL('../components/interview/CollectionFeature.tsx', import.meta.url), 'utf8')
  assert.match(detailPage, /await getCollectionPageData\(id\)/)
  assert.match(preview, /await getCollectionPageData\(collectionId\)/)
  assert.doesNotMatch(collectionLoader, /cache:\s*'force-cache'/)
  assert.match(collectionLoader, /cache:\s*'no-store'/)
  assert.match(collectionLoader, /interview-collection-page-v4/)
  assert.match(collectionLoader, /tags:\s*\['interview-collections'\]/)
  assert.match(collectionLoader, /revalidate:\s*300/)
})
