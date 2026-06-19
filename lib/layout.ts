/** 白底内容页：固定 header 下使用浅色背景，避免深色 body 露出黑线 */
export function isLightContentPage(pathname: string) {
  return (
    pathname.startsWith('/learn') ||
    pathname.startsWith('/courses')
  )
}
