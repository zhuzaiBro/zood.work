import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = {
  title: '分类 - zood的小破站',
  description: '浏览所有博客分类',
}

export const revalidate = 60

export default async function CategoriesPage() {
  const supabase = await createClient()

  // 获取所有分类及其文章数量
  const { data: categories } = await supabase
    .from('post_cates')
    .select(`
      *,
      post_cate_relations (
        post_id
      )
    `)
    .order('name')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">所有分类</h1>

        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const postCount = category.post_cate_relations?.length || 0

              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h2 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {postCount} 篇文章
                  </p>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无分类</p>
          </div>
        )}
      </div>
    </div>
  )
}

