'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { uploadPostBanner } from '@/lib/uploadPostBanner'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const DRAFT_KEY = 'zood:create-post:draft'

const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[560px] rounded-2xl bg-white px-8 py-10 shadow-sm ring-1 ring-black/5">
      <div className="mb-8 h-5 w-44 animate-pulse rounded-full bg-slate-100" />
      <div className="space-y-4">
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-11/12 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  ),
})

interface Category {
  id: string
  name: string
  slug: string
}

type DraftState = {
  title: string
  slug: string
  excerpt: string
  content: string
  markdown: string
  selectedCategories: string[]
  published: boolean
  isPublic: boolean
}

function formatSavedTime(date: Date | null) {
  if (!date) return '尚未保存'
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CreatePostPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [published, setPublished] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)
  const [showSettings, setShowSettings] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('post_cates').select('*').order('name')

      if (data) {
        setCategories(data)
      }
    }

    if (isAuthenticated) {
      fetchCategories()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || hasRestoredDraft) return

    try {
      const rawDraft = window.localStorage.getItem(DRAFT_KEY)
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as Partial<DraftState>
        setTitle(draft.title ?? '')
        setSlug(draft.slug ?? '')
        setExcerpt(draft.excerpt ?? '')
        setContent(draft.content ?? '')
        setMarkdown(draft.markdown ?? '')
        setSelectedCategories(draft.selectedCategories ?? [])
        setPublished(draft.published ?? false)
        setIsPublic(draft.isPublic ?? true)
        setLastSavedAt(new Date())
      }
    } catch (draftError) {
      console.warn('Restore local draft failed:', draftError)
    } finally {
      setHasRestoredDraft(true)
    }
  }, [isAuthenticated, hasRestoredDraft])

  useEffect(() => {
    if (!hasRestoredDraft) return

    const timer = window.setTimeout(() => {
      const draft: DraftState = {
        title,
        slug,
        excerpt,
        content,
        markdown,
        selectedCategories,
        published,
        isPublic,
      }
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setLastSavedAt(new Date())
    }, 650)

    return () => window.clearTimeout(timer)
  }, [
    title,
    slug,
    excerpt,
    content,
    markdown,
    selectedCategories,
    published,
    isPublic,
    hasRestoredDraft,
  ])

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(bannerFile)
    setBannerPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [bannerFile])

  const clearBannerSelection = () => {
    setBannerFile(null)
    if (bannerInputRef.current) {
      bannerInputRef.current.value = ''
    }
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleEditorChange = (html: string, md: string) => {
    setContent(html)
    setMarkdown(md)
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const clearLocalDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY)
    setLastSavedAt(null)
  }

  const handleSubmit = async (e: React.FormEvent, shouldPublish?: boolean) => {
    e.preventDefault()
    setError('')

    const willPublish = shouldPublish !== undefined ? shouldPublish : published

    if (!title.trim()) {
      setError('请输入文章标题')
      return
    }

    if (!slug.trim()) {
      setError('请输入文章别名')
      return
    }

    if (!markdown.trim()) {
      setError('请输入文章内容')
      return
    }

    if (!user) {
      setError('用户未登录')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const { data: existingPost } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingPost) {
        setError('文章别名已存在，请使用其他别名')
        setIsSubmitting(false)
        return
      }

      let bannerPublicUrl: string | null = null
      if (bannerFile) {
        const up = await uploadPostBanner(supabase, user.id, bannerFile)
        if ('error' in up) {
          setError(up.error)
          setIsSubmitting(false)
          return
        }
        bannerPublicUrl = up.publicUrl
      }

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            title: title.trim(),
            slug: slug.trim(),
            content: markdown,
            excerpt: excerpt.trim() || null,
            banner: bannerPublicUrl,
            author_id: user.id,
            published: willPublish,
            is_public: isPublic,
          },
        ] as any)
        .select()
        .single()

      if (postError) throw postError
      if (!postData) throw new Error('创建文章失败')

      const post = postData as any

      if (selectedCategories.length > 0) {
        const relations = selectedCategories.map((cateId) => ({
          post_id: post.id,
          cate_id: cateId,
        }))

        const { error: relError } = await supabase
          .from('post_cate_relations')
          .insert(relations as any)

        if (relError) {
          console.error('Error creating category relations:', relError)
        }
      }

      clearLocalDraft()
      router.push(`/posts/${post.slug}`)
      router.refresh()
    } catch (err: any) {
      console.error('Error creating post:', err)
      if (err.code === '42501') {
        setError('发布失败：posts 表的 RLS 策略不允许当前用户写入，请先执行 .sql/setup_posts_rls.sql')
      } else {
        setError(err.message || '发布失败，请重试')
      }
      setIsSubmitting(false)
    }
  }

  const wordCount = markdown
    .replace(/[#>*_`[\]()!-]/g, '')
    .trim()
    .replace(/\s+/g, '').length

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)] px-4 py-24">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-9 w-24 rounded-full" />
            <div className="flex gap-3">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="mt-5 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-11/12" />
              <Skeleton className="mt-8 h-80 w-full rounded-2xl" />
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-5 h-32 w-full rounded-2xl" />
              <Skeleton className="mt-4 h-10 w-full rounded-xl" />
              <Skeleton className="mt-3 h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
      <div className="-mt-20 min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)] pt-20 text-slate-900">
        <form onSubmit={(e) => handleSubmit(e)} className="min-h-screen">
        <div className="sticky top-20 z-40 bg-[#f7fafe]/88 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-full px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
              >
                ← 返回
              </Link>
              <div className="hidden h-5 w-px bg-slate-200 sm:block" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {title.trim() || '未命名文档'}
                </p>
                <p className="text-xs text-slate-400">
                  本地自动保存 · {formatSavedTime(lastSavedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900 lg:hidden"
              >
                设置
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, false)}
                disabled={isSubmitting}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? '保存中...' : '存草稿'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, true)}
                disabled={isSubmitting}
                className="rounded-full bg-[#1f6feb] px-5 py-2 text-sm font-bold text-white shadow-[0_12px_30px_rgba(31,111,235,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1a5fd0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>

        <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <section className="min-w-0">
            <div className="mx-auto max-w-4xl rounded-[28px] bg-white px-6 py-8 shadow-[0_18px_80px_rgba(15,23,42,0.06)] ring-1 ring-black/5 sm:px-10 lg:px-14">
              <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500">
                  Web3 / AI 笔记
                </span>
                <span>{wordCount} 字</span>
                <span>·</span>
                <span>{published ? '发布文章' : '草稿模式'}</span>
                <span>·</span>
                <span>{isPublic ? '公开可见' : '仅自己可见'}</span>
              </div>

              <textarea
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="无标题"
                rows={1}
                disabled={isSubmitting}
                className="mb-3 block min-h-[76px] w-full resize-none border-0 bg-transparent text-5xl font-black leading-tight tracking-tight text-slate-950 outline-none placeholder:text-slate-300 disabled:opacity-60"
              />

              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="添加摘要，让读者快速知道这篇文章解决什么问题..."
                rows={2}
                disabled={isSubmitting}
                className="mb-8 block w-full resize-none border-0 bg-transparent text-lg leading-8 text-slate-500 outline-none placeholder:text-slate-300 disabled:opacity-60"
              />

              {bannerPreviewUrl ? (
                <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview is not served by next/image */}
                  <img
                    src={bannerPreviewUrl}
                    alt="封面预览"
                    className="aspect-[2.1/1] w-full object-cover"
                  />
                </div>
              ) : null}

              <Editor
                value={content}
                onChange={handleEditorChange}
                placeholder="输入 / 唤起写作灵感，或者直接开始记录你的 Web3 / AI 学习笔记..."
              />
            </div>
          </section>

          <aside
            className={`${
              showSettings ? 'block' : 'hidden'
            } space-y-4 lg:sticky lg:top-24 lg:block lg:self-start`}
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">发布设置</h2>
                  <p className="text-xs text-slate-400">像文档侧栏一样管理文章信息</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  自动保存
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="slug" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    URL
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="text-xs text-slate-400">/posts/</span>
                    <input
                      id="slug"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="article-slug"
                      disabled={isSubmitting}
                      className="w-full bg-transparent font-mono text-sm text-slate-700 outline-none placeholder:text-slate-300 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="banner" className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      封面
                    </label>
                    {bannerPreviewUrl ? (
                      <button
                        type="button"
                        onClick={clearBannerSelection}
                        disabled={isSubmitting}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                      >
                        移除
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={bannerInputRef}
                    id="banner"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {bannerPreviewUrl ? '更换封面图' : '上传封面图'}
                  </button>
                </div>

                {categories.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      分类
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryToggle(category.id)}
                          disabled={isSubmitting}
                          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                            selectedCategories.includes(category.id)
                              ? 'bg-sky-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPublished((value) => !value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      published
                        ? 'border-sky-300 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="block text-sm font-bold">{published ? '发布' : '草稿'}</span>
                    <span className="text-xs opacity-70">文章状态</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic((value) => !value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isPublic
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="block text-sm font-bold">{isPublic ? '公开' : '私密'}</span>
                    <span className="text-xs opacity-70">可见范围</span>
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              <p className="font-semibold text-slate-700">写作小提示</p>
              <p className="mt-2 leading-6">
                标题和摘要直接在正文上方编辑；URL、封面、分类放在侧栏。内容会先保存到本地草稿，发布成功后自动清空。
              </p>
            </div>
          </aside>
        </main>
      </form>
    </div>
  )
}
