import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import TronHeroSection from '@/components/TronHeroSection'

export const revalidate = 60 // 每60秒重新验证

export default async function Home() {
  const supabase = await createClient()

  const [
    { data: posts, error },
    { count: publishedCount },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select(`
        *,
        author:user_profiles!fk_user_profiles_posts (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('published', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('published', true)
      .eq('is_public', true),
    supabase
      .from('post_cates')
      .select('*')
      .order('name'),
  ])

  // 如果出错，返回错误信息（但仍保留背景效果）
  if (error) {
    console.error('Error fetching posts:', error)
  }

  return (
    <div className="-mt-20 bg-[#02050b]">
      <TronHeroSection
        publishedCount={publishedCount ?? posts?.length ?? 0}
        categoryCount={categories?.length ?? 0}
      />

      <div className="relative border-t border-[#101d38] bg-[linear-gradient(180deg,rgba(2,5,11,0.98),rgba(4,9,20,0.98))]">
        <div className="container mx-auto px-4 py-14 lg:py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#82dfff]">
                Community Notes
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#f5f8ff]">
                Web3 与 AI 开发笔记
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8da2c4]">
                收集学习路线、工程实践、合约开发、AI 应用和面试复盘，适合想从前后端进入新技术栈的开发者慢慢啃。
              </p>
            </div>
          </div>

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
              <div className="mb-6 rounded-2xl border border-[#172846] bg-[#07101f]/82 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                <h2 className="mb-4 text-xl font-bold text-[#f5f8ff]">社区定位</h2>
                <p className="leading-7 text-[#9fb2d1]">
                  面向想学习 Web3、AI 应用开发和全栈工程的开发者。这里更关注能跑起来的项目、可复用的经验和真实踩坑记录。
                </p>
              </div>

              <div className="mb-6 rounded-2xl border border-[#75c0f7]/25 bg-[#07101f]/82 p-6 shadow-[0_18px_45px_rgba(14,165,233,0.14)] backdrop-blur-sm">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#75c0f7]">
                  AI Tools
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#f5f8ff]">
                  简历优化 Agent
                </h2>
                <p className="mt-3 leading-7 text-[#9fb2d1]">
                  用 LangChain.js 和 LangGraph.js 跑一条简历分析、策略规划、改写输出的 Agent 流程。
                </p>
                <Link
                  href="/resume-agent"
                  className="mt-5 inline-flex rounded-full bg-[#75c0f7] px-4 py-2 text-sm font-black text-[#03111f] transition-transform hover:-translate-y-0.5"
                >
                  去优化简历
                </Link>
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
        </div>
      </div>
    </div>
  )
}
