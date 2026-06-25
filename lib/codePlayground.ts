const RUNNABLE_LANGUAGES = new Set([
  'python',
  'py',
  'rust',
  'javascript',
  'js',
  'typescript',
  'ts',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'cs',
  'ruby',
  'rb',
  'php',
  'kotlin',
  'swift',
])

const ONE_COMPILER_LANG: Record<string, string> = {
  python: 'python',
  py: 'python',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  cs: 'csharp',
  ruby: 'ruby',
  rb: 'ruby',
  php: 'php',
  kotlin: 'kotlin',
  swift: 'swift',
}

/** 与 tourofrust.com 一致的 iframe sandbox */
export const PLAYGROUND_IFRAME_SANDBOX =
  'allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals'

export function isRunnableLanguage(language: string) {
  return RUNNABLE_LANGUAGES.has(language.toLowerCase())
}

/**
 * Rust 官方 Playground，与 tourofrust.com 相同：
 * https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&code=...
 */
export function buildRustPlaygroundUrl(code: string) {
  const params = new URLSearchParams({
    version: 'stable',
    mode: 'debug',
    edition: '2021',
    code,
  })
  return `https://play.rust-lang.org/?${params.toString()}`
}

/**
 * 自托管 Python Playground，同样通过 ?code= 传入源码
 */
export function buildPythonPlaygroundUrl(code: string) {
  const params = new URLSearchParams({ code })
  return `/playground/python.html?${params.toString()}`
}

export function buildOneCompilerEmbedUrl(language: string, code: string) {
  const slug = ONE_COMPILER_LANG[language.toLowerCase()] ?? 'python'
  const params = new URLSearchParams({ code })
  return `https://onecompiler.com/embed/${slug}?${params.toString()}`
}

export function buildPlaygroundEmbedUrl(language: string, code: string) {
  const lang = language.toLowerCase()
  if (lang === 'rust') {
    return buildRustPlaygroundUrl(code)
  }
  if (lang === 'python' || lang === 'py') {
    return buildPythonPlaygroundUrl(code)
  }
  return buildOneCompilerEmbedUrl(language, code)
}

export function getPlaygroundTitle(language: string) {
  if (language.toLowerCase() === 'rust') {
    return 'Rust Playground'
  }
  if (language.toLowerCase() === 'python' || language.toLowerCase() === 'py') {
    return 'Python Playground'
  }
  const slug = ONE_COMPILER_LANG[language.toLowerCase()] ?? 'python'
  return `${slug.charAt(0).toUpperCase()}${slug.slice(1)} Playground`
}

export function buildPlaygroundExternalUrl(language: string, code: string) {
  const embedUrl = buildPlaygroundEmbedUrl(language, code)
  if (embedUrl.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${embedUrl}`
    }
    return embedUrl
  }
  return embedUrl
}
