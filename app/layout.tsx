import type { Metadata } from 'next'
import { Inter, Micro_5 } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import AppShell from '@/components/AppShell'

const inter = Inter({ subsets: ['latin'] })

const siteLogoLatin = Micro_5({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-site-logo-latin',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://zood.work'),
  applicationName: '油条TV',
  title: {
    template: '%s | 油条TV - Web3 与 AI 开发社区',
    default: '油条TV - Web3学习、Agent学习路线与远程工作攻略',
  },
  description: '油条TV（水煮油条）是面向开发者的 Web3 与 AI 学习社区，沉淀 agent学习路线、web3学习、cex项目复盘、交易所攻略、远程工作和远程攻略。',
  keywords: ['agent学习路线', '油条TV', 'web3学习', 'cex项目', '交易所攻略', '远程工作', '远程攻略', '水煮油条', 'zood', 'Web3前后端转型', 'web3面试', 'Web3开发', 'AI Agent', '区块链', '全栈开发'],
  authors: [{ name: '水煮油条(Zood)' }],
  creator: '水煮油条(Zood)',
  publisher: '水煮油条(Zood)',
  alternates: {
    canonical: '/',
  },
  category: 'technology',
  openGraph: {
    title: '油条TV - Web3学习、Agent学习路线与远程工作攻略',
    description: '面向开发者的 Web3 与 AI 学习社区，覆盖 agent学习路线、cex项目复盘、交易所攻略、远程工作和面试题库。',
    url: 'https://zood.work',
    siteName: '油条TV - 水煮油条',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/zood.jpg',
        width: 1200,
        height: 630,
        alt: '油条TV - Web3 与 AI 开发社区',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '油条TV - Web3学习、Agent学习路线与远程工作攻略',
    description: 'Web3学习、CEX项目、交易所攻略、远程工作和简历优化 Agent。',
    creator: '@zood_shuizhu',
    images: ['/zood.jpg'],
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
              "description": "油条TV（水煮油条）是面向开发者的 Web3 与 AI 学习社区，沉淀 agent学习路线、web3学习、cex项目复盘、交易所攻略、远程工作和远程攻略。",
              "url": "https://zood.work",
              "author": {
                "@type": "Person",
                "name": "水煮油条(Zood)",
                "alternateName": "zood",
                "jobTitle": "Web3开发者",
                "knowsAbout": ["agent学习路线", "web3学习", "cex项目", "交易所攻略", "远程工作", "远程攻略", "Web3开发", "AI Agent", "区块链技术", "Web3前后端转型"]
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
              "keywords": ["agent学习路线", "油条TV", "web3学习", "cex项目", "交易所攻略", "远程工作", "远程攻略", "Web3开发", "AI Agent", "web3面试"]
            })
          }}
        />
        <meta name="baidu-site-verification" content="codeva-No72IXIm4Y" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      </head>
      <body className={`${inter.className} ${siteLogoLatin.variable}`}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
