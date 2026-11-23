import { platformPublic } from '@/lib/platform/client'
import { Suspense } from 'react'
import Skeleton from '@/components/ui/Skeleton'
import { LoadingFrame, TextLines } from '@/components/ui/LoadingLayout'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import CareerDirections from '@/components/CareerDirections'
import TronHeroSection from '@/components/TronHeroSection'
import { homeDescription, siteShareTitle } from '@/lib/site-positioning'
import type { Metadata } from 'next'

export const revalidate = 60 // 每60秒重新验证

export const metadata: Metadata = {
  title: { absolute: siteShareTitle },
  description: homeDescription,
  keywords: ['zood.work', 'AI出海社区', 'AI工具', '跨境业务', '海外求职', '面试准备'],
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  return (
    <div className="-mt-20 bg-[#02050b]">
      <TronHeroSection />
      <CareerDirections />
      <div className="relative border-t border-[#101d38] bg-[linear-gradient(180deg,rgba(2,5,11,0.98),rgba(4,9,20,0.98))]">
        <div className="container mx-auto px-4 py-14 lg:py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#82dfff]">
                实践记录
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#f5f8ff]">
                社区笔记
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8da2c4]">
                已发布的笔记按原标题列在这里。
              </p>
            </div>
          </div>

          <Suspense fallback={<HomeFeedLoading />}>
            <HomeFeed />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function HomeFeed() {
  let posts: any[] | null = null
  let categories: any[] | null = null
  let error: { message: string } | null = null

  try {
    const [postsResult, categoriesResult] = await Promise.all([
      platformPublic<{ posts: any[]; count: number }>('/api/platform/posts?limit=10'),
      platformPublic<{ categories: any[] }>('/api/platform/categories'),
    ])
    posts = postsResult.posts ?? []
    categories = [...(categoriesResult.categories ?? [])].sort((a, b) =>
      String(a.name ?? '').localeCompare(String(b.name ?? ''), 'zh'),
    )
  } catch (loadError) {
    console.error('Error fetching posts:', loadError)
    error = { message: loadError instanceof Error ? loadError.message : '加载文章失败' }
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex-1">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <p className="text-red-600">加载文章失败</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts && posts.length > 0 ? (
              (posts as any[]).map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="rounded-2xl border border-[#172846] bg-[#07101f]/80 px-6 py-12 text-center shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <p className="text-[#9fb2d1]">还没有公开笔记</p>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="lg:w-80">
        <div className="mb-6 rounded-2xl border border-[#75c0f7]/25 bg-[#07101f]/82 p-6 shadow-[0_18px_45px_rgba(14,165,233,0.14)] backdrop-blur-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#75c0f7]">
            AI Tools
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#f5f8ff]">
            简历优化 Agent
          </h2>
          <p className="mt-3 leading-7 text-[#9fb2d1]">
            打开现有简历优化工具，整理求职材料。
          </p>
          <Link
            href="/resume-agent"
            className="mt-5 inline-flex rounded-full bg-[#75c0f7] px-4 py-2 text-sm font-black text-[#03111f] transition-transform hover:-translate-y-0.5"
          >
            去优化简历
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-[#75c0f7]/20 bg-[#07101f]/82 p-6 shadow-[0_18px_45px_rgba(14,165,233,0.10)] backdrop-blur-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#75c0f7]">
            Learning Maps
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#f5f8ff]">
            现有入口
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-6">
            {[
              ['AI 工具与产品实践', '/courses', '进入现有课程，按原课程内容查看。'],
              ['面试准备', '/interview', '进入现有题库，题目和分类保持原样。'],
              ['求职材料', '/resume-agent', '打开现有简历优化工具，整理求职材料。'],
              ['岗位信息', '/jobs', '查看已经同步的岗位列表。'],
            ].map(([title, href, desc]) => (
              <Link
                key={title}
                href={href}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[#9fb2d1] transition hover:border-[#75c0f7]/45 hover:bg-[#75c0f7]/10 hover:text-[#f5f8ff]"
              >
                <span className="block font-bold text-[#d9f4ff]">{title}</span>
                <span className="mt-1 block text-xs text-[#8093b2]">{desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {categories && categories.length > 0 && (
          <div className="rounded-2xl border border-[#172846] bg-[#07101f]/82 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.2)] backdrop-blur-sm">
            <h2 className="mb-4 text-xl font-bold text-[#f5f8ff]">知识专题</h2>
            <ul className="space-y-2">
              {(categories as any[]).map((category: any) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-[#93ddff] transition-colors hover:text-[#f5f8ff]"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}

function HomeFeedLoading() {
  return (
    <LoadingFrame label="正在加载社区笔记" className="dark-bones flex flex-col gap-8 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        {[0, 1].map(i => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-6">
            <Skeleton className="mb-3 h-8 w-2/3" /><TextLines count={2} /><Skeleton className="mt-4 h-5 w-32" />
          </div>
        ))}
      </div>
      <div className="lg:w-80">
        <div className="rounded-2xl border border-sky-300/20 bg-[#07101f] p-6">
          <Skeleton className="mb-2 h-5 w-20" /><Skeleton className="mb-4 h-7 w-36" />
          <TextLines count={2} /><Skeleton className="mt-5 h-9 w-24 rounded-full" />
        </div>
      </div>
    </LoadingFrame>
  )
}
