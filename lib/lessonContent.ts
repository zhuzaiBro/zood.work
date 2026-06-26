export interface LessonContentFields {
  videoId?: string | null
  hasVideo?: boolean
  contentMarkdown?: string | null
  coursewareUrl?: string | null
}

export function hasLessonVideo(lesson: LessonContentFields) {
  return Boolean(lesson.hasVideo ?? lesson.videoId?.trim())
}

export function hasLessonDocument(lesson: LessonContentFields) {
  return Boolean(lesson.contentMarkdown?.trim() || lesson.coursewareUrl?.trim())
}

export function isDocumentOnlyLesson(lesson: LessonContentFields) {
  return hasLessonDocument(lesson) && !hasLessonVideo(lesson)
}
