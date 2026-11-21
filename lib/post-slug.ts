export function asciiSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function slugWasEdited(draft: { title?: string; slug?: string; slugTouched?: boolean }) {
  if (draft.slugTouched === true) return true
  if (draft.slugTouched === false) return false
  const slug = draft.slug ?? ''
  if (!slug) return false
  const ascii = asciiSlug(draft.title ?? '')
  if (slug === ascii) return false
  if (!ascii && slug.startsWith('post-')) return false
  return true
}

export function deriveAutoSlug(
  title: string,
  state: { touched: boolean; slug: string; fallback: string },
  now = Date.now(),
) {
  if (state.touched) {
    return { slug: state.slug, fallback: state.fallback }
  }
  if (!title.trim()) {
    return { slug: '', fallback: '' }
  }
  const ascii = asciiSlug(title)
  if (ascii) {
    return { slug: ascii, fallback: '' }
  }
  const fallback = state.fallback || `post-${now.toString(36)}`
  return { slug: fallback, fallback }
}
