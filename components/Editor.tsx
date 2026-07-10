'use client'

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface EditorProps {
  value?: string
  onChange?: (html: string, markdown: string) => void
  placeholder?: string
}

type BlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'bullet'
  | 'numbered'
  | 'todo'
  | 'quote'
  | 'code'
  | 'table'
  | 'image'
  | 'divider'

type Block = {
  id: string
  type: BlockType
  text: string
  checked?: boolean
  language?: string
  wrap?: boolean
  imageUrl?: string
  alt?: string
}

type DropPlacement = 'before' | 'after'

type BlockShortcut = {
  type: BlockType
  text?: string
  language?: string
}

const codeLanguages = [
  { value: 'text', label: 'Plain Text' },
  { value: 'abap', label: 'ABAP' },
  { value: 'ada', label: 'Ada' },
  { value: 'apacheconf', label: 'Apache' },
  { value: 'apex', label: 'Apex' },
  { value: 'asm6502', label: 'Assembly language' },
  { value: 'bash', label: 'Bash' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'jsx', label: 'JSX' },
  { value: 'python', label: 'Python' },
  { value: 'shell', label: 'Shell' },
  { value: 'solidity', label: 'Solidity' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
  { value: 'docker', label: 'Docker' },
]

const codeLanguageAliases: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  sol: 'solidity',
  cs: 'csharp',
}

const blockOptions: Array<{ type: BlockType; label: string; name: string }> = [
  { type: 'paragraph', label: 'T', name: '正文' },
  { type: 'h1', label: 'H1', name: '一级标题' },
  { type: 'h2', label: 'H2', name: '二级标题' },
  { type: 'h3', label: 'H3', name: '三级标题' },
  { type: 'h4', label: 'H4', name: '四级标题' },
  { type: 'h5', label: 'H5', name: '五级标题' },
  { type: 'bullet', label: '•', name: '无序列表' },
  { type: 'numbered', label: '1.', name: '有序列表' },
  { type: 'todo', label: '☑', name: '任务清单' },
  { type: 'code', label: '{}', name: '代码块' },
  { type: 'quote', label: '“', name: '引用' },
  { type: 'table', label: '▦', name: '表格' },
  { type: 'image', label: '▣', name: '图片' },
  { type: 'divider', label: '—', name: '分割线' },
]

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createBlock(type: BlockType = 'paragraph', text = ''): Block {
  return {
    id: createId(),
    type,
    text,
    checked: type === 'todo' ? false : undefined,
    language: type === 'code' ? 'text' : undefined,
    wrap: type === 'code' ? true : undefined,
  }
}

function createImageBlock(imageUrl: string, alt = ''): Block {
  return {
    ...createBlock('image', alt),
    imageUrl,
    alt,
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatInlineMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
}

function htmlToPlainText(value: string) {
  if (typeof document === 'undefined') {
    return value.replace(/<[^>]*>/g, '').trim()
  }

  const wrapper = document.createElement('div')
  wrapper.innerHTML = value
  return wrapper.textContent?.trim() ?? ''
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeMarkdownCell(text: string) {
  return normalizeWhitespace(text).replace(/\|/g, '\\|').replace(/\n/g, '<br />')
}

function escapeMarkdownInline(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
}

function getElementStyle(element: HTMLElement) {
  try {
    return window.getComputedStyle(element)
  } catch {
    return null
  }
}

function isBoldElement(element: HTMLElement) {
  const tag = element.tagName.toLowerCase()
  if (tag === 'strong' || tag === 'b') return true
  const style = getElementStyle(element)
  const weight = style?.fontWeight ?? element.style.fontWeight
  return weight === 'bold' || Number.parseInt(weight, 10) >= 600
}

function isItalicElement(element: HTMLElement) {
  const tag = element.tagName.toLowerCase()
  if (tag === 'em' || tag === 'i') return true
  const style = getElementStyle(element)
  return (style?.fontStyle ?? element.style.fontStyle) === 'italic'
}

function inlineNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }

  if (!(node instanceof HTMLElement)) return ''

  const tag = node.tagName.toLowerCase()

  if (tag === 'br') return '\n'
  if (tag === 'img') {
    const src = node.getAttribute('src') ?? ''
    const alt = node.getAttribute('alt') ?? ''
    return src ? `![${escapeMarkdownInline(alt)}](${src})` : ''
  }

  const content = Array.from(node.childNodes).map(inlineNodeToMarkdown).join('')
  const normalizedContent = content.trim()
  if (!normalizedContent) return content

  if (tag === 'code') return `\`${normalizedContent.replace(/`/g, '\\`')}\``
  if (tag === 'a') {
    const href = node.getAttribute('href')
    return href ? `[${normalizedContent}](${href})` : normalizedContent
  }

  let result = content
  if (isBoldElement(node)) result = `**${result.trim()}**`
  if (isItalicElement(node)) result = `*${result.trim()}*`

  return result
}

function elementInlineMarkdown(element: HTMLElement) {
  return normalizeWhitespace(Array.from(element.childNodes).map(inlineNodeToMarkdown).join(''))
}

function tableElementToMarkdown(table: HTMLTableElement) {
  const rows = Array.from(table.querySelectorAll('tr'))
    .map((row) =>
      Array.from(row.children)
        .filter((cell) => cell instanceof HTMLTableCellElement)
        .map((cell) => escapeMarkdownCell(elementInlineMarkdown(cell as HTMLElement)))
    )
    .filter((row) => row.length > 0)

  if (!rows.length) return ''

  const columnCount = Math.max(...rows.map((row) => row.length))
  const normalizedRows = rows.map((row) => [
    ...row,
    ...Array.from({ length: columnCount - row.length }, () => ''),
  ])
  const header = normalizedRows[0]
  const divider = Array.from({ length: columnCount }, () => '---')
  const body = normalizedRows.slice(1)

  return [header, divider, ...body].map((row) => `| ${row.join(' | ')} |`).join('\n')
}

function blockTypeFromHeading(tag: string): BlockType {
  if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5') {
    return tag
  }
  return 'paragraph'
}

function htmlToBlocks(value: string): Block[] {
  if (typeof document === 'undefined') return []

  const wrapper = document.createElement('div')
  wrapper.innerHTML = value
  wrapper.querySelectorAll('script, style, meta, link, noscript').forEach((node) => node.remove())

  const blocks: Block[] = []
  const visited = new WeakSet<Element>()

  const appendTextBlock = (type: BlockType, text: string) => {
    const normalized = normalizeWhitespace(text)
    if (normalized) blocks.push(createBlock(type, normalized))
  }

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      appendTextBlock('paragraph', node.textContent ?? '')
      return
    }

    if (!(node instanceof HTMLElement) || visited.has(node)) return

    const tag = node.tagName.toLowerCase()

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5') {
      visited.add(node)
      appendTextBlock(blockTypeFromHeading(tag), elementInlineMarkdown(node))
      return
    }

    if (tag === 'blockquote') {
      visited.add(node)
      appendTextBlock('quote', elementInlineMarkdown(node))
      return
    }

    if (tag === 'pre') {
      visited.add(node)
      if (node.dataset.type === 'table') {
        appendTextBlock('table', node.textContent ?? '')
        return
      }

      const codeElement = node.querySelector('code')
      const codeBlock = createBlock('code', codeElement?.textContent ?? node.textContent ?? '')
      const languageMatch = /language-([\w-]+)/.exec(codeElement?.className ?? '')
      if (languageMatch) codeBlock.language = normalizeCodeLanguage(languageMatch[1])
      blocks.push(codeBlock)
      return
    }

    if (tag === 'ul' || tag === 'ol') {
      visited.add(node)
      Array.from(node.children).forEach((item) => {
        if (!(item instanceof HTMLElement) || item.tagName.toLowerCase() !== 'li') return
        const clone = item.cloneNode(true) as HTMLElement
        clone.querySelectorAll('ul, ol').forEach((nested) => nested.remove())
        appendTextBlock(tag === 'ul' ? 'bullet' : 'numbered', elementInlineMarkdown(clone))
      })
      return
    }

    if (tag === 'table') {
      visited.add(node)
      const markdown = tableElementToMarkdown(node as HTMLTableElement)
      if (markdown) blocks.push(createBlock('table', markdown))
      return
    }

    if (tag === 'img') {
      visited.add(node)
      const src =
        node.getAttribute('src') ??
        node.getAttribute('data-src') ??
        node.getAttribute('data-original-src')
      if (src) {
        blocks.push(createImageBlock(src, node.getAttribute('alt') ?? ''))
      }
      return
    }

    if (tag === 'hr') {
      visited.add(node)
      blocks.push(createBlock('divider'))
      return
    }

    if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article') {
      const directComplexChildren = Array.from(node.children).filter((child) =>
        /^(h[1-5]|p|div|blockquote|pre|ul|ol|table|img|hr|section|article)$/i.test(child.tagName)
      )

      if (directComplexChildren.length) {
        visited.add(node)
        Array.from(node.childNodes).forEach(visit)
        return
      }

      visited.add(node)
      appendTextBlock('paragraph', elementInlineMarkdown(node))
      return
    }

    Array.from(node.childNodes).forEach(visit)
  }

  Array.from(wrapper.childNodes).forEach(visit)

  return blocks
}

function parseInitialBlocks(value: string): Block[] {
  if (!value.trim()) return [createBlock()]

  if (typeof document === 'undefined' || !value.includes('<')) {
    const lines = value.split(/\n{2,}/).filter(Boolean)
    return lines.length ? lines.map((line) => createBlock('paragraph', line.trim())) : [createBlock()]
  }

  const blocks = htmlToBlocks(value)

  if (blocks.length) return blocks

  const plainText = htmlToPlainText(value)
  return plainText ? [createBlock('paragraph', plainText)] : [createBlock()]
}

function markdownTableToRows(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
    .map((line) =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split(/(?<!\\)\|/)
        .map((cell) => cell.replace(/\\\|/g, '|').replace(/<br\s*\/?>/gi, '\n').trim())
    )
}

function blockToHtml(block: Block) {
  const text = formatInlineMarkdown(block.text)

  switch (block.type) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
      return `<${block.type}>${text}</${block.type}>`
    case 'bullet':
      return `<ul><li>${text}</li></ul>`
    case 'numbered':
      return `<ol><li>${text}</li></ol>`
    case 'todo':
      return `<p data-type="todo" data-checked="${block.checked ? 'true' : 'false'}">${block.checked ? '☑' : '☐'} ${text}</p>`
    case 'quote':
      return `<blockquote>${text}</blockquote>`
    case 'code':
      return `<pre><code class="language-${escapeHtml(block.language ?? 'text')}">${escapeHtml(block.text)}</code></pre>`
    case 'table':
      return `<pre data-type="table">${escapeHtml(block.text)}</pre>`
    case 'image':
      return block.imageUrl
        ? `<figure><img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.alt ?? block.text)}" /></figure>`
        : ''
    case 'divider':
      return '<hr />'
    default:
      return `<p>${text}</p>`
  }
}

function blocksToHtml(blocks: Block[]) {
  return blocks.map(blockToHtml).join('')
}

function blocksToMarkdown(blocks: Block[]) {
  let numberedIndex = 1

  return blocks
    .map((block) => {
      const text = block.text.trimEnd()

      if (block.type !== 'numbered') {
        numberedIndex = 1
      }

      switch (block.type) {
        case 'h1':
          return `# ${text}`
        case 'h2':
          return `## ${text}`
        case 'h3':
          return `### ${text}`
        case 'h4':
          return `#### ${text}`
        case 'h5':
          return `##### ${text}`
        case 'bullet':
          return `- ${text}`
        case 'numbered': {
          const markdown = `${numberedIndex}. ${text}`
          numberedIndex += 1
          return markdown
        }
        case 'todo':
          return `- [${block.checked ? 'x' : ' '}] ${text}`
        case 'quote':
          return text
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')
        case 'code':
          return `\`\`\`${block.language && block.language !== 'text' ? block.language : ''}\n${block.text.trimEnd()}\n\`\`\``
        case 'table':
          return block.text.trim()
        case 'image':
          return block.imageUrl ? `![${block.alt ?? block.text}](${block.imageUrl})` : ''
        case 'divider':
          return '---'
        default:
          return text
      }
    })
    .join('\n\n')
    .trim()
}

function getBlockLabel(type: BlockType) {
  return blockOptions.find((option) => option.type === type)?.label ?? 'T'
}

function getTextareaClass(type: BlockType) {
  const base =
    'block w-full resize-none overflow-hidden border-0 bg-transparent outline-none disabled:opacity-60'

  switch (type) {
    case 'h1':
      return `${base} text-4xl font-black leading-tight tracking-tight text-slate-950`
    case 'h2':
      return `${base} text-3xl font-extrabold leading-snug text-slate-950`
    case 'h3':
      return `${base} text-2xl font-bold leading-snug text-slate-900`
    case 'h4':
      return `${base} text-xl font-bold leading-8 text-slate-900`
    case 'h5':
      return `${base} text-lg font-bold leading-8 text-slate-800`
    case 'quote':
      return `${base} text-lg leading-8 text-slate-500`
    case 'code':
      return `${base} rounded-2xl bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-cyan-100`
    case 'table':
      return `${base} rounded-2xl bg-white px-4 py-3 font-mono text-sm leading-6 text-slate-600 ring-1 ring-slate-200`
    case 'image':
      return `${base} text-sm leading-6 text-slate-500`
    default:
      return `${base} text-[17px] leading-8 text-slate-700`
  }
}

function getNumberedIndex(blocks: Block[], index: number) {
  let count = 1
  for (let i = index - 1; i >= 0; i -= 1) {
    if (blocks[i].type !== 'numbered') break
    count += 1
  }
  return count
}

function normalizeCodeLanguage(language: string) {
  const normalized = language.trim().toLowerCase()
  return codeLanguageAliases[normalized] ?? normalized ?? 'text'
}

function getBlockShortcut(text: string): BlockShortcut | null {
  if (/^#{1,5}$/.test(text)) {
    return { type: `h${text.length}` as BlockType, text: '' }
  }

  if (text === '`') {
    return { type: 'code', text: '', language: 'text' }
  }

  const codeMatch = /^```([\w-]*)$/.exec(text)
  if (codeMatch) {
    return {
      type: 'code',
      text: '',
      language: codeMatch[1] ? normalizeCodeLanguage(codeMatch[1]) : 'text',
    }
  }

  if (text === '>') {
    return { type: 'quote', text: '' }
  }

  if (text === '---') {
    return { type: 'divider', text: '' }
  }

  if (text === '-' || text === '*') {
    return { type: 'bullet', text: '' }
  }

  if (text === '1.') {
    return { type: 'numbered', text: '' }
  }

  if (text === '[]' || text === '[ ]') {
    return { type: 'todo', text: '' }
  }

  return null
}

function normalizePastedText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/\\n/g, '\n')
}

function splitPastedTextIntoSegments(text: string) {
  const normalized = normalizePastedText(text)
  const segments = normalized
    .split('\n')
    .map((segment) => segment.trim())
    .filter(Boolean)

  return segments.length > 1 ? segments : null
}

export default function Editor({
  value = '',
  onChange,
}: EditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseInitialBlocks(value))
  const [activeBlockId, setActiveBlockId] = useState(() => blocks[0]?.id ?? '')
  const [menuBlockId, setMenuBlockId] = useState<string | null>(null)
  const [slashBlockId, setSlashBlockId] = useState<string | null>(null)
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null)
  const [dragOverPlacement, setDragOverPlacement] = useState<DropPlacement>('before')
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null)
  const textareasRef = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const onChangeRef = useRef(onChange)
  const hasUserEditedRef = useRef(false)
  const didMountRef = useRef(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!value || hasUserEditedRef.current) return

    const nextBlocks = parseInitialBlocks(value)
    setBlocks(nextBlocks)
    setActiveBlockId(nextBlocks[0]?.id ?? '')
  }, [value])

  useEffect(() => {
    blocks.forEach((block) => {
      const textarea = textareasRef.current[block.id]
      if (!textarea) return
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    })
  }, [blocks])

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    onChangeRef.current?.(blocksToHtml(blocks), blocksToMarkdown(blocks))
  }, [blocks])

  const commitBlocks = (nextBlocks: Block[]) => {
    hasUserEditedRef.current = true
    setBlocks(nextBlocks)
  }

  const focusBlock = (blockId: string, cursorAtEnd = true) => {
    window.setTimeout(() => {
      const textarea = textareasRef.current[blockId]
      if (!textarea) return
      textarea.focus()
      if (cursorAtEnd) {
        const end = textarea.value.length
        textarea.setSelectionRange(end, end)
      }
    }, 0)
  }

  const changeBlockType = (blockId: string, type: BlockType) => {
    commitBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              type,
              checked: type === 'todo' ? block.checked ?? false : undefined,
              language: type === 'code' ? block.language ?? 'text' : undefined,
              wrap: type === 'code' ? block.wrap ?? true : undefined,
              imageUrl: type === 'image' ? block.imageUrl : undefined,
              alt: type === 'image' ? block.alt ?? block.text : undefined,
            }
          : block
      )
    )
    setMenuBlockId(null)
    setSlashBlockId(null)
    setActiveBlockId(blockId)
    focusBlock(blockId)
  }

  const updateBlockText = (blockId: string, text: string) => {
    commitBlocks(blocks.map((block) => (block.id === blockId ? { ...block, text } : block)))
    setActiveBlockId(blockId)
    setSlashBlockId(text.endsWith('/') ? blockId : null)
  }

  const toggleTodo = (blockId: string) => {
    commitBlocks(
      blocks.map((block) =>
        block.id === blockId ? { ...block, checked: !block.checked, type: 'todo' } : block
      )
    )
    setActiveBlockId(blockId)
  }

  const applyBlockShortcut = (blockId: string, shortcut: BlockShortcut) => {
    commitBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              type: shortcut.type,
              text: shortcut.text ?? block.text,
              checked: shortcut.type === 'todo' ? false : undefined,
              language: shortcut.type === 'code' ? shortcut.language ?? 'text' : undefined,
              wrap: shortcut.type === 'code' ? true : undefined,
              imageUrl: shortcut.type === 'image' ? block.imageUrl : undefined,
              alt: shortcut.type === 'image' ? block.alt ?? block.text : undefined,
            }
          : block
      )
    )
    setActiveBlockId(blockId)
    setMenuBlockId(null)
    setSlashBlockId(null)
    focusBlock(blockId, false)
  }

  const insertBlockAfter = (blockId: string, type: BlockType = 'paragraph', text = '') => {
    const nextBlock = createBlock(type, text)
    const index = blocks.findIndex((block) => block.id === blockId)
    const nextBlocks = [...blocks]
    nextBlocks.splice(index + 1, 0, nextBlock)
    commitBlocks(nextBlocks)
    setActiveBlockId(nextBlock.id)
    setMenuBlockId(null)
    setSlashBlockId(null)
    focusBlock(nextBlock.id)
  }

  const updateCodeBlock = (
    blockId: string,
    patch: Partial<Pick<Block, 'language' | 'wrap'>>
  ) => {
    commitBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              ...patch,
            }
          : block
      )
    )
    setActiveBlockId(blockId)
  }

  const updateBlockMeta = (blockId: string, patch: Partial<Pick<Block, 'text' | 'imageUrl' | 'alt'>>) => {
    commitBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              ...patch,
            }
          : block
      )
    )
    setActiveBlockId(blockId)
  }

  const copyCodeBlock = async (block: Block) => {
    try {
      await navigator.clipboard.writeText(block.text)
      setCopiedBlockId(block.id)
      window.setTimeout(() => setCopiedBlockId(null), 1600)
    } catch (error) {
      console.error('Copy code failed:', error)
    }
  }

  const splitBlock = (block: Block, cursor: number) => {
    const index = blocks.findIndex((item) => item.id === block.id)
    if (index === -1) return

    const before = block.text.slice(0, cursor)
    const after = block.text.slice(cursor)
    const nextBlock = createBlock(block.type === 'code' ? 'code' : 'paragraph', after)
    const nextBlocks = blocks.map((item) =>
      item.id === block.id ? { ...item, text: before } : item
    )
    nextBlocks.splice(index + 1, 0, nextBlock)

    commitBlocks(nextBlocks)
    setActiveBlockId(nextBlock.id)
    setSlashBlockId(null)
    focusBlock(nextBlock.id, false)
  }

  const exitCodeBlock = (block: Block, cursor: number) => {
    const index = blocks.findIndex((item) => item.id === block.id)
    if (index === -1) return

    const beforeCursor = block.text.slice(0, cursor)
    const afterCursor = block.text.slice(cursor).replace(/^\n/, '')
    const codeText = beforeCursor.replace(/\n?```$/, '')
    const nextBlock = createBlock('paragraph', afterCursor)
    const nextBlocks = blocks.map((item) =>
      item.id === block.id ? { ...item, text: codeText } : item
    )
    nextBlocks.splice(index + 1, 0, nextBlock)

    commitBlocks(nextBlocks)
    setActiveBlockId(nextBlock.id)
    setSlashBlockId(null)
    setMenuBlockId(null)
    focusBlock(nextBlock.id, false)
  }

  const removeEmptyBlock = (block: Block) => {
    if (blocks.length <= 1 || block.text) return

    const index = blocks.findIndex((item) => item.id === block.id)
    const previousBlock = blocks[Math.max(0, index - 1)]
    const nextBlocks = blocks.filter((item) => item.id !== block.id)
    commitBlocks(nextBlocks)
    setActiveBlockId(previousBlock.id)
    setSlashBlockId(null)
    focusBlock(previousBlock.id)
  }

  const moveBlock = (
    sourceBlockId: string,
    targetBlockId: string,
    placement: DropPlacement
  ) => {
    if (sourceBlockId === targetBlockId) return

    const sourceIndex = blocks.findIndex((block) => block.id === sourceBlockId)
    const targetIndex = blocks.findIndex((block) => block.id === targetBlockId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const nextBlocks = [...blocks]
    const [movedBlock] = nextBlocks.splice(sourceIndex, 1)
    let adjustedTargetIndex = nextBlocks.findIndex((block) => block.id === targetBlockId)
    if (placement === 'after') {
      adjustedTargetIndex += 1
    }
    nextBlocks.splice(adjustedTargetIndex, 0, movedBlock)

    commitBlocks(nextBlocks)
    setActiveBlockId(movedBlock.id)
    setMenuBlockId(null)
    setSlashBlockId(null)
    focusBlock(movedBlock.id)
  }

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, blockId: string) => {
    setDraggingBlockId(blockId)
    setDragOverBlockId(null)
    setDragOverPlacement('before')
    setMenuBlockId(null)
    setSlashBlockId(null)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', blockId)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, blockId: string) => {
    if (!draggingBlockId || draggingBlockId === blockId) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    const rect = event.currentTarget.getBoundingClientRect()
    const placement = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    setDragOverBlockId(blockId)
    setDragOverPlacement(placement)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetBlockId: string) => {
    event.preventDefault()

    const sourceBlockId = event.dataTransfer.getData('text/plain') || draggingBlockId
    if (sourceBlockId) {
      moveBlock(sourceBlockId, targetBlockId, dragOverPlacement)
    }

    setDraggingBlockId(null)
    setDragOverBlockId(null)
    setDragOverPlacement('before')
  }

  const handleDragEnd = () => {
    setDraggingBlockId(null)
    setDragOverBlockId(null)
    setDragOverPlacement('before')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, block: Block) => {
    if (event.key === ' ') {
      const cursor = event.currentTarget.selectionStart
      const prefix = block.text.slice(0, cursor)
      const suffix = block.text.slice(cursor)
      const shortcut = !suffix ? getBlockShortcut(prefix.trim()) : null

      if (shortcut) {
        event.preventDefault()
        applyBlockShortcut(block.id, shortcut)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && block.type === 'code') {
      const cursor = event.currentTarget.selectionStart
      const beforeCursor = block.text.slice(0, cursor)

      if (/(^|\n)```$/.test(beforeCursor)) {
        event.preventDefault()
        exitCodeBlock(block, cursor)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && block.type !== 'code') {
      const cursor = event.currentTarget.selectionStart
      const prefix = block.text.slice(0, cursor)
      const suffix = block.text.slice(cursor)
      const shortcut = !suffix ? getBlockShortcut(prefix.trim()) : null

      if (shortcut?.type === 'code') {
        event.preventDefault()
        applyBlockShortcut(block.id, shortcut)
        return
      }

      event.preventDefault()
      splitBlock(block, cursor)
      return
    }

    if (event.key === 'Backspace' && !block.text) {
      event.preventDefault()
      removeEmptyBlock(block)
      return
    }

    if (event.key === '/' && !block.text.trim()) {
      setSlashBlockId(block.id)
    }

    if (event.key === 'Escape') {
      setSlashBlockId(null)
      setMenuBlockId(null)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>, block: Block) => {
    if (block.type === 'code') return

    const pastedHtml = event.clipboardData.getData('text/html')
    if (pastedHtml) {
      const parsedBlocks = htmlToBlocks(pastedHtml)

      if (parsedBlocks.length) {
        const index = blocks.findIndex((item) => item.id === block.id)
        if (index === -1) return

        event.preventDefault()

        const selectionStart = event.currentTarget.selectionStart ?? block.text.length
        const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart
        const before = block.text.slice(0, selectionStart)
        const after = block.text.slice(selectionEnd)
        const nextBlocks = [...blocks]
        const replacementBlocks: Block[] = []

        if (before.trim()) {
          replacementBlocks.push({
            ...block,
            text: before,
          })
        }

        replacementBlocks.push(...parsedBlocks)

        if (after.trim()) {
          replacementBlocks.push(createBlock('paragraph', after))
        }

        nextBlocks.splice(index, 1, ...replacementBlocks)
        commitBlocks(nextBlocks)

        const focusTarget =
          [...replacementBlocks].reverse().find((item) => !['image', 'divider'].includes(item.type)) ??
          replacementBlocks[replacementBlocks.length - 1]
        setActiveBlockId(focusTarget.id)
        setMenuBlockId(null)
        setSlashBlockId(null)
        focusBlock(focusTarget.id)
        return
      }
    }

    const pastedText = event.clipboardData.getData('text/plain')
    const segments = splitPastedTextIntoSegments(pastedText)

    if (!segments) return

    const index = blocks.findIndex((item) => item.id === block.id)
    if (index === -1) return

    event.preventDefault()

    const selectionStart = event.currentTarget.selectionStart ?? block.text.length
    const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart
    const before = block.text.slice(0, selectionStart)
    const after = block.text.slice(selectionEnd)

    const nextBlocks = [...blocks]
    const insertedBlocks = segments.map((segment, segmentIndex) =>
      segmentIndex === 0 ? { ...block, text: segment } : createBlock('paragraph', segment)
    )

    insertedBlocks[0] = {
      ...insertedBlocks[0],
      text: `${before}${segments[0]}`,
    }

    const lastBlock = insertedBlocks[insertedBlocks.length - 1]
    insertedBlocks[insertedBlocks.length - 1] = {
      ...lastBlock,
      text: `${lastBlock.text}${after}`,
    }

    nextBlocks.splice(index, 1, ...insertedBlocks)
    commitBlocks(nextBlocks)

    const focusTarget = insertedBlocks[insertedBlocks.length - 1]
    setActiveBlockId(focusTarget.id)
    setMenuBlockId(null)
    setSlashBlockId(null)
    focusBlock(focusTarget.id)
  }

  return (
    <div className="relative min-h-[620px] rounded-[28px] bg-white px-3 py-10 text-slate-900">
      <div className="space-y-1">
        {blocks.map((block, index) => {
          const isActive = block.id === activeBlockId
          const showLeftTools = isActive || menuBlockId === block.id || slashBlockId === block.id
          const isDragging = draggingBlockId === block.id
          const isDragTarget = dragOverBlockId === block.id && draggingBlockId !== block.id

          return (
            <div
              key={block.id}
              onDragOver={(event) => handleDragOver(event, block.id)}
              onDrop={(event) => handleDrop(event, block.id)}
              className={`group relative -mx-12 grid grid-cols-[48px_minmax(0,1fr)] rounded-xl px-2 py-1 transition ${
                isActive ? 'bg-[#edf2ff]' : 'hover:bg-slate-50'
              } ${isDragging ? 'scale-[0.99] opacity-45' : ''} ${
                isDragTarget ? 'bg-blue-50' : ''
              }`}
            >
              {isDragTarget ? (
                <div
                  className={`pointer-events-none absolute left-14 right-2 z-20 h-0.5 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.16)] ${
                    dragOverPlacement === 'after' ? 'bottom-[-3px]' : 'top-[-3px]'
                  }`}
                />
              ) : null}

              <div
                className={`flex items-start justify-end gap-1 pt-1 transition ${
                  showLeftTools ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setMenuBlockId(menuBlockId === block.id ? null : block.id)}
                  className="h-8 min-w-8 rounded-lg border border-slate-200 bg-white px-1 text-xs font-bold text-blue-500 shadow-sm hover:border-blue-200 hover:bg-blue-50"
                  title="块菜单"
                >
                  {getBlockLabel(block.type)}
                </button>
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => handleDragStart(event, block.id)}
                  onDragEnd={handleDragEnd}
                  className="grid h-8 w-5 cursor-grab place-items-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
                  title="拖拽调整顺序"
                  aria-label="拖拽调整文本块顺序"
                >
                  ⋮⋮
                </button>
              </div>

              <div
                className={`relative min-w-0 ${
                  block.type === 'quote'
                    ? 'border-l-4 border-slate-200 pl-4'
                    : ''
                }`}
              >
                {block.type === 'bullet' ? (
                  <span className="absolute left-0 top-[7px] text-lg text-slate-500">•</span>
                ) : null}

                {block.type === 'numbered' ? (
                  <span className="absolute left-0 top-[8px] text-sm font-semibold text-slate-500">
                    {getNumberedIndex(blocks, index)}.
                  </span>
                ) : null}

                {block.type === 'todo' ? (
                  <button
                    type="button"
                    onClick={() => toggleTodo(block.id)}
                    className={`absolute left-0 top-[9px] h-5 w-5 rounded-md border text-xs transition ${
                      block.checked
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-slate-300 bg-white text-transparent hover:border-blue-400'
                    }`}
                    aria-label="切换任务状态"
                  >
                    ✓
                  </button>
                ) : null}

                {block.type === 'divider' ? (
                  <button
                    type="button"
                    onFocus={() => setActiveBlockId(block.id)}
                    onClick={() => setActiveBlockId(block.id)}
                    className="my-4 block w-full rounded-xl px-2 py-4 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-100"
                    aria-label="分割线"
                  >
                    <span className="block h-px w-full bg-slate-200" />
                  </button>
                ) : block.type === 'image' ? (
                  <div
                    role="group"
                    tabIndex={0}
                    onFocus={() => setActiveBlockId(block.id)}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus-within:ring-2 focus-within:ring-blue-100"
                  >
                    {block.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- pasted remote/data images are user content
                      <img
                        src={block.imageUrl}
                        alt={block.alt ?? block.text}
                        className="max-h-[520px] w-full object-contain bg-slate-50"
                      />
                    ) : (
                      <div className="grid min-h-36 place-items-center bg-slate-50 text-sm text-slate-400">
                        图片地址为空
                      </div>
                    )}
                    <div className="border-t border-slate-100 px-4 py-3">
                      <input
                        value={block.text}
                        onFocus={() => setActiveBlockId(block.id)}
                        onChange={(event) =>
                          updateBlockMeta(block.id, {
                            text: event.target.value,
                            alt: event.target.value,
                          })
                        }
                        placeholder="添加图片说明"
                        className="w-full border-0 bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                ) : block.type === 'table' ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {markdownTableToRows(block.text).length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                          <tbody>
                            {markdownTableToRows(block.text).map((row, rowIndex) => (
                              <tr
                                key={`${block.id}-row-${rowIndex}`}
                                className={rowIndex === 0 ? 'bg-slate-50 font-bold text-slate-700' : ''}
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={`${block.id}-cell-${rowIndex}-${cellIndex}`}
                                    className="border border-slate-200 px-3 py-2 align-top text-slate-600"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                    <textarea
                      ref={(node) => {
                        textareasRef.current[block.id] = node
                      }}
                      value={block.text}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(event) => updateBlockText(block.id, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(event, block)}
                      onPaste={(event) => handlePaste(event, block)}
                      placeholder="| 表头 | 表头 |\n| --- | --- |\n| 内容 | 内容 |"
                      rows={3}
                      className={`${getTextareaClass(block.type)} mt-3`}
                    />
                  </div>
                ) : block.type === 'code' ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fa] shadow-sm">
                    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">▾</span>
                        <span className="text-base font-medium text-slate-600">代码块</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={block.language ?? 'text'}
                          onChange={(event) =>
                            updateCodeBlock(block.id, {
                              language: normalizeCodeLanguage(event.target.value),
                            })
                          }
                          className="max-w-[180px] rounded-lg border-0 bg-transparent px-2 py-1 text-sm font-medium text-slate-600 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-100"
                          aria-label="选择代码语言"
                        >
                          {codeLanguages.map((language) => (
                            <option key={language.value} value={language.value}>
                              {language.label}
                            </option>
                          ))}
                        </select>

                        <span className="h-5 w-px bg-slate-200" />

                        <button
                          type="button"
                          onClick={() =>
                            updateCodeBlock(block.id, {
                              wrap: !(block.wrap ?? true),
                            })
                          }
                          className={`rounded-lg px-2 py-1 text-sm font-medium transition ${
                            block.wrap ?? true
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-500 hover:bg-white hover:text-slate-700'
                          }`}
                        >
                          自动换行
                        </button>

                        <span className="h-5 w-px bg-slate-200" />

                        <button
                          type="button"
                          onClick={() => copyCodeBlock(block)}
                          className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-700"
                        >
                          {copiedBlockId === block.id ? '已复制' : '复制'}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`grid grid-cols-[56px_minmax(0,1fr)] px-0 py-4 ${
                        block.wrap ?? true ? '' : 'overflow-x-auto'
                      }`}
                    >
                      <div className="select-none border-r border-slate-200 px-3 text-right font-mono text-sm leading-6 text-slate-400">
                        {Array.from({
                          length: Math.max(1, block.text.split('\n').length),
                        }).map((_, lineIndex) => (
                          <div key={`${block.id}-line-${lineIndex}`}>{lineIndex + 1}</div>
                        ))}
                      </div>

                      <div
                        className={`relative min-h-6 px-4 ${
                          block.wrap ?? true ? '' : 'min-w-[720px]'
                        }`}
                      >
                        <SyntaxHighlighter
                          language={block.language ?? 'text'}
                          style={oneLight}
                          PreTag="div"
                          wrapLongLines={block.wrap ?? true}
                          customStyle={{
                            margin: 0,
                            padding: 0,
                            background: 'transparent',
                            minHeight: '1.5rem',
                            overflow: 'visible',
                            fontSize: '0.875rem',
                            lineHeight: '1.5rem',
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          }}
                          codeTagProps={{
                            style: {
                              fontFamily: 'inherit',
                              whiteSpace: block.wrap ?? true ? 'pre-wrap' : 'pre',
                            },
                          }}
                        >
                          {block.text || ' '}
                        </SyntaxHighlighter>

                        <textarea
                          ref={(node) => {
                            textareasRef.current[block.id] = node
                          }}
                          value={block.text}
                          onFocus={() => setActiveBlockId(block.id)}
                          onChange={(event) => updateBlockText(block.id, event.target.value)}
                          onKeyDown={(event) => handleKeyDown(event, block)}
                          onPaste={(event) => handlePaste(event, block)}
                          placeholder=""
                          rows={1}
                          spellCheck={false}
                          wrap={block.wrap ?? true ? 'soft' : 'off'}
                          className={`absolute inset-x-4 top-0 min-h-6 resize-none overflow-hidden border-0 bg-transparent p-0 font-mono text-sm leading-6 text-transparent caret-slate-900 outline-none selection:bg-blue-200/70 ${
                            block.wrap ?? true ? 'whitespace-pre-wrap' : 'whitespace-pre'
                          }`}
                          style={{
                            WebkitTextFillColor: 'transparent',
                            width: 'calc(100% - 2rem)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <textarea
                    ref={(node) => {
                      textareasRef.current[block.id] = node
                    }}
                    value={block.text}
                    onFocus={() => setActiveBlockId(block.id)}
                    onChange={(event) => updateBlockText(block.id, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, block)}
                    onPaste={(event) => handlePaste(event, block)}
                    placeholder=""
                    rows={1}
                    className={`${getTextareaClass(block.type)} ${
                      block.type === 'bullet' || block.type === 'numbered' || block.type === 'todo'
                        ? 'pl-8'
                        : ''
                    }`}
                  />
                )}

                {menuBlockId === block.id ? (
                  <div className="absolute left-[-64px] top-[-66px] z-40 flex w-max max-w-[calc(100vw-120px)] items-center gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/70">
                    {blockOptions.map((option) => (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => changeBlockType(block.id, option.type)}
                        className={`grid h-12 min-w-12 place-items-center rounded-2xl px-3 text-lg font-bold transition ${
                          block.type === option.type
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title={option.name}
                      >
                        {option.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => insertBlockAfter(block.id)}
                      className="grid h-12 min-w-12 place-items-center rounded-2xl px-3 text-lg font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      title="在下方添加"
                    >
                      +
                    </button>
                  </div>
                ) : null}

                {slashBlockId === block.id ? (
                  <div className="absolute left-0 top-10 z-30 w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/50">
                    <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      快捷插入
                    </p>
                    {blockOptions.map((option) => (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => {
                          const text = block.text.endsWith('/') ? block.text.slice(0, -1) : block.text
                          commitBlocks(
                            blocks.map((item) =>
                              item.id === block.id
                                ? {
                                    ...item,
                                    type: option.type,
                                    text,
                                    checked: option.type === 'todo' ? false : undefined,
                                    language: option.type === 'code' ? item.language ?? 'text' : undefined,
                                    wrap: option.type === 'code' ? item.wrap ?? true : undefined,
                                    imageUrl: option.type === 'image' ? item.imageUrl : undefined,
                                    alt: option.type === 'image' ? item.alt ?? text : undefined,
                                  }
                                : item
                            )
                          )
                          setSlashBlockId(null)
                          focusBlock(block.id)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-xs">
                          {option.label}
                        </span>
                        {option.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => insertBlockAfter(blocks[blocks.length - 1].id)}
        className="mt-2 block min-h-[220px] w-full cursor-text rounded-2xl border-0 bg-transparent text-left outline-none transition hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-blue-100"
        aria-label="点击下方空白处添加文本块"
      />
    </div>
  )
}
