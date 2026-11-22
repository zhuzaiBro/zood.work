export type CourseLoadMode = "auth" | "anon";

export type CourseLoadState = {
  courseId: string;
  mode: CourseLoadMode;
  isFree: boolean;
};

export type CourseLoadAction =
  | { type: "wait" }
  | { type: "skip" }
  | { type: "fetch"; mode: CourseLoadMode };

/**
 * Decide the next course read for /learn.
 * A session token is enough to call the platform course API once. Profile
 * loading must not block that read, and a successful authenticated read must
 * not be followed by a second same-origin /api/courses request.
 * Remote progress is not an input: the shell can paint from the course payload
 * and local progress before /api/learning/progress returns.
 */
export function planCourseLoad(input: {
  courseId: string;
  hasSessionToken: boolean;
  authLoading: boolean;
  loaded: CourseLoadState | null;
}): CourseLoadAction {
  const courseId = input.courseId || "";
  const loaded = input.loaded;

  if (loaded?.mode === "auth") {
    if (loaded.courseId === courseId && !input.hasSessionToken && !input.authLoading) {
      return { type: "fetch", mode: "anon" };
    }
    if (loaded.courseId === courseId) return { type: "skip" };
  }

  if (!input.hasSessionToken && input.authLoading) return { type: "wait" };

  const mode: CourseLoadMode = input.hasSessionToken ? "auth" : "anon";
  if (!loaded || loaded.courseId !== courseId) return { type: "fetch", mode };
  if (loaded.mode === mode) return { type: "skip" };
  if (loaded.isFree) return { type: "skip" };
  return { type: "fetch", mode };
}

export function initialLessonId(
  lessonIds: readonly string[],
  localLessonId?: string | null,
): string | null {
  if (lessonIds.length === 0) return null;
  if (localLessonId && lessonIds.includes(localLessonId)) return localLessonId;
  return lessonIds[0];
}
