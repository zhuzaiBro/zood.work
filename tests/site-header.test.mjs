import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  normalizeSitePathname,
  siteHeaderAccountSlot,
  siteHeaderSurface,
  siteHeaderWordmarkTone,
} from '../lib/layout.ts'

test('the static homepage pathname /index uses the same hero chrome as /', () => {
  assert.equal(normalizeSitePathname('/index'), '/')
  assert.equal(normalizeSitePathname('/'), '/')
  assert.equal(normalizeSitePathname(''), '/')
  assert.equal(normalizeSitePathname(null), '/')
  assert.equal(siteHeaderSurface('/index', true), 'hero')
  assert.equal(siteHeaderSurface('/', true), 'hero')
  assert.equal(siteHeaderWordmarkTone('/index'), 'on-dark')
  assert.equal(siteHeaderWordmarkTone('/'), 'on-dark')
})

test('a scrolled immersive page keeps a dark bar and a white wordmark', () => {
  assert.equal(siteHeaderSurface('/', false), 'dark')
  assert.equal(siteHeaderSurface('/jobs/42', false), 'dark')
  assert.equal(siteHeaderWordmarkTone('/'), 'on-dark')
  assert.equal(siteHeaderWordmarkTone('/jobs'), 'on-dark')
  // `/learn` is a prefix of this path, so the existing light-page rule still wins.
  assert.equal(siteHeaderSurface('/learning-test', true), 'light')
})

test('light content pages keep a light bar and a dark wordmark', () => {
  for (const path of ['/learn', '/courses', '/posts/hello', '/profile', '/resume-agent']) {
    assert.equal(siteHeaderSurface(path, true), 'light', path)
    assert.equal(siteHeaderWordmarkTone(path), 'on-light', path)
  }
  assert.equal(siteHeaderSurface('/interview', true), 'light')
})

test('the header does not show login while the session check is unresolved', () => {
  assert.equal(
    siteHeaderAccountSlot({ isAuthenticated: false, authResolved: false }),
    'pending',
  )
  assert.equal(
    siteHeaderAccountSlot({ isAuthenticated: true, authResolved: false }),
    'account',
  )
  assert.equal(
    siteHeaderAccountSlot({ isAuthenticated: false, authResolved: true }),
    'login',
  )
})

test('the decorative full-screen dot grid is gone and header colors are real CSS', () => {
  const sources = [
    'components/TronHeroSection.tsx',
    'app/jobs/page.tsx',
    'app/jobs/[id]/page.tsx',
    'components/jobs/JobAgentClient.tsx',
    'app/resume-agent/page.tsx',
  ]
  for (const file of sources) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    assert.equal(/transparent(?:\s|_)1px/.test(text), false, file)
  }
  const hero = readFileSync(new URL('../components/TronHeroSection.tsx', import.meta.url), 'utf8')
  assert.match(hero, /pointTexture/)
  assert.match(hero, /radial-gradient\(circle at 18% 22%/)
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.site-header-light[\s\S]*247 250 254 \/ 0\.88/)
  assert.match(css, /\.site-header-dark[\s\S]*6 18 37 \/ 0\.82/)
  assert.match(css, /\.site-header-hero[\s\S]*background-color: transparent/)
})
