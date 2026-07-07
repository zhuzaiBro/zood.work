'use client'

import { useCallback, useEffect, useState } from 'react'
import CodePlaygroundPanel, {
  type PlaygroundSnippet,
} from '@/components/CodePlaygroundPanel'

const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 760
const MIN_WIDTH = 520
const MIN_HEIGHT = 420
const VIEWPORT_PADDING = 16
const TOP_SAFE = 72

interface DraggableCodePlaygroundProps {
  snippet: PlaygroundSnippet
  runToken: number
  onClose: () => void
}

type Point = { x: number; y: number }
type Size = { width: number; height: number }
type Layout = { position: Point; size: Size }
type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getViewportBounds() {
  return {
    left: VIEWPORT_PADDING,
    top: TOP_SAFE,
    right: window.innerWidth - VIEWPORT_PADDING,
    bottom: window.innerHeight - VIEWPORT_PADDING,
  }
}

function getMaximizedLayout(): Layout {
  if (typeof window === 'undefined') {
    return {
      position: { x: VIEWPORT_PADDING, y: TOP_SAFE },
      size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    }
  }

  const bounds = getViewportBounds()
  return {
    position: { x: bounds.left, y: bounds.top },
    size: {
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
    },
  }
}

function getInitialLayout(): Layout {
  if (typeof window === 'undefined') {
    return {
      position: { x: VIEWPORT_PADDING, y: TOP_SAFE },
      size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    }
  }

  const width = Math.min(DEFAULT_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2)
  const height = Math.min(
    DEFAULT_HEIGHT,
    window.innerHeight - TOP_SAFE - VIEWPORT_PADDING,
  )

  return {
    size: { width, height },
    position: {
      x: Math.max(VIEWPORT_PADDING, (window.innerWidth - width) / 2),
      y: Math.max(TOP_SAFE, (window.innerHeight - height) / 2),
    },
  }
}

export default function DraggableCodePlayground({
  snippet,
  runToken,
  onClose,
}: DraggableCodePlaygroundProps) {
  const [layout, setLayout] = useState(getInitialLayout)
  const [restoreLayout, setRestoreLayout] = useState<Layout | null>(null)
  const [interaction, setInteraction] = useState<
    | { kind: 'drag'; startX: number; startY: number; origin: Point }
    | {
        kind: 'resize'
        direction: ResizeDirection
        startX: number
        startY: number
        origin: Layout
      }
    | null
  >(null)

  const handleDragStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      setRestoreLayout(null)
      setInteraction({
        kind: 'drag',
        startX: event.clientX,
        startY: event.clientY,
        origin: layout.position,
      })
    },
    [layout.position],
  )

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, direction: ResizeDirection) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      setRestoreLayout(null)
      setInteraction({
        kind: 'resize',
        direction,
        startX: event.clientX,
        startY: event.clientY,
        origin: layout,
      })
    },
    [layout],
  )

  const handleToggleMaximize = useCallback(() => {
    if (restoreLayout) {
      setLayout(restoreLayout)
      setRestoreLayout(null)
      return
    }

    setRestoreLayout(layout)
    setLayout(getMaximizedLayout())
  }, [layout, restoreLayout])

  useEffect(() => {
    if (!interaction) return

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = getViewportBounds()

      if (interaction.kind === 'drag') {
        const deltaX = event.clientX - interaction.startX
        const deltaY = event.clientY - interaction.startY
        setLayout((current) => ({
          ...current,
          position: {
            x: clamp(
              interaction.origin.x + deltaX,
              bounds.left,
              bounds.right - current.size.width,
            ),
            y: clamp(
              interaction.origin.y + deltaY,
              bounds.top,
              bounds.bottom - current.size.height,
            ),
          },
        }))
        return
      }

      const deltaX = event.clientX - interaction.startX
      const deltaY = event.clientY - interaction.startY
      const minWidth = Math.min(MIN_WIDTH, bounds.right - bounds.left)
      const minHeight = Math.min(MIN_HEIGHT, bounds.bottom - bounds.top)
      const originLeft = interaction.origin.position.x
      const originTop = interaction.origin.position.y
      const originRight = originLeft + interaction.origin.size.width
      const originBottom = originTop + interaction.origin.size.height

      let nextLeft = originLeft
      let nextRight = originRight
      let nextTop = originTop
      let nextBottom = originBottom

      if (interaction.direction.includes('e')) {
        nextRight = clamp(originRight + deltaX, originLeft + minWidth, bounds.right)
      }

      if (interaction.direction.includes('w')) {
        nextLeft = clamp(originLeft + deltaX, bounds.left, originRight - minWidth)
      }

      if (interaction.direction.includes('s')) {
        nextBottom = clamp(originBottom + deltaY, originTop + minHeight, bounds.bottom)
      }

      if (interaction.direction.includes('n')) {
        nextTop = clamp(originTop + deltaY, bounds.top, originBottom - minHeight)
      }

      setLayout({
        position: { x: nextLeft, y: nextTop },
        size: { width: nextRight - nextLeft, height: nextBottom - nextTop },
      })
    }

    const handlePointerUp = () => {
      setInteraction(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [interaction])

  useEffect(() => {
    const handleResize = () => {
      const bounds = getViewportBounds()
      setLayout((current) => {
        const width = Math.min(current.size.width, bounds.right - bounds.left)
        const height = Math.min(current.size.height, bounds.bottom - bounds.top)
        return {
          size: { width, height },
          position: {
            x: clamp(current.position.x, bounds.left, bounds.right - width),
            y: clamp(current.position.y, bounds.top, bounds.bottom - height),
          },
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const resizeHandles: Array<{
    direction: ResizeDirection
    className: string
    label: string
  }> = [
    {
      direction: 'n',
      label: '向上缩放代码运行窗口',
      className: 'left-4 right-4 top-0 h-3 -translate-y-1/2 cursor-ns-resize',
    },
    {
      direction: 's',
      label: '向下缩放代码运行窗口',
      className: 'bottom-0 left-4 right-4 h-3 translate-y-1/2 cursor-ns-resize',
    },
    {
      direction: 'e',
      label: '向右缩放代码运行窗口',
      className: 'bottom-4 right-0 top-4 w-3 translate-x-1/2 cursor-ew-resize',
    },
    {
      direction: 'w',
      label: '向左缩放代码运行窗口',
      className: 'bottom-4 left-0 top-4 w-3 -translate-x-1/2 cursor-ew-resize',
    },
    {
      direction: 'ne',
      label: '向右上缩放代码运行窗口',
      className: 'right-0 top-0 h-5 w-5 -translate-y-1/2 translate-x-1/2 cursor-nesw-resize',
    },
    {
      direction: 'nw',
      label: '向左上缩放代码运行窗口',
      className: 'left-0 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    },
    {
      direction: 'se',
      label: '向右下缩放代码运行窗口',
      className: 'bottom-0 right-0 h-7 w-7 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
    },
    {
      direction: 'sw',
      label: '向左下缩放代码运行窗口',
      className: 'bottom-0 left-0 h-5 w-5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    },
  ]

  return (
    <div
      className="fixed z-[70]"
      style={{
        left: layout.position.x,
        top: layout.position.y,
        width: layout.size.width,
        height: layout.size.height,
      }}
    >
      <div className="relative h-full w-full">
        <CodePlaygroundPanel
          snippet={snippet}
          runToken={runToken}
          onClose={onClose}
          onDragHandlePointerDown={handleDragStart}
          isMaximized={Boolean(restoreLayout)}
          onToggleMaximize={handleToggleMaximize}
        />
        {resizeHandles.map((handle) => (
          <div
            key={handle.direction}
            role="separator"
            aria-label={handle.label}
            className={`absolute z-20 ${handle.className}`}
            onPointerDown={(event) => handleResizeStart(event, handle.direction)}
          />
        ))}
        <div className="pointer-events-none absolute bottom-2 right-2 z-30 rounded-md bg-white/80 p-1 shadow-sm ring-1 ring-black/10">
          <svg
            viewBox="0 0 18 18"
            className="h-4 w-4 text-slate-500"
            aria-hidden="true"
          >
            <path
              d="M15 15H9M15 15V9M15 11L11 15M10 15H6M15 10V6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
