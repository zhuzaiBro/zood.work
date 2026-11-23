import type { Metadata } from 'next'
import { Inter, Micro_5 } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import AppShell from '@/components/AppShell'
import { shareDescription, siteShareTitle } from '@/lib/site-positioning'

const inter = Inter({ subsets: ['latin'] })

const siteLogoLatin = Micro_5({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-site-logo-latin',
  preload: false,
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://zood.work'),
  applicationName: 'zood.work',
  title: {
    template: '%s | zood.work - AI出海社区',
    default: siteShareTitle,
  },
  description: shareDescription,
  keywords: ['zood.work', 'AI出海社区', 'AI工具', '跨境业务', '海外求职', '面试准备'],
  authors: [{ name: '水煮油条(Zood)' }],
  creator: '水煮油条(Zood)',
  publisher: '水煮油条(Zood)',
  alternates: {
    canonical: '/',
  },
  category: 'technology',
  openGraph: {
    title: siteShareTitle,
    description: shareDescription,
    url: 'https://zood.work',
    siteName: 'zood.work',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/zood.jpg',
        width: 1200,
        height: 630,
        alt: siteShareTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteShareTitle,
    description: shareDescription,
    creator: '@zood_shuizhu',
    images: ['/zood.jpg'],
  },
  icons: {
    icon: [
      { url: '/brand/zood-icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/zood-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/zood-icon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/brand/zood-apple-touch.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/brand/zood-icon-32.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "油条TV - 水煮油条",
              "alternateName": ["zood的小破站", "水煮油条", "油条TV", "油条TV Web3"],
              "description": "分享 AI 工具与产品实践、跨境业务经验和海外求职方法，从作品积累到面试准备，一起探索面向全球的机会。",
              "url": "https://zood.work",
              "author": {
                "@type": "Person",
                "name": "水煮油条(Zood)",
                "alternateName": "zood",
                "jobTitle": "Web3开发者",
                "knowsAbout": ["AI工具", "产品实践", "跨境业务", "海外求职", "面试准备"]
              },
              "publisher": {
                "@type": "Organization",
                "name": "油条TV",
                "url": "https://zood.work"
              },
              "hasPart": [
                { "@type": "WebPage", "name": "Web3学习课程", "url": "https://zood.work/courses" },
                { "@type": "WebPage", "name": "远程工作岗位广场", "url": "https://zood.work/jobs" },
                { "@type": "WebPage", "name": "简历优化 Agent", "url": "https://zood.work/resume-agent" },
                { "@type": "WebPage", "name": "Web3 面试题库", "url": "https://zood.work/interview" }
              ],
              "sameAs": [
                "https://github.com/zood"
              ],
              "keywords": ["zood.work", "AI出海社区", "AI工具", "跨境业务", "海外求职", "面试准备"]
            })
          }}
        />
        <meta name="baidu-site-verification" content="codeva-No72IXIm4Y" />

      </head>
      <body className={`${inter.className} ${siteLogoLatin.variable}`}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
