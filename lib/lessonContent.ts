export interface LessonContentFields {
  videoId?: string | null
  contentMarkdown?: string | null
}

export function hasLessonVideo(lesson: LessonContentFields) {
  return Boolean(lesson.videoId?.trim())
}

export function hasLessonDocument(lesson: LessonContentFields) {
  return Boolean(lesson.contentMarkdown?.trim())
}

export function isDocumentOnlyLesson(lesson: LessonContentFields) {
  return hasLessonDocument(lesson) && !hasLessonVideo(lesson)
}
