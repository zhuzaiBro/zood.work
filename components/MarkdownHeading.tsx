interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children?: React.ReactNode
  [key: string]: any
}

function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
}

export function getMarkdownHeadings(content: string) {
  return Array.from(content.matchAll(/^(#{1,6})\s+(.+)$/gm), ([, marks, label]) => {
    const text = label.trim()
    return { id: headingId(text), text, level: marks.length }
  })
}

export default function MarkdownHeading({ level, children, ...props }: HeadingProps) {
  // 从子节点中提取文本
  const text = typeof children === 'string' 
    ? children 
    : Array.isArray(children)
    ? children.map(child => typeof child === 'string' ? child : '').join('')
    : ''

  const id = headingId(text)

  const Tag = `h${level}` as const

  return (
    <Tag
      id={id}
      className="scroll-mt-[calc(var(--site-header-height)+1.5rem)]"
      {...props}
    >
      {children}
    </Tag>
  )
}

