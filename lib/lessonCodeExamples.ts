export interface LessonCodeExample {
  id: string
  title: string
  language: string
  code: string
}

export function extractLessonCodeExamples(
  markdown?: string | null,
): LessonCodeExample[] {
  if (!markdown) return []

  const matches = [...markdown.matchAll(/```([\w-]*)\n([\s\S]*?)```/g)]

  return matches
    .map((match, index) => {
      const prefix = markdown.slice(0, match.index ?? 0)
      const headingMatches = [...prefix.matchAll(/^(#{1,6})\s+(.+)$/gm)]
      const nearestHeading = headingMatches[headingMatches.length - 1]?.[2]?.trim()
      const language = match[1]?.trim() || 'text'
      const code = match[2]?.trim()

      if (!code) return null

      return {
        id: `example-${index + 1}`,
        title: nearestHeading || `代码示例 ${index + 1}`,
        language,
        code,
      }
    })
    .filter((item): item is LessonCodeExample => Boolean(item))
}
