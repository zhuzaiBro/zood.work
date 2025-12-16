import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import ThreeBackground from '@/components/ThreeBackground'
import ScrollSections from '@/components/ScrollSections'

export const revalidate = 60 // 每60秒重新验证

export default async function Home() {
  const supabase = await createClient()

  // 获取已发布的文章
  const { data: posts, error } = await supabase
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
    .limit(10)

  // 获取分类
  const { data: categories } = await supabase
    .from('post_cates')
    .select('*')
    .order('name')

  // 如果出错，返回错误信息（但仍保留背景效果）
  if (error) {
    console.error('Error fetching posts:', error)
    // 我们也可以在这里返回带有背景的错误页面，但为了简单，先只返回错误
  }

  return (
    <div className="min-h-[350vh] relative">
      <ThreeBackground />
      <ScrollSections />

      {/* 内容区域，向下偏移以便第一屏展示特效 */}
      <div className="relative z-10 container mx-auto px-4 py-8 mt-[100vh]">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 主内容区 */}
          <div className="flex-1">
            {error ? (
              <div className="text-center py-12 bg-red-500/10 rounded-lg">
                <p className="text-red-500">加载文章失败</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts && posts.length > 0 ? (
                  (posts as any[]).map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white/5 rounded-lg backdrop-blur-sm">
                    <p className="text-gray-400">暂无文章</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <aside className="lg:w-80">
            <div className="bg-black/30 backdrop-blur-sm border-white/10 border rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-white">关于</h2>
              <p className="text-gray-300">
                这是一个使用 Next.js 和 Supabase 构建的现代博客系统。
              </p>
            </div>

            {categories && categories.length > 0 && (
              <div className="bg-black/30 backdrop-blur-sm border-white/10 border rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-white">分类</h2>
                <ul className="space-y-2">
                  {(categories as any[]).map((category: any) => (
                    <li key={category.id}>
                      <Link
                        href={`/categories/${category.slug}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
  )
}
