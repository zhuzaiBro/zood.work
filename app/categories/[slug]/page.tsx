import { platformPublic, PlatformError } from '@/lib/platform/client'
import { notFound } from 'next/navigation'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

async function loadCategory(slug: string) {
  try {
    return await platformPublic<{ category: any; relations: any[] }>(
      `/api/platform/categories/by-slug?slug=${encodeURIComponent(slug)}`,
    )
  } catch (error) {
    if (error instanceof PlatformError && error.status === 404) return null
    console.error('Error fetching category:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const loaded = await loadCategory(slug)
  const category = loaded?.category

  return {
    title: category ? `${category.name} - zood的小破站` : '分类详情',
    description: category?.description || '',
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const loaded = await loadCategory(slug)
  const category = loaded?.category

  if (!category) {
    notFound()
  }

  const posts = (loaded?.relations ?? [])
    .map((rel: any) => rel.posts)
    .filter((post: any) => post && post.published && post.is_public)
    .sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 分类信息 */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-blue-600">首页</Link>
            {' '}/{' '}
            <Link href="/categories" className="hover:text-blue-600">分类</Link>
            {' '}/{' '}
            <span className="text-gray-900 dark:text-gray-100">{category.name}</span>
          </nav>

          <h1 className="text-4xl font-bold mb-3">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {category.description}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            共 {posts.length} 篇文章
          </p>
        </div>

        {/* 文章列表 */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">该分类下暂无文章</p>
          </div>
        )}
      </div>
    </div>
  )
}

