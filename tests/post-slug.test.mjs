import assert from 'node:assert/strict'
import test from 'node:test'
import { deriveAutoSlug, slugWasEdited } from '../lib/post-slug.ts'

const now = 1_700_000_000_000

test('pure Chinese from an empty slug gets one stable fallback', () => {
  const first = deriveAutoSlug('中文标题', { touched: false, slug: '', fallback: '' }, now)
  const second = deriveAutoSlug('中文标题继续写', { touched: false, slug: first.slug, fallback: first.fallback }, now + 50_000)
  assert.equal(first.slug.startsWith('post-'), true)
  assert.equal(second.slug, first.slug)
})

test('an English fragment becomes the slug and a later pure Chinese title replaces it', () => {
  const mixed = deriveAutoSlug('AI出海社区', { touched: false, slug: '', fallback: '' }, now)
  assert.equal(mixed.slug, 'ai')
  const cleared = deriveAutoSlug('', { touched: false, slug: mixed.slug, fallback: mixed.fallback }, now)
  assert.equal(cleared.slug, '')
  const again = deriveAutoSlug('纯中文标题', { touched: false, slug: cleared.slug, fallback: cleared.fallback }, now)
  assert.equal(again.slug.startsWith('post-'), true)
  assert.notEqual(again.slug, 'ai')
})

test('a manual slug survives title edits, clearing, and draft restore', () => {
  const manual = { touched: true, slug: 'my-note', fallback: '' }
  assert.equal(deriveAutoSlug('纯中文标题', manual, now).slug, 'my-note')
  assert.equal(deriveAutoSlug('', manual, now).slug, 'my-note')
  assert.equal(deriveAutoSlug('AI标题', manual, now).slug, 'my-note')
  assert.equal(slugWasEdited({ title: '纯中文', slug: 'my-note' }), true)
  assert.equal(slugWasEdited({ title: '纯中文', slug: 'post-abc', slugTouched: false }), false)
  assert.equal(slugWasEdited({ title: 'AI标题', slug: 'ai' }), false)
})
