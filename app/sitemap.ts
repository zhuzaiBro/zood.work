import { createAdminClient } from '@/lib/supabase/server'
import { MetadataRoute } from 'next'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zood.work'

  // 获取所有静态页面
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/interview`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mock-interview`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faucet`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  try {
    const supabase = createAdminClient()

    // 获取所有文章
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false })

    const postPages = posts?.map((post) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })) || []

    // 获取所有分类
    const { data: categories } = await supabase
      .from('post_cates')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })

    const categoryPages = categories?.map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: new Date(category.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

    // 获取所有问题（如果有questions表）
    let questionPages: MetadataRoute.Sitemap = []
    try {
      const { data: questions } = await supabase
        .from('questions')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1000)

      questionPages = questions?.map((question) => ({
        url: `${baseUrl}/question/${question.id}`,
        lastModified: new Date(question.updated_at || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })) || []
    } catch (error) {
      // 如果没有questions表，跳过
      console.log('No questions table found, skipping...')
    }

    // 获取所有面试记录（如果有interviews表）
    let interviewPages: MetadataRoute.Sitemap = []
    try {
      const { data: interviews } = await supabase
        .from('interviews')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(500)

      interviewPages = interviews?.map((interview) => ({
        url: `${baseUrl}/interview/${interview.id}`,
        lastModified: new Date(interview.updated_at || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })) || []
    } catch (error) {
      // 如果没有interviews表，跳过
      console.log('No interviews table found, skipping...')
    }

    return [
      ...staticPages,
      ...postPages,
      ...categoryPages,
      ...questionPages,
      ...interviewPages,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // 如果数据库连接失败，返回静态页面
    return staticPages
  }
}
