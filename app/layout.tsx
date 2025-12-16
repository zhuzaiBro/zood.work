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
    template: '%s | 水煮油条(Zood)',
    default: '水煮油条(Zood) - Web3面试 | 前端技术分享',
  },
  description: '水煮油条(Zood)的小破站，专注于 Web3 面试经验分享、前端开发技术教程。提供最新的 Web3 面试题库、区块链技术资讯和全栈开发心得。',
  keywords: ['水煮油条', 'zood', 'web3面试', '前端面试', 'Web3开发', '区块链', '技术博客'],
  openGraph: {
    title: '水煮油条(Zood) - Web3面试 | 前端技术分享',
    description: '专注于 Web3 面试经验分享、前端开发技术教程。提供最新的 Web3 面试题库、区块链技术资讯。',
    siteName: '水煮油条(Zood)',
    locale: 'zh_CN',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
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

