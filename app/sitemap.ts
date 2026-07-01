import { createAdminClient } from '@/lib/supabase/server'
import { MetadataRoute } from 'next'

export const revalidate = 86400

const BASE_URL = 'https://zood.work'
const PAGE_SIZE = 1000

type SitemapEntry = MetadataRoute.Sitemap[number]

type PostSitemapRow = { slug: string; updated_at: string | null }
type CategorySitemapRow = { slug: string; created_at: string | null }
type CourseSitemapRow = { id: string; updated_at: string }
type CollectionSitemapRow = { id: string; updated_at: string }
type QuestionSitemapRow = { id: string; updated_at: string }
type TagSitemapRow = { slug: string; created_at: string }
type JobSitemapRow = { id: string; updated_at: string | null; last_synced_at: string | null }

async function fetchAllPages<T>(
  query: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

function toLastModified(value: string | null | undefined) {
  return value ? new Date(value) : new Date()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: SitemapEntry[] = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/interview`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/jobs/agent`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.82,
    },
    {
      url: `${BASE_URL}/resume-agent`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.82,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/mock-interview`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/faucet`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    const supabase = createAdminClient()

    const [
      posts,
      categories,
      courses,
      collections,
      questions,
      tags,
      jobs,
    ] = await Promise.all([
      fetchAllPages<PostSitemapRow>((from, to) =>
        supabase
          .from('posts')
          .select('slug, updated_at')
          .eq('published', true)
          .eq('is_public', true)
          .order('updated_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllPages<CategorySitemapRow>((from, to) =>
        supabase
          .from('post_cates')
          .select('slug, created_at')
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllPages<CourseSitemapRow>((from, to) =>
        supabase
          .from('courses')
          .select('id, updated_at')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllPages<CollectionSitemapRow>((from, to) =>
        supabase
          .from('interview_collections')
          .select('id, updated_at')
          .order('updated_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllPages<QuestionSitemapRow>((from, to) =>
        supabase
          .from('interview_question')
          .select('id, updated_at')
          .order('updated_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllPages<TagSitemapRow>((from, to) =>
        supabase
          .from('interview_tags')
          .select('slug, created_at')
          .order('sort', { ascending: true })
          .order('created_at', { ascending: true })
          .range(from, to)
      ),
      fetchAllPages<JobSitemapRow>((from, to) =>
        supabase
          .from('job_listings')
          .select('id, updated_at, last_synced_at')
          .order('updated_at', { ascending: false, nullsFirst: false })
          .range(from, to)
      ),
    ])

    const postPages: SitemapEntry[] = posts.map((post) => ({
      url: `${BASE_URL}/posts/${post.slug}`,
      lastModified: toLastModified(post.updated_at),
      changeFrequency: 'weekly',
      priority: 0.9,
    }))

    const categoryPages: SitemapEntry[] = categories.map((category) => ({
      url: `${BASE_URL}/categories/${category.slug}`,
      lastModified: toLastModified(category.created_at),
      changeFrequency: 'weekly',
      priority: 0.75,
    }))

    const coursePages: SitemapEntry[] = courses.map((course) => ({
      url: `${BASE_URL}/learn?courseId=${course.id}`,
      lastModified: toLastModified(course.updated_at),
      changeFrequency: 'weekly',
      priority: 0.85,
    }))

    const collectionPages: SitemapEntry[] = collections.map((collection) => ({
      url: `${BASE_URL}/interview/${collection.id}`,
      lastModified: toLastModified(collection.updated_at),
      changeFrequency: 'weekly',
      priority: 0.85,
    }))

    const questionPages: SitemapEntry[] = questions.map((question) => ({
      url: `${BASE_URL}/question/${question.id}`,
      lastModified: toLastModified(question.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const tagPages: SitemapEntry[] = tags.map((tag) => ({
      url: `${BASE_URL}/interview?tag=${encodeURIComponent(tag.slug)}`,
      lastModified: toLastModified(tag.created_at),
      changeFrequency: 'weekly',
      priority: 0.75,
    }))

    const jobPages: SitemapEntry[] = jobs.map((job) => ({
      url: `${BASE_URL}/jobs/${job.id}`,
      lastModified: toLastModified(job.updated_at ?? job.last_synced_at),
      changeFrequency: 'weekly',
      priority: 0.75,
    }))

    return [
      ...staticPages,
      ...postPages,
      ...coursePages,
      ...jobPages,
      ...collectionPages,
      ...questionPages,
      ...tagPages,
      ...categoryPages,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
