/** Next 静态首页的 canonical 是 `/index`，浏览器地址是 `/`。导航配色必须把两者当成同一页，否则首屏 HTML 会和注水结果不一致。 */
export function normalizeSitePathname(pathname: string | null | undefined) {
  if (pathname == null || pathname === '' || pathname === '/index') return '/'
  return pathname
}

/** 白底内容页：固定 header 下使用浅色背景，避免深色 body 露出黑线 */
export function isLightContentPage(pathname: string | null | undefined) {
  const path = normalizeSitePathname(pathname)
  return (
    path.startsWith('/posts') ||
    path.startsWith('/interview') ||
    path.startsWith('/learn') ||
    path.startsWith('/courses') ||
    path.startsWith('/question') ||
    path.startsWith('/profile') ||
    path.startsWith('/resume-agent') ||
    path.startsWith('/mock-interview') ||
    path.startsWith('/categories')
  )
}

export function isDarkImmersivePage(pathname: string | null | undefined) {
  const path = normalizeSitePathname(pathname)
  return (
    path === '/' ||
    path === '/interview' ||
    path === '/learning-test' ||
    path.startsWith('/jobs')
  )
}

export type SiteHeaderSurface = 'light' | 'hero' | 'dark'
export type SiteHeaderWordmarkTone = 'on-light' | 'on-dark'
export type SiteHeaderAccountSlot = 'pending' | 'account' | 'login'

export function siteHeaderSurface(
  pathname: string | null | undefined,
  isHero: boolean,
): SiteHeaderSurface {
  if (isLightContentPage(pathname)) return 'light'
  if (isDarkImmersivePage(pathname) && isHero) return 'hero'
  if (isDarkImmersivePage(pathname)) return 'dark'
  return 'light'
}

export function siteHeaderWordmarkTone(
  pathname: string | null | undefined,
): SiteHeaderWordmarkTone {
  return isLightContentPage(pathname) || !isDarkImmersivePage(pathname)
    ? 'on-light'
    : 'on-dark'
}

/** 会话尚未确认时不渲染登录按钮，避免慢鉴权先闪出「登录」再换成头像。 */
export function siteHeaderAccountSlot(input: {
  isAuthenticated: boolean
  authResolved: boolean
}): SiteHeaderAccountSlot {
  if (input.isAuthenticated) return 'account'
  if (!input.authResolved) return 'pending'
  return 'login'
}
