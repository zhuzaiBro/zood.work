'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// 动态导入 Editor 组件，禁用 SSR
const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900 h-[500px] flex items-center justify-center">
      <div className="text-gray-500">加载编辑器中...</div>
    </div>
  ),
})

interface Category {
  id: string
  name: string
  slug: string
}

export default function CreatePostPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [published, setPublished] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('post_cates')
        .select('*')
        .order('name')
      
      if (data) {
        setCategories(data)
      }
    }

    if (isAuthenticated) {
      fetchCategories()
    }
  }, [isAuthenticated])

  // 自动生成 slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
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
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSubmit = async (e: React.FormEvent, shouldPublish?: boolean) => {
    e.preventDefault()
    setError('')

    // 确定发布状态
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

      // 检查 slug 是否已存在
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

      // 创建文章
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          title: title.trim(),
          slug: slug.trim(),
          content: markdown, // 存储 Markdown
          excerpt: excerpt.trim() || null,
          author_id: user.id,
          published: willPublish,
          is_public: isPublic,
        } as any)
        .select()
        .single()

      if (postError) throw postError
      if (!postData) throw new Error('创建文章失败')

      const post = postData as any

      // 关联分类
      if (selectedCategories.length > 0) {
        const relations = selectedCategories.map(cateId => ({
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

      // 跳转到文章详情页
      router.push(`/posts/${post.slug}`)
      router.refresh()
    } catch (err: any) {
      console.error('Error creating post:', err)
      setError(err.message || '发布失败，请重试')
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">创建新文章</h1>
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            ← 返回
          </Link>
        </div>

        {/* 表单 */}
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
          {/* 标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              文章标题 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="输入文章标题"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              文章别名 (URL) <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-slug"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              将作为文章的 URL 路径，例如：/posts/{slug || 'article-slug'}
            </p>
          </div>

          {/* 摘要 */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
              文章摘要
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="简短描述文章内容（可选）"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* 内容编辑器 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              文章内容 <span className="text-red-500">*</span>
            </label>
            <Editor
              value={content}
              onChange={handleEditorChange}
              placeholder="开始撰写你的文章..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              编辑器内容将自动转换为 Markdown 格式存储
            </p>
          </div>

          {/* 分类选择 */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                选择分类
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategories.includes(category.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    disabled={isSubmitting}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 发布选项 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label htmlFor="published" className="text-sm font-medium">
                发布文章（取消勾选则保存为草稿）
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_public"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label htmlFor="is_public" className="text-sm font-medium">
                公开文章（所有人可见）
              </label>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e as any, true)
              }}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? '发布中...' : '发布文章'}
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e as any, false)
              }}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? '保存中...' : '保存草稿'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

