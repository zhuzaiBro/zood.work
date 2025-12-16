import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthProvider from '@/components/AuthProvider'
import FloatingContact from '@/components/FloatingContact'
import CozeChat from '@/components/CozeChat'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | 水煮油条(Zood) - Web3前后端转型',
    default: '水煮油条(Zood) - Web3面试 | 前后端转型 | 技术分享 | MetaNode社区',
  },
  description: '水煮油条(Zood)的小破站，专注于 Web3 面试经验分享、前后端开发技术教程、Web3前后端转型指导。提供最新的 Web3 面试题库、区块链技术资讯、MetaNode学院课程和全栈开发心得。油条TV视频教程，zood技术社区。',
  keywords: ['水煮油条', 'zood', 'zood的小破站', 'Web3前后端转型', 'MetaNode社区', 'MetaNode学院', '油条TV', 'web3面试', '前端面试', 'Web3开发', '区块链', '技术博客', '全栈开发'],
  authors: [{ name: '水煮油条(Zood)' }],
  creator: '水煮油条(Zood)',
  publisher: '水煮油条(Zood)',
  openGraph: {
    title: '水煮油条(Zood) - Web3面试 | 前端技术分享 | MetaNode社区',
    description: '专注于 Web3 面试经验分享、前端开发技术教程、Web3前后端转型指导。提供最新的 Web3 面试题库、区块链技术资讯、MetaNode学院课程。',
    siteName: '水煮油条(Zood) - zood的小破站',
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '水煮油条(Zood) - Web3前后端转型',
    description: 'Web3面试、前端技术分享、MetaNode社区',
    creator: '@zood_shuizhu',
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
              "name": "水煮油条(Zood) - zood的小破站",
              "alternateName": ["MetaNode社区", "MetaNode学院", "油条TV"],
              "description": "水煮油条(Zood)的小破站，专注于 Web3 面试经验分享、前后端开发技术教程、Web3前后端转型指导。提供最新的 Web3 面试题库、区块链技术资讯和全栈开发心得。",
              "url": "https://zood.work",
              "author": {
                "@type": "Person",
                "name": "水煮油条(Zood)",
                "alternateName": "zood",
                "jobTitle": "Web3开发者",
                "knowsAbout": ["Web3开发", "前端开发", "区块链技术", "Web3前后端转型"]
              },
              "publisher": {
                "@type": "Organization",
                "name": "水煮油条(Zood)",
                "url": "https://zood.work"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://zood.work/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "sameAs": [
                "https://github.com/zood"
              ],
              "keywords": ["水煮油条", "zood", "zood的小破站", "Web3前后端转型", "MetaNode社区", "MetaNode学院", "油条TV", "web3面试", "前端面试", "Web3开发", "区块链", "技术博客"]
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-20">
              {children}
            </main>
            <Footer />
            <FloatingContact />
            {/* <CozeChat /> */}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

