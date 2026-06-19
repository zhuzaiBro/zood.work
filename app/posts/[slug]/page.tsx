import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CommentSection from '@/components/CommentSection'
import CodeBlock from '@/components/CodeBlock'
import ArticleToc from '@/components/ArticleToc'
import MarkdownHeading from '@/components/MarkdownHeading'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select('title, excerpt, banner')
    .eq('published', true)
    .eq('is_public', true)

  query = isUuid(slug) ? query.or(`slug.eq.${slug},id.eq.${slug}`) : query.eq('slug', slug)

  const { data: post } = await query.single()
  const postMeta = post as any

  return {
    title: postMeta?.title || '文章详情',
    description: postMeta?.excerpt || '',
    openGraph: postMeta?.banner
      ? { images: [{ url: postMeta.banner }] }
      : undefined,
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select(`
      *,
      author:user_profiles!fk_user_profiles_posts (
        username,
        display_name,
        avatar_url,
        bio
      )
    `)
    .eq('published', true)
    .eq('is_public', true)

  query = isUuid(slug) ? query.or(`slug.eq.${slug},id.eq.${slug}`) : query.eq('slug', slug)

  const { data: post, error } = await query.single()

  if (error || !post) {
    notFound()
  }

  const postData = post as any

  const { data: categories } = await supabase
    .from('post_cate_relations')
    .select(`
      post_cates (
        id,
        name,
        slug
      )
    `)
    .eq('post_id', postData.id)

  return (
    <div className="-mt-20 min-h-screen bg-[#f7f6f2] pt-20 text-slate-900">
      <ArticleToc content={postData.content} />

      <div className="sticky top-20 z-30 border-b border-slate-200/80 bg-[#f7f6f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
            >
              ← 返回
            </Link>
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-700">
                {postData.title}
              </p>
              <p className="text-xs text-slate-400">
                Web3 / AI 笔记 · {postData.created_at ? formatDate(postData.created_at) : '刚刚发布'}
              </p>
            </div>
          </div>

          <Link
            href="/posts/create"
            className="hidden rounded-full bg-[#1f6feb] px-5 py-2 text-sm font-bold text-white shadow-[0_12px_30px_rgba(31,111,235,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#1a5fd0] sm:inline-flex"
          >
            写一篇
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-4xl rounded-[28px] bg-white px-6 py-8 shadow-[0_18px_80px_rgba(15,23,42,0.06)] ring-1 ring-black/5 sm:px-10 lg:px-14">
          <header className="mb-10">
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500">
                Web3 / AI 笔记
              </span>
              <span>{postData.published ? '已发布' : '草稿'}</span>
              <span>·</span>
              <span>{postData.is_public ? '公开可见' : '仅作者可见'}</span>
              {postData.created_at ? (
                <>
                  <span>·</span>
                  <time dateTime={postData.created_at}>{formatDate(postData.created_at)}</time>
                </>
              ) : null}
            </div>

            <h1 className="mb-4 text-5xl font-black leading-tight tracking-tight text-slate-950">
              {postData.title}
            </h1>

            {postData.excerpt ? (
              <p className="mb-7 text-lg leading-8 text-slate-500">
                {postData.excerpt}
              </p>
            ) : null}

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-4 text-slate-500">
              <div className="flex items-center gap-3">
                {postData.author?.avatar_url ? (
                  <Image
                    src={postData.author.avatar_url}
                    alt={postData.author.display_name || postData.author.username || '作者头像'}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full bg-slate-100 object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-400">
                    作
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">
                    {postData.author?.display_name || postData.author?.username || '匿名'}
                  </p>
                  <p className="text-xs text-slate-400">Build in Public</p>
                </div>
              </div>

              {categories && categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map((item: any) => (
                    <Link
                      key={item.post_cates.id}
                      href={`/categories/${item.post_cates.slug}`}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
                    >
                      {item.post_cates.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {postData.banner ? (
              <div className="relative mb-8 aspect-[2.1/1] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                <Image
                  src={postData.banner}
                  alt={`${postData.title} 封面`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 896px"
                  className="object-cover"
                  priority
                />
              </div>
            ) : null}
          </header>

          <div className="document-prose prose prose-lg max-w-none overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock as any,
                h1: (props) => <MarkdownHeading level={1} {...props} />,
                h2: (props) => <MarkdownHeading level={2} {...props} />,
                h3: (props) => <MarkdownHeading level={3} {...props} />,
                h4: (props) => <MarkdownHeading level={4} {...props} />,
                h5: (props) => <MarkdownHeading level={5} {...props} />,
                h6: (props) => <MarkdownHeading level={6} {...props} />,
              }}
            >
              {postData.content}
            </ReactMarkdown>
          </div>

          {postData.author?.bio ? (
            <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">关于作者</h3>
              <p className="mt-2 leading-7 text-slate-600">
                {postData.author.bio}
              </p>
            </div>
          ) : null}

          <div className="mt-12 border-t border-slate-100 pt-8">
            <CommentSection postId={postData.id} />
          </div>
        </article>
      </main>
    </div>
  )
}
