/**
 * 从 tourofrust.com 抓取 Tour of Rust 中文版，生成《Rust 上手》课程 SQL
 * 运行: node .sql/generate_seed_rust_course.mjs
 */
import fs from 'fs'

const BASE = 'https://tourofrust.com'
const TOC_URL = `${BASE}/TOC_zh-cn.html`

const COURSE_ID = 'b2a30001-0001-4001-8001-000000000001'

function chapterUuid(sort) {
  return `b2a3${String(sort).padStart(4, '0')}-0001-4001-8001-${String(100 + sort).padStart(12, '0')}`
}

function lessonUuid(pageNum) {
  return `b2a3${String(pageNum).padStart(4, '0')}-0001-4001-8001-${String(pageNum).padStart(12, '0')}`
}

function decodePlaygroundCode(iframeSrc) {
  if (!iframeSrc) return null
  try {
    const url = new URL(iframeSrc)
    const code = url.searchParams.get('code')
    return code ? decodeURIComponent(code) : null
  } catch {
    return null
  }
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function htmlToMarkdown(html) {
  let s = html.trim()
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '')
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
  s = s.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
  s = s.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  s = s.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
  s = s.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    return `\n\`\`\`rust\n${decodeHtmlEntities(code.trim())}\n\`\`\`\n\n`
  })
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `- ${item.trim()}\n`)
  s = s.replace(/<ul[^>]*>/gi, '\n')
  s = s.replace(/<\/ul>/gi, '\n')
  s = s.replace(/<ol[^>]*>/gi, '\n')
  s = s.replace(/<\/ol>/gi, '\n')
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, p) => `${p.trim()}\n\n`)
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<[^>]+>/g, '')
  s = decodeHtmlEntities(s)
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}

function extractPage(html) {
  const pageMatch = html.match(/<div class="page">([\s\S]*?)<div class="bottomnav">/)
  const titleMatch = html.match(/<div class="page">\s*<h1>([\s\S]*?)<\/h1>/)
  const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/)

  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim()) : '未命名'
  const bodyHtml = pageMatch ? pageMatch[1] : ''
  const markdown = htmlToMarkdown(bodyHtml)
  const code = decodePlaygroundCode(iframeMatch?.[1])

  let content = markdown
  if (code) {
    content += `\n\n### 示例代码\n\n\`\`\`rust\n${code.trim()}\n\`\`\`\n`
  }

  const description = markdown.split('\n').find((line) => line.trim())?.slice(0, 120) || title

  return { title, description, content }
}

function parseToc(html) {
  const chapters = []
  let intro = null

  const introMatch = html.match(/<h1>课程<\/h1>\s*<ul>([\s\S]*?)<\/ul>/)
  if (introMatch) {
    const links = [...introMatch[1].matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)]
    if (links.length) {
      intro = {
        title: '入门',
        lessons: links.map((m) => ({
          href: m[1],
          label: m[2].replace(/<[^>]+>/g, '').trim(),
        })),
      }
    }
  }

  const chapterBlocks = [...html.matchAll(/<h3><a href="[^"]*">([\s\S]*?)<\/a><\/h3>\s*<ul>([\s\S]*?)<\/ul>/g)]
  for (const block of chapterBlocks) {
    const title = block[1].trim()
    const links = [...block[2].matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)].map((m) => ({
      href: m[1],
      label: m[2].trim(),
    }))
    if (links.length) {
      chapters.push({ title, lessons: links })
    }
  }

  return { intro, chapters }
}

function pageNumFromHref(href) {
  const m = href.match(/^(\d+)_zh-cn\.html$/)
  return m ? parseInt(m[1], 10) : null
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function dollarQuote(label, text) {
  let tag = `$${label}$`
  while (text.includes(tag)) tag = `$${label}_${Math.random().toString(36).slice(2)}$`
  return `${tag}${text}${tag}`
}

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`)
  return res.text()
}

async function main() {
  console.log('Fetching TOC...')
  const tocHtml = await fetchText(TOC_URL)
  const { intro, chapters } = parseToc(tocHtml)

  const allSections = []
  if (intro) allSections.push(intro)
  allSections.push(...chapters)

  const lessonRows = []
  let chapterSort = 0

  for (const section of allSections) {
    const currentChapterId = chapterUuid(chapterSort)
    const chapterTitle = section.title
    let lessonSort = 0

    console.log(`Chapter ${chapterSort}: ${chapterTitle} (${section.lessons.length} lessons)`)

    for (const lesson of section.lessons) {
      const pageNum = pageNumFromHref(lesson.href)
      if (pageNum === null) continue

      const url = `${BASE}/${lesson.href}`
      process.stdout.write(`  - ${lesson.label} (${lesson.href})...`)
      const html = await fetchText(url)
      const page = extractPage(html)

      lessonRows.push({
        id: lessonUuid(pageNum),
        chapterId: currentChapterId,
        sort: lessonSort,
        title: `${String(pageNum).padStart(2, '0')}. ${page.title}`,
        description: page.description,
        markdown: page.content,
        pageNum,
      })

      lessonSort += 1
      console.log(' ok')
      await new Promise((r) => setTimeout(r, 120))
    }

    chapterSort += 1
  }

  const chapterRows = allSections.map((section, i) => ({
    id: chapterUuid(i),
    title: section.title,
    sort: i,
    description: `Tour of Rust · ${section.title}`,
  }))

  const lessonIds = lessonRows.map((l) => sqlString(l.id)).join(',\n  ')
  const chapterIdList = chapterRows.map((c) => sqlString(c.id)).join(',\n  ')

  const chapterInserts = chapterRows
    .map(
      (c) => `INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES (${sqlString(c.id)}, ${sqlString(COURSE_ID)}, ${sqlString(c.title)}, ${sqlString(c.description)}, ${c.sort})
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();`
    )
    .join('\n\n')

  const lessonInserts = lessonRows
    .map((l, idx) => {
      const md = dollarQuote(`rust${l.pageNum}`, l.markdown.trim())
      return `INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  ${sqlString(l.id)},
  ${sqlString(l.chapterId)},
  ${sqlString(l.title)},
  ${sqlString(l.description)},
  ${md},
  NULL, NULL, NULL, true, false,
  ${l.sort}
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();`
    })
    .join('\n\n')

  const sql = `-- 《Rust 上手》课程 — 内容来自 Tour of Rust 中文版
-- 来源: https://tourofrust.com/ （参考 03_zh-cn.html 起全部课时）
-- 生成: node .sql/generate_seed_rust_course.mjs
-- 在 Supabase SQL Editor 中执行

BEGIN;

INSERT INTO public.courses (id, title, description, is_free, status, price)
VALUES (
  ${sqlString(COURSE_ID)},
  'Rust 上手',
  '基于 Tour of Rust 中文版的系统入门课，从变量、控制流、所有权到智能指针与项目结构，每课含可运行 Rust 示例代码。内容来源：https://tourofrust.com/',
  true,
  'published',
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status,
  price = EXCLUDED.price,
  updated_at = NOW();

DELETE FROM public.lessons WHERE chapter_id IN (
  ${chapterIdList}
);

DELETE FROM public.chapters WHERE id IN (
  ${chapterIdList}
);

${chapterInserts}

${lessonInserts}

COMMIT;

-- courseId: ${COURSE_ID}
-- 共 ${chapterRows.length} 章、${lessonRows.length} 课
`

  const outPath = new URL('./seed_rust_course.sql', import.meta.url)
  fs.writeFileSync(outPath, sql, 'utf8')
  console.log(`\nWrote ${outPath.pathname}`)
  console.log(`Chapters: ${chapterRows.length}, Lessons: ${lessonRows.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
