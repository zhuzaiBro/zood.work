import assert from 'node:assert/strict'
import test from 'node:test'
import { initialLessonId, planCourseLoad } from '../lib/learn/courseLoadPlan.ts'

const courseId = '2afaa677-1f07-4d36-9b25-129a5fd346f1'

test('a stored session starts one authenticated course read while profile is still loading', () => {
  assert.deepEqual(
    planCourseLoad({
      courseId,
      hasSessionToken: true,
      authLoading: true,
      loaded: null,
    }),
    { type: 'fetch', mode: 'auth' },
  )
})

test('auth loading without a session waits instead of painting an anonymous payload', () => {
  assert.deepEqual(
    planCourseLoad({
      courseId,
      hasSessionToken: false,
      authLoading: true,
      loaded: null,
    }),
    { type: 'wait' },
  )
})

test('an authenticated course payload is not fetched again when profile loading ends', () => {
  assert.deepEqual(
    planCourseLoad({
      courseId,
      hasSessionToken: true,
      authLoading: false,
      loaded: { courseId, mode: 'auth', isFree: false },
    }),
    { type: 'skip' },
  )
})

test('a paid anonymous payload is upgraded once when a session token appears', () => {
  assert.deepEqual(
    planCourseLoad({
      courseId,
      hasSessionToken: true,
      authLoading: false,
      loaded: { courseId, mode: 'anon', isFree: false },
    }),
    { type: 'fetch', mode: 'auth' },
  )
  assert.deepEqual(
    planCourseLoad({
      courseId,
      hasSessionToken: true,
      authLoading: false,
      loaded: { courseId, mode: 'auth', isFree: false },
    }),
    { type: 'skip' },
  )
})

test('a free course fetched anonymously is not refetched after login', () => {
  assert.deepEqual(
    planCourseLoad({
      courseId,
      hasSessionToken: true,
      authLoading: false,
      loaded: { courseId, mode: 'anon', isFree: true },
    }),
    { type: 'skip' },
  )
})

test('changing course id fetches again instead of reusing the previous payload', () => {
  assert.deepEqual(
    planCourseLoad({
      courseId: 'another-course',
      hasSessionToken: true,
      authLoading: false,
      loaded: { courseId, mode: 'auth', isFree: false },
    }),
    { type: 'fetch', mode: 'auth' },
  )
})

test('logout replaces an authenticated payload so video ids are not kept', () => {
  assert.deepEqual(
    planCourseLoad({
      courseId,
      hasSessionToken: false,
      authLoading: false,
      loaded: { courseId, mode: 'auth', isFree: false },
    }),
    { type: 'fetch', mode: 'anon' },
  )
})

test('the document shell can choose a lesson before remote progress returns', () => {
  const lessons = ['lesson-1', 'lesson-2']
  assert.equal(initialLessonId(lessons, 'lesson-2'), 'lesson-2')
  assert.equal(initialLessonId(lessons, 'missing'), 'lesson-1')
  assert.equal(initialLessonId(lessons, null), 'lesson-1')
  assert.equal(initialLessonId([], 'lesson-1'), null)
})
